const http = require('http'),
    express = require('express'),
    ent = require('ent');

let app = express();
let server = http.createServer(app);

let io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    let user_id = 0

    socket.on('newUser', function (pseudo) {
        pseudo = ent.encode(pseudo)
        user_id++

        socket.emit('newUser', { pseudo, user_id });
        socket.broadcast.emit('newUser', { pseudo, user_id })
    })

    socket.on('message', function (message) {
        socket.emit('message', message);
        socket.broadcast.emit('message', message);
    })

    socket.on('userTyping', function (data) {
        socket.broadcast.emit('userTyping', {
            userTyping: data.userTyping,
            pseudo: data.pseudo,
            user_id: data.user_id
        });
    })

    socket.on('userDisconnect', function (pseudo) {
        console.log(pseudo, 'disconnected...')
        socket.broadcast.emit('userDisconnected', pseudo)
    })
});

server.listen(5000, function () {
    console.log('Socket server listening on localhost at port 5000 !');
});
