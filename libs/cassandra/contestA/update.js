/**
 * ====================================================================
 * Author: Harrison Zhao
 * ====================================================================
 */
//TODO: convert over resell queries too
'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var configs = require('config/index.js');
var cql = configs.cassandra.cql;
var multiline = require('multiline');
var one = cql.types.consistencies.one;
var constants = configs.constants;
var states = constants.contestAbets.STATES;
var OVER = constants.contestAbets.POSITIONS.OVER;
var UNDER = constants.contestAbets.POSITIONS.UNDER;
var MINUTE_IN_MILLISECONDS = constants.globals.MINUTE_IN_MILLISECONDS;
var DEFAULT_USERNAME = constants.contestAbets.DEFAULT_USERNAME;
var APPLIED = constants.cassandra.APPLIED;

var PENDING = states.PENDING;
var ACTIVE = states.ACTIVE;
var PROCESSED = states.PROCESSED;
var EXPIRED = states.EXPIRED;

/**
 * ====================================================================
 * UPDATE QUERIES FOR BET EXCHANGING
 * ====================================================================
 */

var INSERT_BET_CQL = multiline(function() {/*
  INSERT INTO contest_a_bets (
    athlete_id,
    athlete_image,
    athlete_name,
    athlete_position,
    athlete_team,
    bet_id,
    bet_state,
    bettor_usernames,
    expirations,
    fantasy_value,
    game_id,
    is_selling_position,
    old_prices,
    payoff,
    prices,
    sport
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?);
*/});

var BETTOR_USERNAMES_INDEX = 7;
var EXPIRATIONS_INDEX = 8;
var FANTASY_VALUE_INDEX = 9;
var IS_SELLING_POSITION_INDEX = 11;
var OLD_PRICES_INDEX = 12;
var PAYOFF_INDEX = 13;
var PRICES_INDEX = 14;

/**
 * inserts a contestA bet into database
 * @param  {array}   params
 * array of values for insertion into database
 * see above for fields
 * @param  {Function} callback
 * args (err)
 */
function insert(params, callback) {
  params[BETTOR_USERNAMES_INDEX] = {
    value: params[BETTOR_USERNAMES_INDEX],
    hint: 'map'
  };
  params[EXPIRATIONS_INDEX] = {
    value: params[EXPIRATIONS_INDEX],
    hint: 'map'
  };
  params[FANTASY_VALUE_INDEX] = {
    value: params[FANTASY_VALUE_INDEX],
    hint: 'double'
  };
  params[IS_SELLING_POSITION_INDEX] = {
    value: params[IS_SELLING_POSITION_INDEX],
    hint: 'map'
  };
  params[PAYOFF_INDEX] = {
    value: params[PAYOFF_INDEX],
    hint: 'double'
  };

  params[OLD_PRICES_INDEX][OVER] = {
    value: params[OLD_PRICES_INDEX][OVER],
    hint: 'double'
  };
  params[OLD_PRICES_INDEX][UNDER] = {
    value: params[OLD_PRICES_INDEX][UNDER],
    hint: 'double'
  };
  params[OLD_PRICES_INDEX] = {
    value: params[OLD_PRICES_INDEX],
    hint: 'map'
  };

  params[PRICES_INDEX][OVER] = {
    value: params[PRICES_INDEX][OVER],
    hint: 'double'
  };
  params[PRICES_INDEX][UNDER] = {
    value: params[PRICES_INDEX][UNDER],
    hint: 'double'
  };
  params[PRICES_INDEX] = {
    value: params[PRICES_INDEX],
    hint: 'map'
  };
  cassandra.query(INSERT_BET_CQL, params, one, callback);
}
/**
 * inserts pending bets
 * @param  {uuid}   athleteId
 * @param  {string}   athleteName
 * @param  {string}   athleteTeam
 * @package {timeuuid}  betId
 * @param  {int}   expirationTimeMinutes
 * @param  {double}   fantasyValue
 * @param  {uuid}   gameId
 * uuid for game player is playing in
 * @param  {string}   sport
 * @param  {double}   wager
 * amount it costs to initially buy the bet
 * @param  {string}   username
 * get from req.user
 * @param  {boolean}  isOverBettor
 * @param  {Function} callback
 * args: err
 */
function insertPending(
  athleteId,
  athleteImage,
  athleteName,
  athletePosition,
  athleteTeam,
  betId,
  expirationTimeMinutes,
  fantasyValue,
  gameId,
  isOverBettor,
  sport,
  username,
  wager,
  callback) {

  var bettorUsernames = {};
  bettorUsernames[OVER] = DEFAULT_USERNAME;
  bettorUsernames[UNDER] = DEFAULT_USERNAME;
  var isSellingPosition = {};
  isSellingPosition[OVER] = false;
  isSellingPosition[UNDER] = false;
  var expiration = new Date(
    ((new Date()).getTime()) +
    (expirationTimeMinutes * MINUTE_IN_MILLISECONDS));
  var expirations = {};
  expirations[OVER] = new Date(0);
  expirations[UNDER] = new Date(0);
  var payoff = 2 * wager;
  var oldPrices = {};
  oldPrices[OVER] = 0;
  oldPrices[UNDER] = 0;
  var prices = {};
  prices[OVER] = 0;
  prices[UNDER] = 0;

  var position;
  var otherPosition;
  if (isOverBettor) {
    position = OVER;
    otherPosition = UNDER;
  }
  else {
    position = UNDER;
    otherPosition = OVER;
  }
  bettorUsernames[position] = username;
  expirations[otherPosition] = expiration;
  isSellingPosition[otherPosition] = true;
  prices[otherPosition] = wager;

  insert(
  [
    athleteId,
    athleteImage,
    athleteName,
    athletePosition,
    athleteTeam,
    betId,
    PENDING,
    bettorUsernames,
    expirations,
    fantasyValue,
    gameId,
    isSellingPosition,
    oldPrices,
    payoff,
    prices,
    sport
  ],
  function(err) {
    callback(err);
  });
}

var TAKE_PENDING_BET_CQL = multiline(function() {/*
  UPDATE
    contest_a_bets
  SET
    bet_state = ?,
    bettor_usernames[?] = ?,
    expirations[?] = 0,
    is_selling_position[?] = false,
    old_prices[?] = ?,
    prices[?] = 0
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    prices[?] = ?
  AND
    is_selling_position[?] = true

  AND
    athlete_id = ?
  AND
    athlete_name = ?
  AND
    athlete_team = ?
  AND
    bettor_usernames[?] = ?
  AND
    fantasy_value = ?
  AND
    game_id = ?;
*/});
function takePending(
  athleteId,
  athleteName,
  athleteTeam,
  betId,
  fantasyValue,
  gameId,
  opponent,
  overNotUnder,
  username, 
  wager, 
  callback) {

  var position;
  var otherPosition;
  if (overNotUnder) {
    position = OVER;
    otherPosition = UNDER;
  }
  else {
    position = UNDER;
    otherPosition = OVER;
  }
  cassandra.queryOneRow(
    TAKE_PENDING_BET_CQL,
    [
      ACTIVE,
      position,
      username,
      position,
      position,
      position,
      {value: wager, hint: 'double'},
      position,
      betId,
      PENDING,
      position,
      {value: wager, hint: 'double'},
      position,
      athleteId,
      athleteName,
      athleteTeam,
      otherPosition,
      opponent,
      {value: fantasyValue, hint: 'double'},
      gameId
    ],
    one,
    function(err, result) {
      if (err) {
        callback(err);
      }
      else if (result[APPLIED]) {
        callback(null);
      }
      else {
        callback(new Error(APPLIED));
      }
    });
}

var RESELL_BETTER_CQL = multiline(function() {/*
  UPDATE
    contest_a_bets
  SET
    is_selling_position[?] = true,
    expirations[?] = ?,
    prices[?] = ?
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    bettor_usernames[?] = ?
  AND
    is_selling_position[?] = false;
*/});

function placeResell(
  betId,
  expirationTime,
  isOverBettor,
  resellPrice,
  username,
  callback) {
  var position;
  if (isOverBettor) {
    position = OVER;
  }
  else {
    position = UNDER;
  }
  cassandra.queryOneRow(
    RESELL_BETTER_CQL,
    [
      position,
      position,
      new Date((new Date()).getTime()+expirationTime * MINUTE_IN_MILLISECONDS),
      position,
      resellPrice,
      betId,
      ACTIVE,
      username,
      position
    ],
    one,
    function(err, result) {
      if (err) {
        callback(err);
      }
      else if (result[APPLIED]) {
        callback(null);
      }
      else {
        callback(new Error(APPLIED));
      }
    });
}

//everything after is_selling_position is extra verification and bet history
var TAKE_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_a_bets
  SET
    bettor_usernames[?] = ?,
    is_selling_position[?] = false,
    expirations[?] = ?,
    old_prices[?] = ?,
    prices[?] = 0
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    prices[?] = ?
  AND
    is_selling_position[?] = true

  AND
    athlete_id = ?
  AND
    athlete_name = ?
  AND
    athlete_team = ?
  AND
    bettor_usernames[?] = ?
  AND
    fantasy_value = ?;
*/});

function takeResell(
  athleteId,
  athleteName,
  athleteTeam,
  betId,
  fantasyValue,
  opponent,
  overNotUnder, 
  resellPrice,
  username,  
  callback) {
  
  var position;
  var otherPosition;
  if (overNotUnder) {
    position = OVER;
    otherPosition = UNDER;
  }
  else {
    position = UNDER;
    otherPosition = OVER;
  }
  cassandra.queryOneRow(
    TAKE_RESELL_CQL,
    [
      position,
      username,
      position,
      position,
      0,
      position,
      resellPrice,
      position,
      betId,
      ACTIVE,
      position,
      resellPrice,
      position,

      athleteId,
      athleteName,
      athleteTeam,
      otherPosition,
      opponent,
      fantasyValue
    ],
    one,
    function(err, result) {
      if (err) {
        callback(err);
      }
      else if (result[APPLIED]) {
        callback(null);
      }
      else {
        callback(new Error(APPLIED));
      }
    });
}

//delete pending query does not work at the moment, manually construct query
var DELETE_PENDING_BET_CQL = multiline(function() {/*
  DELETE FROM
    contest_a_bets
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    bettor_usernames[?] = ?
  AND
    bettor_usernames[?] = ?
  AND
    prices[?] = ?;
*/});
function deletePending(betId, isOverBettor, username, wager, callback) {
  var position1;
  var position2;
  if (isOverBettor) {
    position1 = OVER;
    position2 = UNDER;
  }
  else {
    position1 = UNDER;
    position2 = OVER;
  }
  cassandra.queryOneRow(
    DELETE_PENDING_BET_CQL,
    [
      betId,
      PENDING,
      position1, 
      username,
      position2,
      DEFAULT_USERNAME,
      position2, 
      {value: wager, hint: 'double'}
    ],
    one,
    function(err, result) {
      if (err) {
        callback(err);
      }
      else if (result[APPLIED]) {
        callback(null);
      }
      else {
        callback(new Error(APPLIED));
      }
    });
}

var DELETE_BET_CQL = multiline(function() {/*
  DELETE FROM
    contest_a_bets
  WHERE
    bet_id = ?;
*/});
function deleteBet(betId, callback) {
  cassandra.query(DELETE_BET_CQL, [betId], one, callback);
}

var RECALL_RESELL_CQL = multiline(function() {/*
  UPDATE
    contest_A_bets
  SET
    is_selling_position[?] = false,
    expirations[?] = 0,
    prices[?] = 0
  WHERE
    bet_id = ?
  IF
    bet_state = ?
  AND
    bettor_usernames[?] = ?
  AND
    is_selling_position[?] = true
  AND
    prices[?] = ?;
*/});

function recallResell(betId, isOverBettor, price, username, callback) {
  var position;
  if (isOverBettor) {
    position = OVER;
  }
  else {
    position = UNDER;
  }
  cassandra.query(
    RECALL_RESELL_CQL,
    [
      position,
      position,
      position,
      betId,
      ACTIVE,
      position,
      username,
      position,
      position,
      price
    ],
    one,
    function(err, result) {
      if (err) {
        callback(err);
      }
      else if (result[APPLIED]) {
        callback(null);
      }
      else {
        callback(new Error(APPLIED));
      }
    });
}

/**
 * ====================================================================
 * UPDATE QUERIES FOR BET STATES
 * ====================================================================
 */

var UPDATE_STATE_CQL = multiline(function() {/*
  UPDATE 
    contest_a_bets
  SET 
    bet_state = ?
  WHERE
    bet_id = ?;
*/});

/**
 * [updateBetState description]
 * @param  {int}   nextState 
 * 0-3, defined in constants.contestABets.STATES
 * @param  {timeuuid}   betId
 * @param  {Function} callback
 * args: (err)
 */
function updateBetState(nextState, betId, callback) {
  //need to do function(err) {callback(err)} for callback
  cassandra.query(
    UPDATE_STATE_CQL, 
    [nextState, betId], 
    one, 
    function(err) {
      callback(err);
    });
}

exports.setPending = function(betId, callback) {
  updateBetState(PENDING, betId, callback);
}

exports.setActive = function(betId, callback) {
  updateBetState(ACTIVE, betId, callback);
}

exports.setProcessed = function(betId, callback) {
  updateBetState(PROCESSED, betId, callback);
}

exports.setExpired = function(betId, callback) {
  updateBetState(EXPIRED, betId, callback);
}

/**
 * ====================================================================
 * EXPORTS
 * ====================================================================
 */

exports.insertPending = insertPending;
exports.takePending = takePending;
exports.placeResell = placeResell;
exports.takeResell = takeResell;
exports.deletePending = deletePending;
exports.deleteBet = deleteBet;
exports.recallResell = recallResell;