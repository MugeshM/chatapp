var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	mongoose = require('mongoose'),
	users = {};
app.use('/public', express.static(__dirname + '/public'));

server.listen(3000);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});



mongoose.connect('mongodb://localhost/chat', function(err){
	if(err){
		console.log(err);
	} else{
		console.log('Connected to mongodb!');
	}
});

var chatSchema = mongoose.Schema({
	name: String,
	msg: String,
	created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);



io.sockets.on('connection', function(socket){
	socket.on('new user', function(data, callback){
		if (data in users){
			callback(false);
		    
		} else{
			callback(true);
			socket.username = data;
			users[socket.username] = socket;
			console.log(socket.username+" connected");

	var query = Chat.find({});
	query.sort('-created').limit(8).exec(function(err, docs){
		if(err) throw err;
		socket.emit('load old msgs', docs);
	});

			
		}
		
	});


socket.on('send message', function(data, callback){
		var msg = data.trim();
		console.log(socket.username+'\'s message: ' + msg);
		if(msg == ''){
			callback('Error!  Enter a valid message.');
		} else{
		var newMsg = new Chat({msg: msg, name: socket.username});
			newMsg.save(function(err){
			if(err) throw err;
			io.sockets.emit('new message', {msg: msg, name: socket.username});
		});
	}
	});


socket.on('disconnect', function(data){
		if(!socket.username) return;
		console.log(socket.username+" disconnected");
		delete users[socket.username];

	});

});
