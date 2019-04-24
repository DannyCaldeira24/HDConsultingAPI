'use strict'
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

var hbs = require('nodemailer-express-handlebars'),
	email = process.env.MAILER_EMAIL_ID || 'hdconsultingweb@gmail.com',
	pass = process.env.MAILER_PASSWORD || 'gqvdrztdkusvugxd';

var smtpTransport = nodemailer.createTransport({
	service: process.env.MAILER_SERVICE_PROVIDER || 'Gmail',
	auth: {
		user: email,
		pass: pass
	}
});

var handlebarsOptions = {
	viewEngine: {
		extname: '.html',
		layoutsDir: 'templates/email/',
		partialsDir: 'templates/partials/'
	},
	viewPath: path.resolve('./templates/email/'),
	extName: '.html'
};

smtpTransport.use('compile', hbs(handlebarsOptions));

//modelos
var User = require('../models/user');

//service jwt
var jwt = require('../services/jwt');

//acciones

function saveUser(req, res) {
	//Crear objeto usuario
	var user = new User();
	//Recoger parametros de la petición
	var params = req.body;
	if (params.name && params.surname && params.email) {
		//Asignar valores al objeto user
		user.name = params.name;
		user.surname = params.surname;
		user.email = params.email;
		user.role = 'ROLE_USER';
		if (params.provider) {
			user.provider = params.provider;
			user.provider_id = params.provider_id;
			user.verified = true;
			user.image = params.image;
		} else {
			user.image = 'noimage.png';
		}
		//Verificar si no es usuario duplicado
		User.findOne({ email: user.email.toLowerCase() }, (err, issetuser) => {
			if (err) {
				res.status(200).send({ message: err, provider: true });
			} else {
				if (!issetuser) {
					//Cifrar password
					//console.log(params);
					if (!params.provider) {
						if (params.password == params.verifyPassword) {
							bcrypt.hash(params.password, null, null, function (err, hash) {
								user.password = hash;
							});
							async.waterfall([
								function (done) {
									// create the random token
									crypto.randomBytes(20, function (err, buffer) {
										var token = buffer.toString('hex');
										done(err, token);
									});
								},
								function (token, done) {
									user.verifiedToken = token;
									user.verifiedTokenExpires = Date.now() + 86400000;
									var data = {
										to: user.email,
										from: 'hdconsultingweb@gmail.com',
										template: 'verified-email',
										subject: 'Confirm email account - HDConsulting',
										context: {
											url: process.env.CLIENT+'verified/' + token,
											name: user.name.split(' ')[0]
										}
									};

									smtpTransport.sendMail(data, function (err) {
										if (!err) {
											//Guardo usuario en DB
											user.save((err, userStored) => {
												if (err) {
													res.status(500).send({ message: 'ERROR: No se logro guardar el Usuario' });
												} else {
													if (!userStored) {
														res.status(404).send({ message: 'ERROR: No se ha registrado el Usuario' });
													} else {
														return res.status(200).send({
															message: 'Le hemos enviado un correo electronico con un enlace para que pueda verificar su cuenta',
															user: userStored
														});
													}
												}
											});
										} else {
											return res.status(422).send({
												message: 'Ha ocurrido un error al enviar el mensaje'
											});
										}
									});
								}
							], function (err) {
								return res.status(422).json({ message: err });
							});
						} else {
							res.status(500).send({ erro: 'Las contraseñas no coinciden' });
						}
					} else {
						user.save((err, userStored) => {
							if (err) {
								res.status(500).send({ message: 'ERROR: No se logro guardar el Usuario' });
							} else {
								if (!userStored) {
									res.status(404).send({ message: 'ERROR: No se ha registrado el Usuario' });
								} else {
									return res.status(200).send({
										message: 'Gracias por registrarte, ahora puedes iniciar sesión con nosotros siempre que quieras con tu cuenta de ' + params.provider,
										user: userStored
									});
								}
							}
						});
					}

				} else {
					if (issetuser.provider == 'HDConsulting' && !params.provider) {
						res.status(200).send({ message: 'ERROR: Ya existe un usuario con este correo electronico' });
					} else {
						if (params.provider && issetuser.provider == params.provider) {
							issetuser.online = true;
							issetuser.save((err, userLoggedIn) => {
								if (err) {
									res.status(500).send({ message: err });
								} else {
									if (userLoggedIn) {
										res.status(200).send({ userSocial: userLoggedIn });
									}
								}
							});
						} else {
							if (issetuser.provider == 'HDConsulting') {
								res.status(500).send({ message: 'El correo electronico en cuestion se encuentra asociado a una cuenta de HDConsulting, si le olvido su contraseña puede reponerla facilmente' });
							} else {
								res.status(500).send({ message: 'El correo electronico en cuestion se encuentra asociado a una cuenta de ' + issetuser.provider.toLowerCase() });
							}
						}

					}
				}
			}
		});
	} else {
		res.status(200).send({
			message: 'Introduce los datos correctamente para poder registrar al usuario'
		});
	}
}
function verifiedEmail(req, res) {
	User.findOne({
		verifiedToken: req.params.token,
		verifiedTokenExpires: {
			$gt: Date.now()
		}
	}).exec(function (err, user) {
		if (!err && user) {
			user.verified = true;
			user.verifiedToken = null;
			user.verifiedTokenExpires = Date.now();
			user.save((err, user) => {
				if (err) {
					res.status(500).send({ message: err });
				} else {
					res.status(200).send({ user: user });
				}
			})
		} else {
			return res.status(400).send({
				message: 'Este enlace a caducado, por favor solicite que le enviemos un nuevo correo con otro enlace.'
			});
		}
	});
}
function login(req, res) {
	var params = req.body;
	var email = params.email;
	var password = params.password;
	User.findOne({ email: email.toLowerCase() }, (err, user) => {
		if (err) {
			res.status(500).send({ message: 'Error al comprobar el usuario' });
		} else {
			if (user) {
				if (user.provider == 'HDConsulting') {
					bcrypt.compare(password, user.password, (err, check) => {
						if (check) {
							//devolver token jwt
							if (user.verified) {
								user.online = true;
								user.save((err, usr) => {
									if (err) {
										res.status(500).send({ message: err });
									} else {
										if (usr) {
											res.status(200).send({
												token: jwt.createToken(user),
												user: usr
											});
										}
									}
								});
							} else {
								async.waterfall([
									function (done) {
										// create the random token
										crypto.randomBytes(20, function (err, buffer) {
											var token = buffer.toString('hex');
											done(err, token);
										});
									},
									function (token, done) {
										user.verifiedToken = token;
										user.verifiedTokenExpires = Date.now() + 86400000;
										var data = {
											to: user.email,
											from: 'hdconsultingweb@gmail.com',
											template: 'verified-email',
											subject: 'Verificar correo - HDConsulting',
											context: {
												url: process.env.CLIENT+'verified/' + token,
												name: user.name.split(' ')[0]
											}
										};

										smtpTransport.sendMail(data, function (err) {
											if (!err) {
												//Guardo usuario en DB
												user.save((err, userStored) => {
													if (err) {
														res.status(500).send({ message: 'ERROR: Algo ocurrio al renovar el token de verificacion' });
													} else {
														if (!userStored) {
															res.status(404).send({ message: 'ERROR: Algo ocurrio al renovar el token de verificacion' });
														} else {
															return res.status(500).send({
																message: 'El usuario no ha sido verificado aun, le hemos reenviado un correo electronico con un enlace para que pueda verificar su cuenta.',
																user: userStored
															});
														}
													}
												});
											} else {
												return res.status(422).send({
													message: 'Usuario no verificado: Ha ocurrido un error al reenviar el correo electronico de verificacion'
												});
											}
										});
									}
								], function (err) {
									return res.status(422).json({ message: err });
								});
							}

						} else {
							res.status(200).send({
								message: 'Clave invalida'
							});
						}
					});
				} else {
					res.status(200).send({
						message: 'Debe iniciar sesión con ' + user.provider
					});
				}
			} else {
				res.status(200).send({
					message: 'Correo invalido'
				});
			}
		}
	});

}

function updateUser(req, res) {
	var update = req.body;
	var userId = req.params.id;
	if (userId != req.user.sub) {
		return res.status(500).send({ message: 'No tienes permiso para actualizar el usuario' });
	}
	if (update.password) {
		User.findById(userId, (err, user) => {
			if (err) {
				res.status(500).send({ message: 'Error al comprobar el usuario' });
			} else {
				if (user) {
					if (user.provider == 'HDConsulting') {
						bcrypt.compare(update.password, user.password, (err, check) => {
							if (check) {
								if (update.newPassword == update.verifyPassword) {
									bcrypt.hash(update.newPassword, null, null, function (err, hash) {
										update.password = hash;
										User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
											if (err) {
												res.status(500).send({
													message: 'ERROR: Algo malo ha ocurrido'
												});
											} else {
												if (!userUpdated) {
													return res.status(404).send({ message: 'ERROR: No se logro actualizar su usuario' });
												} else {
													res.status(200).send({ user: userUpdated });
												}
											}
										});
									});
								} else {
									return res.status(404).send({ message: 'ERROR: Las contraseñas no coinciden' });
								}
							} else {
								res.status(200).send({
									message: 'La clave de verificación es incorrecta'
								});
							}
						});
					} else {
						res.status(200).send({
							message: 'No es necesario cambiar su contraseña porque usted esta registrado con ' + user.provider
						});
					}
				} else {
					res.status(200).send({
						message: 'Usuario no encontrado'
					});
				}
			}
		});
	} else {
		User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
			if (err) {
				res.status(500).send({
					message: 'ERROR: Algo malo ha ocurrido'
				});
			} else {
				if (!userUpdated) {
					return res.status(404).send({ message: 'ERROR: No se logro actualizar su usuario' });
				} else {
					res.status(200).send({ user: userUpdated });
				}
			}
		});
	}
}

function uploadImage(req, res) {
	var userId = req.params.id;
	var file_name = 'No subido...';
	// console.log(req);
	if (req.files) {
		// return res.status(200).send({files:req.files,user:userId});
		var file_path = req.files.image.path;
		var file_split = file_path.split('/');
		var file_name = file_split[2];

		var ext_split = file_name.split('.');
		var file_ext = ext_split[1];
		// console.log(file_path+" -> "+ file_split+" -> "+ file_ext+" -> "+ userId+" -> "+ req.user.sub);
		if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif') {
			if (userId != req.user.sub) {
				return res.status(500).send({ message: 'No tienes permiso para actualizar la imagen de usuario' });
			}

			User.findByIdAndUpdate(userId, { image: file_name }, { new: true }, (err, userUpdated) => {
				if (err) {
					res.status(500).send({
						message: 'ERROR: Algo malo ha ocurrido'
					});
				} else {
					if (!userUpdated) {
						return res.status(404).send({ message: 'ERROR: No se logro actualizar su usuario' });
					} else {
						res.status(200).send({ user: userUpdated, image: file_name });
					}
				}
			});
		} else {
			fs.unlink(file_path, (err) => {
				if (err) {
					res.status(200).send({ message: 'Extensión no valida y el archivo no se logro borrar' });
				} else {
					res.status(200).send({ message: 'Extensión no valida' });
				}
			});
		}

	} else {
		res.status(200).send({ message: 'No se han subido archivos' });
	}
}

function getImageFile(req, res) {
	var imageFile = req.params.imageFile;
	var path_file = './uploads/users/' + imageFile;
	fs.exists(path_file, function (exists) {
		if (exists) {
			res.sendFile(path.resolve(path_file));
		} else {
			res.sendFile(path.resolve('./uploads/users/noimage.png'));
			// res.status(404).send({message:'La imagen no existe'});
		}
	});
}

function getContacts(req, res) {
	var userId = req.params.id;
	User.findById(userId, (err, usr) => {
		if (err) {
			res.status(500).send({ message: err });
		} else {
			if (usr) {
				if (usr.role == 'ROLE_ADMIN') {
					User.find({email: { $ne: usr.email }}).sort('name').exec((err, users) => {
						if (err) {
							res.status(500).send({ message: 'Error en la petición' });
						} else {
							if (!users) {
								res.status(200).send({ message: 'No hay contactos' });
							} else {
								res.status(200).send({ users });
							}
						}
					});
				} else {
					User.find({ role: 'ROLE_ADMIN' }).exec((err, users) => {
						if (err) {
							res.status(500).send({ message: 'Error en la petición' });
						} else {
							if (!users) {
								res.status(200).send({ message: 'No hay contactos' });
							} else {
								res.status(200).send({ users });
							}
						}
					});
				}
			}
		}
	})
}

function getAdmins(req, res) {
	User.find({ role: 'ROLE_ADMIN' }).sort('name').exec((err, users) => {
		if (err) {
			res.status(500).send({ message: err });
		} else {
			if (!users) {
				res.status(200).send({ message: 'No hay administradores' });
			} else {
				res.status(200).send({ users });
			}
		}
	});
}

function forgotPassword(req, res) {
	async.waterfall([
		function (done) {
			User.findOne({
				email: req.body.email
			}).exec(function (err, user) {
				if (user) {
					if (user.provider == 'HDConsulting') {
						done(err, user);
					} else {
						return res.status(500).send({
							message: 'Debes iniciar sesión con ' + user.provider,
							user: user
						});
					}

				} else {
					return res.status(500).send({
						message: 'El correo suministrado no coincide con nuestros registros',
						user: user
					});
				}
			});
		},
		function (user, done) {
			// create the random token
			crypto.randomBytes(20, function (err, buffer) {
				var token = buffer.toString('hex');
				done(err, user, token);
			});
		},
		function (user, token, done) {
			User.findByIdAndUpdate({ _id: user._id }, { resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000 }, { upsert: true, new: true }).exec(function (err, new_user) {
				done(err, token, new_user);
			});
		},
		function (token, user, done) {
			var data = {
				to: user.email,
				from: 'dannyelportu2013@gmail.com',
				template: 'forgot-password-email',
				subject: 'Set up a new password - HDConsulting',
				context: {
					url: process.env.CLIENT+'reset-password/'+token,
					name: user.name.split(' ')[0]
				}
			};

			smtpTransport.sendMail(data, function (err) {
				if (!err) {
					return res.status(200).send({
						message: 'Le hemos enviado un correo con un enlace para que pueda reponer su nueva contraseña',
						user: user
					});
				} else {
					return res.status(422).send({
						message: 'Ha ocurrido un error al enviar el mensaje'
					});
				}
			});
		}
	], function (err) {
		return res.status(422).json({ message: err });
	});
}

function resetPassword(req, res) {
	User.findOne({
		resetPasswordToken: req.body.token,
		resetPasswordExpires: {
			$gt: Date.now()
		}
	}).exec(function (err, user) {
		if (!err && user) {
			if (req.body.newPassword === req.body.verifyPassword) {
				bcrypt.hash(req.body.newPassword, null, null, function (err, hash) {
					if (err) {
						return res.status(422).send({
							message: err
						});
					} else {
						user.password = hash;
						user.reset_password_token = null;
						user.reset_password_expires = null;
						//Guardo usuario en DB
						user.save((err, userStored) => {
							if (err) {
								return res.status(422).send({
									message: err
								});
							} else {
								if (!userStored) {
									res.status(404).send({ message: 'ERROR: No se ha registrado el Usuario' });
								} else {
									var data = {
										to: userStored.email,
										from: 'dannyelportu2013@gmail.com',
										template: 'reset-password-email',
										subject: 'Successful password change - HDConsulting',
										context: {
											name: userStored.name.split(' ')[0]
										}
									};

									smtpTransport.sendMail(data, function (err) {
										if (!err) {
											return res.status(200).send({
												message: 'La contraseña ha sido reestablecida correctamente',
												user: userStored
											});
										} else {
											return res.status(422).send({
												message: 'Ha ocurrido un error al enviar el mensaje'
											});
										}
									});
								}
							}
						});
					}
				});
			} else {
				return res.status(422).send({
					message: 'Las contraseñas no son iguales'
				});
			}
		} else {
			return res.status(400).send({
				message: 'El tiempo disponible para cambiar la contraseña ha caducado, por favor intente con una nueva solicitud.'
			});
		}
	});
}

function logout(req, res) {
	var userId = req.params.id;
	User.findById(userId, (err, usr) => {
		if (err) {
			res.status(500).send({ message: err });
		} else {
			if (usr) {
				usr.online = false;
				usr.save((err, usrLogout) => {
					if (err) {
						res.status(500).send({ message: err });
					} else {
						if (usrLogout) {
							res.status(200).send({ logout: usrLogout });
						}
					}
				});
			}
		}
	});
}

function addSocialNetwork(req, res) {
	var userId = req.params.id;
	var params = req.body;
	User.findById(userId, (err, usr) => {
		if (err) {
			res.status(500).send({ message: err });
		} else {
			if (usr) {
				usr.urlFacebook = params.urlFacebook;
				usr.urlTwitter = params.urlTwitter;
				usr.urlLinkedin = params.urlLinkedin;
				usr.position = params.position;
				usr.save((err, userEdit) => {
					if (err) {
						res.status(500).send({ message: err });
					} else {
						if (userEdit) {
							res.status(200).send({ user: userEdit });
						} else {
							res.status(500).send({ message: 'Algun error ha ocurrido al guardar registro en base de datos' });
						}
					}
				})
			}
		}
	});
}

module.exports = {
	saveUser,
	login,
	updateUser,
	uploadImage,
	getImageFile,
	resetPassword,
	logout,
	getContacts,
	getAdmins,
	addSocialNetwork,
	verifiedEmail,
	forgotPassword
}