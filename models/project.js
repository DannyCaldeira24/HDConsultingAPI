'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../models/user');

var ProjectSchema = Schema({
    name: {
        type: String
    },
    slogan:{
        type:String
    },
    description: {
        type: String
    },
    client:{
        type:String
    },
    dateDeploy:{
        type:Date
    },
    image:{
        type:String
    },
    users:[{
        type: Schema.ObjectId, ref: User
    }],
    urlProject:{
        type:String
    },
	createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Project',ProjectSchema);