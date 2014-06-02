'use strict';
(require('rootpath')());

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var INSERT_USER_CQL = multiline(function() {/*
  INSERT INTO users (
    user_id, email, verified, verified_time, username, password, first_name,
    last_name, age, address, payment_info, money, fbid, VIP_status
  ) VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
*/});
exports.insert = function (fields, callback) {
  //parse values
  cassandra.query(INSERT_USER_CQL, fields, cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_USER_CQL = multiline(function() {/*
  DELETE FROM users WHERE
    user_id
  IN
    (?);
*/});
exports.delete = function (user_id, callback) {
  cassandra.query(DELETE_USER_CQL, [user_id], cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var UPDATE_USER_CQL_1 = multiline(function() {/*
  UPDATE users SET
*/});
var UPDATE_USER_CQL_2 = multiline(function() {/*
  WHERE
    user_id = ?;
*/});
exports.update = function (user_id, fields, params, callback) {
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

  cassandra.query(UPDATE_USER_CQL_1 + ' ' + updates + ' ' + UPDATE_USER_CQL_2,
    params.concat([user_id]), cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var SELECT_BETS_MULTIPLE_CQL_1 = multiline(function () {/*
  SELECT * FROM
*/});
var SELECT_BETS_MULTIPLE_CQL_2 = multiline(function () {/*
  WHERE bet_id IN
*/});
exports.selectMultiple = function (bets_table, params, callback) {
  var paramsLength = params.length;
  var filter = '';

  for (var i = 0; i < paramsLength; i++) {
    filter += '?';

    if (i < (paramsLength - 1)) {
      filter += ', ';
    }
  }

  cassandra.query(SELECT_BETS_MULTIPLE_CQL_1 + ' ' + bets_table + ' ' + SELECT_BETS_MULTIPLE_CQL_2 + ' (' + filter + ');',
    params, cql.types.consistencies.one,
    function (err, result) {
      console.log(result);
      callback(err, result);
    });
}

var SELECT_BETS_USING_USER_ID_CQL = multiline(function () {/*
  SELECT * FROM user_id_to_bet_id WHERE
    user_id = ?;
*/});
exports.selectUsingUserID = function (bets_table, user_id, callback) {
  console.log(callback);
  var betIDs = [];

  cassandra.query(SELECT_BETS_USING_USER_ID_CQL,
      [user_id], cql.types.consistencies.one, 
      function(err, result) {
        if (err) {
          callback(err);
        }

        if (result) {
          for (var i = 0; i < result.length; i++) {
            betIDs[i] = result[i].bet_id;
          }

          exports.selectMultiple(bets_table, betIDs, function (err, result) {
            callback(err, result);
          });
        }
        else {
          callback(err);
        }
    });
}