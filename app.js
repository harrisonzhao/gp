'use strict';
(require('rootpath')());

var express = require('express');
var app = module.exports = express();
var configs = require('config/index');
configs.configure(app);

//mount on on other modules
//keep this file clean
require('libs/backgroundProcesses/backgroundProcesses').start();

app.use('/', require('routes/index'));

app.listen(3000);