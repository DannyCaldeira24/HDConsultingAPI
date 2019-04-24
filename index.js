'use strict'

var mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
var app = require('./app');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}
  
const DB_URI = process.env.DB_URI || 'mongodb+srv://danny:d123123@cluster0-ddk6i.mongodb.net/hd_db?retryWrites=true';

app.set('port', process.env.PORT || 3000);

mongoose.Promise = global.Promise;
mongoose.connect(DB_URI, { useNewUrlParser: true })
		.then(()=>{
			console.log('La conexión a la base de datos HD_DB se ha realizado correctamente..');
			let server = app.listen(app.get('port'), () => {
			    // var host = server.address().address;
			    var port = server.address().port;
			    console.log('Puerto:', port);
			});
		})
		.catch(err => console.log(err));
