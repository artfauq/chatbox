// Require libraries
const express = require('express'),
    fs = require('fs'),
    http = require('http'),
    path = require('path'),
    socketio = require('socket.io'),
    SocketIOFileUpload = require('socketio-file-upload')

// Create Express server
let app = express()
app.use('/images', express.static('images'))
app.use(SocketIOFileUpload.router)

let server = http.createServer(app)

// Socket.IO configuration
let io = socketio.listen(server);
io.sockets.on('connection', function (socket) {

    // Creat instance of SocketIOFileUpload and listen on this socket
    let uploader = new SocketIOFileUpload()
    uploader.dir = path.resolve(__dirname, 'images')
    uploader.listen(socket)

    uploader.on('saved', function (event) {
        fs.readFile(event.file.pathName, (error, filedata) => {
            if (error) throw error
            else {
                socket.emit('image', { user: event.file.meta.user, fileName: event.file.name });
                socket.broadcast.emit('image', { user: event.file.meta.user, fileName: event.file.name })
            }
        })
    })

    uploader.on('error', event => {
        console.log('Error from uploader', event)
    })

    let user_id = 0

    socket.on('newUser', pseudo => {
        user_id++

        socket.emit('newUser', { pseudo, user_id })
        socket.broadcast.emit('newUser', { pseudo, user_id })
    })

    socket.on('message', data => {
        socket.emit('message', data);
        socket.broadcast.emit('message', data);
    })

    socket.on('newAvatar', user => {
        socket.emit('newAvatar', user);
        socket.broadcast.emit('newAvatar', user);
    })

    socket.on('userTyping', user => {
        socket.broadcast.emit('userTyping', user);
    })

    socket.on('userDisconnect', pseudo => {
        socket.broadcast.emit('userDisconnected', pseudo)
    })
});

server.listen(5000, function () {
    console.log('Socket server listening on localhost at port 5000 !');
});
