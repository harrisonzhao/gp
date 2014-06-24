require('multiline');
exports.defaultPlayerImage = 'http://2.bp.blogspot.com/-6QyJDHjB5XE/Uscgo2DVBdI/AAAAAAAACS0/DFSFGLBK_fY/s1600/facebook-default-no-profile-pic.jpg';
exports.profileStrings = {
  incorrectUsername: '{ "title": "Incorrect username", "parts": ["We couldn\'t find any user with the username you provided.", "Please try again with a different username."] }',
  deleteError: '{ "title": "Delete error", "parts": ["Something went wrong while deleting a file."] }',
  uploadError:'{ "title": "Upload error", "parts": ["Something went wrong while uploading a file."] }'
};
exports.auth = {
  incorrectUsername: '{ "title": "Incorrect username", "parts": ["We couldn\'t find any user with the username you provided.", "Please try a different username and try again, or sign up."] }',
  incorrectPassword: '{ "title": "Incorrect password", "parts": ["The provided username and password didn\'t match anyone in our records.", "Please check your spelling and try again." ]}'
};
exports.mlbKey='grnayxvqv4zxsamxhsc59agu';
exports.contestB = {
  gameType: 'daily prophet',
  //for update.js states
  OPEN: 0,
  FILLED: 1,
  TO_PROCESS: 2,
  PROCESSED:3,
  CANCELLED:4,
  //for lock.js times and tries
  MAX_MILLISECONDS: 20000,
  MAX_TRIES: 20,
  MAX_WAIT: 1000
}