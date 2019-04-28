'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	provider: { type: String, default: 'HDConsulting' },
	provider_id: { type: String, default: 'IDConsulting' },
	name: { type: String, required: true },
	surname: { type: String },
	email: { type: String, required: true, unique: true },
	role: { type: String, default: 'ROLE_USER' },
	password: { type: String },
	image: { type: String, default: 'noimage.png' },
	position: { type: String },
	urlFacebook: { type: String },
	urlTwitter: { type: String },
	urlLinkedin: { type: String },
	isLogout: {type:Date, default: Date.now},
	resetPasswordToken: { type: String, default: 'Nun' },
	resetPasswordExpires: { type: Date, default: Date.now },
	verified: {type:Boolean, default:false},
	verifiedToken: { type: String, default: 'Nun' },
	verifiedTokenExpires: { type: Date, default: Date.now },
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