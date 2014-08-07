/*
 * =============================================================================
 * Author: Harrison Zhao
 * Date: 8/1/2014
 * Documentation:
 * must have jquery before this
 * include this file before any other non-jquery file to access athletes
 *
 * exports the object contestALoadAthletesCache
 * which has methods:
 *   -getAthleteById
 *     args: (id)
 *     returns: athlete object
 *   -getAthletesArray
 *     returns: array of all athletes
 * =============================================================================
 */
//must have jquery before this
//include this file before any other non-jquery file
'use strict';

(function(exports) {
  var athletesList = [];
  var athletesIdMap = {};

  /**
   * returns an athlete object corresponding to given id
   * @param  {uuid} id
   * @return {object}    athlete object
   */
  function getAthleteById(id) {
    return athletesList[athletesIdMap[id]];
  }

  function getAthletesArray() {
    return athletesList;
  }

  function loadAthletesFromServer() {
    $.ajax({
      url: '/initialAthletesLoad',
      type: 'GET',

      //gets data from server
      //the data is a JSON stringified object
      //{
      //  athletesList: array of athlete objects,
      //  athletesIdMap: object keyed by athleteId 
      //    and values index of athlete in array
      //}
      success: function(data) {
        data = JSON.parse(data);
        athletesList = data.athletesList;
        athletesIdMap = data.athletesIdMap;
      },
      error: function(xhr, status, err) {
        console.error(xhr, status, err);
      }
    });
  }

  loadAthletesFromServer();
  exports.getAthleteById = getAthleteById;
  exports.getAthletesArray = getAthletesArray;
}(typeof exports === 'undefined' ? 
    window.contestALoadAthletesCache = {} : 
    exports));