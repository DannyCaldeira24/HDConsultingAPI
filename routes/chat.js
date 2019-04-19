'use strict'

var express = require('express');
var ChatController = require('../controllers/chat');

var api = express.Router();

//Update user

api.post('/room-join', ChatController.joinRoom);
api.post('/send-message', ChatController.sendMessage);
//Get profile image of user

module.exports = api;