const http = require('http'),
    express = require('express'),
    ent = require('ent');

let app = express();
let server = http.createServer(app);

let io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    let id = 0, chat = []

    socket.on('newUser', function (pseudo) {
        pseudo = ent.encode(pseudo)
        id++

        socket.broadcast.emit('newUser', { pseudo, id })
    });

    socket.on('message', function (message) {
        if (!chat.length) message.newAuthor = true
        else if (chat[chat.length - 1].pseudo == message.pseudo) message.newAuthor = false
        else message.newAuthor = true

        socket.emit('message', message);
        socket.broadcast.emit('message', message);

        chat.push(message)
    });

    socket.on('userTyping', function (data) {
        socket.broadcast.emit('userTyping', {
            userTyping: data.userTyping,
            pseudo: data.pseudo,
            user_id: data.user_id
        });
    });
});

server.listen(5000, function () {
    console.log('Socket server listening on localhost at port 5000 !');
});
