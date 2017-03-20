var http = require('http'),
    express = require('express'),
    fs = require('file-system'),
    ent = require('ent');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/app'));

io.sockets.on('connection', function(socket, pseudo) {

    socket.on('newUser', function(pseudo) {
        pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
        var notification = '<div><p class="userNotification"><span>' + pseudo + '</span> a rejoint le chat</p></div>';
        socket.broadcast.emit('message', notification);
    });

    socket.on('message', function(message) {
        message = ent.encode(message);
        var messageIn = '<div class="message message-in"><p class="message-author"><i class="fa fa-user"></i>' + socket.pseudo + '</p><p class="message-content">' + message + '</p></div>';
        var messageOut = '<div class="message message-out"><p class="message-author"><i class="fa fa-user"></i>' + socket.pseudo + '</span><p class="message-content">' + message + '</p></div>';
        socket.emit('message', messageIn);
        socket.broadcast.emit('message', messageOut);
    });

    socket.on('userTyping', function(isTyping) {
        if (typeof socket.isTyping == 'undefined' || socket.isTyping != isTyping) {
            socket.isTyping = isTyping;
            socket.broadcast.emit('userTyping', { isTyping: socket.isTyping, pseudo: socket.pseudo });
        }
    })
})

server.listen(8080);