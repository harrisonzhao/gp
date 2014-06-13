'use strict';
require('rootpath')();

/*
CREATE TABLE IF NOT EXISTS baseball_player (
  player_id uuid,
  full_name text,
  first_name text,
  last_name text,
  team text,
  status text,
  position text,
  profile_url text,
  uniform_number text,
  height text,
  weight text,
  age int,
  image text,
  current_value double,
  importance_rank int,
  playing_today boolean,
  statistics list<uuid>,
  PRIMARY KEY (team, full_name)
);
 */
var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

//17 fields
var INSERT_PLAYER_CQL = multiline(function() {/*
  INSERT INTO baseball_player (
    player_id uuid,
    full_name text,
    first_name text,
    last_name text,
    team text,
    status text,
    position text,
    profile_url text,
    uniform_number text,
    height text,
    weight text,
    age int,
    image text,
    current_value double,
    importance_rank int,
    playing_today boolean,
    statistics list<uuid>
  ) VALUES
    (?, ?, ?, ?, ?, 
     ?, ?, ?, ?, ?, 
     ?, ?, ?, ?, ?, 
     ?, ?);
*/});

exports.insert = function (fields, callback) {
  cassandra.query(INSERT_PLAYER_CQL, fields, cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_PLAYER_CQL = multiline(function() {/*
  DELETE FROM baseball_player WHERE player_id = ?;
*/});
exports.delete = function (playerId, callback) {
  cassandra.query(DELETE_PLAYER_CQL, [playerId], cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var UPDATE_PLAYER_CQL_1 = multiline(function() {/*
  UPDATE baseball_player SET
*/});
var UPDATE_PLAYER_CQL_2 = multiline(function() {/*
  WHERE
    player_id = ?;
*/});
exports.update = function (playerId, fields, params, callback) {
  var fieldsLength = fields.length;
  var paramsLength = params.length;
  var updates = '';

  if (fields.length !== params.length) {
    callback(new Error('Number of fields and parameters are not the same.'));
  }

  for (var i = 0; i < fieldsLength; i++) {
    updates += (fields[i] + ' = ?');

    if (i < (fieldsLength - 1)) {
      updates += ', ';
    }
  }

  cassandra.query(
    UPDATE_PLAYER_CQL_1 + ' ' + updates + ' ' + UPDATE_PLAYER_CQL_2,
    params.concat([playerId]), 
    cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var SELECT_PLAYER_CQL = multiline(function () {/*
  SELECT * FROM baseball_player WHERE player_id = ?;
*/});
exports.select = function (playerId, callback) {
  cassandra.queryOneRow(
    SELECT_PLAYER_CQL,
    [playerId], 
    cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
  });
};

var SELECT_PLAYERS_USING_TEAM_CQL = multiline(function () {/*
  SELECT * FROM baseball_player WHERE team = ?;
*/});
exports.selectUsingTeam = function (team, callback) {
  cassandra.query(
    SELECT_PLAYERS_USING_TEAM_CQL, 
    [team], 
    cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    });
}

var SELECT_PLAYER_IMAGES_USING_PLAYERNAME = multiline(function() {/*
  SELECT * FROM player_images WHERE full_name = ?;
*/});
var SELECT_PLAYER_IMAGES_USING_NICKNAME = multiline(function() {/*
  SELECT * FROM player_images WHERE nickname = ?;
*/});
exports.selectImagesUsingPlayerName = function(playerName, callback) {
  cassandra.query(
    SELECT_PLAYER_IMAGES_USING_PLAYERNAME,
    [playerName], 
    cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    }
  );
}

var AUTOCOMPLETE_QUERY = multiline(function() {/*
  SELECT player_id, full_name, nickname FROM football_player
*/});
exports.selectAllPlayerNames = function(callback) {
  cassandra.query(AUTOCOMPLETE_QUERY, [], cql.types.consistencies.one,
    function(err, result) {
      callback(err, result);
    }
  );
}