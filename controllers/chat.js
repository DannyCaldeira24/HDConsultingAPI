'use strict'

//modelos
var User = require('../models/user');
var Room = require('../models/room');
var Message = require('../models/message');
var async = require('async');
// var sync = require('sync');
//acciones
function joinRoom(req, res) {
    var params = req.body;
    var roomName;
    roomName = params.idSend + '|TO|' + params.idReceive;
    Room.collection.dropIndexes(function (err, results) {
        if (err) {
            res.status(500).send({ message: err });
        } else {
            Room.findOne({ users: { $all: [params.idSend, params.idReceive] } }, (err, rm) => {
                if (err) {
                    res.status(500).send({ message: err });
                } else {
                    if (rm) {
                        Message.find({ room: rm }).sort('-created')
                            .exec(function (err, msjs) {
                                if (err) {
                                    res.status(500).send({ message: 'Error no se logro obtener los mensajes' });
                                } else {
                                    if (msjs.length == 0) {
                                        res.status(200).send({ message: 'No tiene mensajes esta conversacion', room: rm });
                                    } else {
                                        res.status(200).send({ room: rm, messages: msjs });
                                    }
                                }
                            });
                    } else {
                        var room = new Room();
                        room.name = roomName;
                        room.users.push(params.idSend);
                        room.users.push(params.idReceive);
                        room.save((err, roomStored) => {
                            if (err) {
                                res.status(500).send({ message: err });
                            } else {
                                if (!roomStored) {
                                    res.status(404).send({ message: 'ERROR: No se ha registrado la sala' });
                                } else {
                                    res.status(200).send({ room: roomStored });
                                }
                            }
                        });
                    }
                }
            });
        }
    });
         
}

function sendMessage(req, res) {
    var msg = new Message();
    var params = req.body;
    msg.content = params.message;
    msg.user = params.user;
    msg.room = params.room;
    Message.collection.dropIndexes(function (err, results) {
        if (err) {
            res.status(500).send({ message: err });
        }
        msg.save((err, message) => {
            if (err) {
                res.status(500).send({ message: err });
            } else {
                if (msg) {
                    res.status(200).send({ msg: message });
                }
            }
        });
    });
}

function contRooms(rooms, userId, cont) {
    const promise = new Promise(function (resolve, reject) {
        rooms.forEach((room) => {
            Message.find({ 'room._id': room._id, read: false, 'user._id': { $ne: userId } }, (err, msjs) => {
                if (err) {
                    reject(new Error('Error'));
                } else {
                    cont = msjs.length > 0 ? cont + 1 : cont;
                }
            })
        });
        setTimeout(function () {
            resolve(cont);
        }, 5000);
        if (!rooms) {
            reject(new Error('Error'));
        }
    })

    return promise;
}

function getNotifications(req, res) {
    var userId = req.params.id;
    Room.find({ users: { $in: [userId] } }, async (err, rooms) => {
        if (err) {
            res.status(500).send({ message: err });
        } else {
            if (rooms) {
                try {
                    const result = await contRooms(rooms, userId, 0);
                    res.status(200).send({ cont: result });
                } catch (err) {
                    console.log(err.message);
                }
            } else {
                res.status(500).send({ message: 'No hay conversaciones' });
            }
        }
    });
}

function contMessages(room, userId) {
    const promise = new Promise(function (resolve, reject) {
        Message.countDocuments({ 'room._id': room, read: false, 'user._id': { $ne: userId } }, (err, cont) => {
            if (err) {
                reject(new Error('Error'));
            } else {
                resolve(cont);
            }
        })
        if (!room || !userId) {
            reject(new Error('Error'));
        }
    })
    return promise;
}

function getContactsNotifications(req, res) {
    var userId = req.body.id;
    var contacts = req.body.users;
    var contactsMessages = [];
    contacts.forEach((contact) => {
        Room.findOne({ users: { $all: [userId, contact._id] } }, (err, rm) => {
            if (err) {
                res.status(500).send({ message: err });
            } else {
                if (rm) {
                    contMessages(rm._id, userId).then(result => {
                        contactsMessages.push({ _user: contact._id, cont: result });
                    }).catch(err => {
                        res.status(500).send({ message: err });
                    });
                } else {
                    contactsMessages.push({ _user: contact._id, cont: 0 });
                }
            }
        });
    });

    setTimeout(function () {
        res.status(200).send({ noReadMessages: contactsMessages });
    }, 5000);

}

function readMessages(req, res) {
    var userId = req.body.user;
    var roomId = req.body.room;
    Message.updateMany({ 'room._id': roomId, read: false, 'user._id': { $ne: userId } }, { read: true }, (err, messagesUpdated) => {
        if (err) {
            res.status(500).send({ message: err });
        } else {
            res.status(200).send({ messages: messagesUpdated });
        }
    });
}

module.exports = {
    joinRoom,
    getNotifications,
    getContactsNotifications,
    readMessages,
    sendMessage
}