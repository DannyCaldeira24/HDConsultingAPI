'use strict'

var express = require('express');
var ChatController = require('../controllers/chat');
var md_auth = require('../middlewares/auth');

var api = express.Router();

//Update user

api.post('/room-join', ChatController.joinRoom);
api.post('/send-message', ChatController.sendMessage);
api.get('/notifications/:id', [md_auth.ensureAuth], ChatController.getNotifications);
api.post('/contacts-notifications', [md_auth.ensureAuth], ChatController.getContactsNotifications);
api.post('/read-messages', [md_auth.ensureAuth], ChatController.readMessages);
//Get profile image of user

module.exports = api;