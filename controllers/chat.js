'use strict'

//modelos
var User = require('../models/user');
var Room = require('../models/room');
var Message = require('../models/message');

//acciones
function joinRoom(req, res) {
    var params = req.body;
    var roomName;
    User.findById(params.idSend, (err, send) => {
        if (err) {
            res.status(500).send({ message: 'Error al comprobar el usuario' });
        } else {
            if (send) {
                User.findById(params.idReceive, (err, receive) => {
                    if (err) {
                        res.status(500).send({ message: 'Error al comprobar el usuario' });
                    } else {
                        if (receive) {
                            roomName = send.email + 'TO' + receive.email;
                            Room.collection.dropIndexes(function (err, results) {
                                if(err){
                                    res.status(500).send({ message: err });
                                }else{
                                    Room.findOne({ users: { $all: [params.idSend, params.idReceive] } }, (err, rm) => {
                                        if (err) {
                                            res.status(500).send({ message: err });
                                        } else {
                                            if (rm) {
                                                Message.find({room:rm}).sort('-created')
                                                .exec(function(err, msjs) {
                                                    if(err){
                                                        res.status(500).send({message:'Error no se logro obtener los mensajes'});
                                                    }else{
                                                        if(msjs.length == 0){
                                                            res.status(200).send({ message: 'No tiene mensajes esta conversacion', room:rm });
                                                        }else{
                                                            res.status(200).send({room:rm, messages:msjs});
                                                        }
                                                    }
                                                });
                                            } else {
                                                var room = new Room();
                                                room.name=roomName;
                                                room.users.push(send);
                                                room.users.push(receive);
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
                    }
                });
            } else {
                res.status(500).send({ message: 'El usuario que intenta unirse a la conversación no existe en nuestra BD' });
            }
        }
    });
}

function sendMessage(req,res){
    var msg = new Message();
    var params = req.body;
    msg.content = params.message;
    msg.user = params.user;
    msg.room = params.room;
    Message.collection.dropIndexes(function (err, results) {
        if(err){
            res.status(500).send({message:err});
        }
        msg.save((err, message)=>{
            if(err){
                res.status(500).send({message:err});
            }else{
                if(msg){
                    res.status(200).send({msg:message});
                }
            }
        });
    });
}

module.exports = {
    joinRoom,
    sendMessage
}