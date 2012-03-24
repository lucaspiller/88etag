var express = require('express'),
    socketio = require('socket.io'),
    game = require('./lib/88etag');

var app = express.createServer();
app.listen(8000);
app.use(express.static(__dirname + '/public'));

var io = socketio.listen(app);
var server = new game.server;
server.start(io);
