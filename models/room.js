'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../models/user').schema;

var RoomSchema = Schema({
    name: {
        type: String
    },
    users:[{type: Schema.ObjectId, ref: "User"}],
    description: {
        type: String,
        default:'SINGLE_CHAT'
    },
	createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Room',RoomSchema);