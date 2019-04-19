'use strict'
var fs = require('fs');
var path = require('path');

//modelos
var Project = require('../models/project');

//acciones

function saveProject(req, res) {
    //Crear objeto usuario
    var prj = new Project();
    //Recoger parametros de la petición
    var params = req.body;
    if (params.name && params.slogan && params.description && params.users && params.dateDeploy && params.client) {
        //Asignar valores al objeto user
        prj.name = params.name;
        prj.slogan = params.slogan;
        prj.description = params.description;
        prj.users = params.users;
        prj.dateDeploy = params.dateDeploy;
        prj.client = params.client;
        prj.urlProject = params.urlProject;
		prj.save((err,projectStored) => {
			if(err){
				res.status(500).send({message: 'Error en el servidor'});
			}else{
				if(!projectStored){
					res.status(404).send({message: 'No se ha guardado el proyecto'});
				}else{
					res.status(200).send({
						project: projectStored
					});
				}
			}
		});
    } else {
        res.status(200).send({
            message: 'Introduce los datos correctamente para poder registrar al proyecto'
        });
    }
}


function updateProject(req, res) {
    var update = req.body;
    var projectId = req.params.id;

    Project.findByIdAndUpdate(projectId, update, { new: true }, (err, projectUpdated) => {
        if (err) {
            res.status(500).send({
                message: 'ERROR: Algo malo ha ocurrido'
            });
        } else {
            if (!projectUpdated) {
                return res.status(404).send({ message: 'ERROR: No se logro actualizar su proyecto' });
            } else {
                res.status(200).send({ project: projectUpdated });
            }
        }
    });

}

function uploadImage(req, res) {
    var projectId = req.params.id;
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
            Project.findByIdAndUpdate(projectId, { image: file_name }, { new: true }, (err, projectUpdated) => {
                if (err) {
                    res.status(500).send({
                        message: 'ERROR: Algo malo ha ocurrido'
                    });
                } else {
                    if (!projectUpdated) {
                        return res.status(404).send({ message: 'ERROR: No se logro actualizar su usuario' });
                    } else {
                        res.status(200).send({ project: projectUpdated, image: file_name });
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
    var path_file = './uploads/projects/' + imageFile;
    fs.exists(path_file, function (exists) {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.sendFile(path.resolve('./uploads/projects/noimage.png'));
            // res.status(404).send({message:'La imagen no existe'});
        }
    });
}

function deleteProject(req,res){
	var projectId = req.params.id;
	Project.findByIdAndRemove(projectId,(err, projectRemoved)=>{
		if(err){
			res.status(500).send({message:'Error en la petición'});
		}else{
			if(!projectRemoved){
				res.status(404).send({message:'No se ha podido borrar el animal'});
			}else{
				res.status(200).send({project:projectRemoved});
			}
		}
	});
}

function getProject(req, res){
    var projectId = req.params.id;
    Project.findById(projectId).populate('users').exec((err, project)=>{
        if(err){
            res.status(500).send({message:err});
        }else{
            if(project){
                res.status(200).send({project:project});
            }else{
                res.status(500).send({message:'El proyecto no existe'});
            }
        }
    });
}

function getProjects(req, res){
    Project.find({}).populate('users').sort('name').exec((err, projects)=>{
        if(err){
            res.status(500).send({message:err});
        }else{
            if(projects){
                res.status(200).send({projects:projects});
            }
        }
    })
}


module.exports = {
    saveProject,
    updateProject,
    deleteProject,
    uploadImage,
    getProject,
    getProjects,
    getImageFile
}