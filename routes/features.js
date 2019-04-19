'use strict'

var express = require('express');
var FeatureController = require('../controllers/features');

var api = express.Router();
var md_auth = require('../middlewares/auth');
var md_admin = require('../middlewares/admin');

var multipart = require('connect-multiparty');
var md_upload = multipart({ uploadDir: './uploads/projects' });

//Update user

api.post('/save-project', [md_auth.ensureAuth,md_admin.isAdmin], FeatureController.saveProject);
api.put('/update-project/:id', [md_auth.ensureAuth,md_admin.isAdmin], FeatureController.updateProject);
api.post('/upload-image-project/:id', [md_auth.ensureAuth, md_upload, md_admin.isAdmin], FeatureController.uploadImage);
api.get('/get-image-project/:imageFile', FeatureController.getImageFile);
api.delete('/delete-project/:id', [md_auth.ensureAuth,md_admin.isAdmin], FeatureController.deleteProject);
api.get('/projects', FeatureController.getProjects);
api.get('/project/:id', FeatureController.getProject);
//Get profile image of user

module.exports = api;