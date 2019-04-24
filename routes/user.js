'use strict'

var express = require('express');
var UserController = require('../controllers/user');

var api = express.Router();
var md_auth = require('../middlewares/auth');
var md_admin = require('../middlewares/admin');

var multipart = require('connect-multiparty');
var md_upload = multipart({ uploadDir: './uploads/users' });

var configMensaje = require('../configMensaje');

//Update user
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
//Upload profile image of user
api.post('/upload-image/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
//Get profile image of user
api.get('/get-image/:imageFile', UserController.getImageFile);
//Register
api.post('/register', UserController.saveUser);
//Login with jwt
api.post('/login', UserController.login);
//Request change password for forgetting
api.post('/forgot', UserController.forgotPassword);
//Reset password after request
api.post('/reset-password', UserController.resetPassword);
//Contact form
api.post('/contact', (req, res) => {
    configMensaje(req.body);
    res.status(200).send({
        message: "Gracias por escribirnos, proximamente nos pondremos en contacto con usted."
    });
});
api.put('/verified/:token', UserController.verifiedEmail);
api.put('/add-sn/:id', [md_auth.ensureAuth, md_admin.isAdmin], UserController.addSocialNetwork);
//Get users-admin
api.get('/get-contacts/:id', UserController.getContacts);
api.get('/get-admins', UserController.getAdmins);
//Logout
api.post('/logout/:id', md_auth.ensureAuth, UserController.logout);
api.post('/logout-social/:id', UserController.logout);

module.exports = api;