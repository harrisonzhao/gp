'use strict';
require('rootpath')();
//var cql = require('libs/database/cassandra/cassandraClient.js').cql;

var cassandra = require('libs/cassandra/cql');
var cql = require('config/index.js').cassandra.cql;
var multiline = require('multiline');

var INSERT_PLAYER_CQL = multiline(function() {/*
  INSERT INTO players (
    currvalue, first_name, last_name, player_id, team_id, age, biography 
  ) VALUES 
    (?, ?, ?, ?, ?, ?);
*/});
exports.insert = function (fields, callback) {
  //parse values
  cassandra.query(INSERT_PLAYER_CQL, fields, cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var DELETE_PLAYER_CQL = multiline(function() {/*
  DELETE FROM players WHERE
    player_id
  IN
    (?);
*/});
exports.delete = function (player_id, callback) {
  cassandra.query(DELETE_PLAYER_CQL, [player_id], cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var UPDATE_PLAYER_CQL_1 = multiline(function() {/*
  UPDATE players SET
*/});
var UPDATE_PLAYER_CQL_2 = multiline(function() {/*
  WHERE
    player_id = ?;
*/});
exports.update = function (player_id, fields, params, callback) {
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

  cassandra.query(UPDATE_PLAYER_CQL_1 + ' ' + updates + ' '
    + UPDATE_PLAYER_CQL_2,
    params.concat([player_id]), cql.types.consistencies.one,
    function (err) {
      callback(err);
    });
};

var SELECT_PLAYER_CQL = multiline(function () {/*
  SELECT * FROM players WHERE
*/});

var allowed_fields = ['player_id', 'team_id'];

exports.select = function (field, value, callback) {
  if (allowed_fields.indexOf(field) < 0) {
    callback(new Error('Field is not a searchable field.'));
  } else {
    cassandra.queryOneRow(
      SELECT_PLAYER_CQL + ' ' + field + ' = ?;',
      [value],
      cql.types.consistencies.one,
      function(err, result) {
        callback(err, result);
    });
  }
};