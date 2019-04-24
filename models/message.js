'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../models/user').schema;
var Room = require('../models/room').schema;

var MessageSchema = Schema({
    content:{
        type:String,
        default:''
    },
    user: {type: Schema.ObjectId, ref: "User"},
    room: {type: Schema.ObjectId, ref: "Room"},
	createdAt: {
        type: Date,
        default: Date.now
    },
    deletedAt:{
        type:Date
    }
});

module.exports = mongoose.model('Message',MessageSchema);