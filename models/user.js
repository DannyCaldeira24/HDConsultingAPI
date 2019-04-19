'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	name: { type: String, required: true },
	surname: { type: String },
	email: { type: String, required: true, unique: true },
	provider: { type: String, default: 'HDConsulting' },
	provider_id: { type: String, default: 'null' },
	role: { type: String, default: 'ROLE_USER' },
	password: { type: String },
	image: { type: String, default: 'noimage.png' },
	resetPasswordToken: { type: String, default: 'null' },
	resetPasswordExpires: { type: Date, default: Date.now },
	urlFacebook: { type: String },
	urlTwitter: { type: String },
	urlLinkedin: { type: String },
	position: { type: String },
	verifiedToken: { type: String, default: 'null' },
	verifiedTokenExpires: { type: Date, default: Date.now },
	verified: {type:Boolean, default:false},
	online: {
		type: Boolean,
		default: false
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
});

module.exports = mongoose.model('User', UserSchema);