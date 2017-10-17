require('font-awesome/css/font-awesome.css');
import './scss/main.scss'

const $ = require('jquery')
const io = require('socket.io-client')
const moment = require('moment')
const SocketIOFileUpload = require('socketio-file-upload')

// Replace with your own IP address
const server_URL = 'http://192.168.12.147:5000/'

$(document).ready(() => {
    const socket = io.connect(server_URL)

    let pseudo = prompt('Pseudo : ')
    socket.emit('newUser', pseudo)

    let uploader = new SocketIOFileUpload(socket)

    // Configure how SocketIOFileUpload can read files
    $('#file_button').on('click', () => {
        uploader.prompt()
    })

    // Do something on upload progress:
    uploader.addEventListener('start', event => {
        event.file.meta.pseudo = pseudo;
    })

    uploader.addEventListener('progress', event => {
        let percent = event.bytesLoaded / event.file.size * 100;
        console.log("File is", percent.toFixed(2), "percent loaded");
    });

    // Do something when a file is uploaded:
    uploader.addEventListener('complete', event => {
        console.log(event.success);
        console.log(event.file);
    });

    let user_id
    let userTyping = false
    let messageType, newAuthor, lastAuthor = ''
    let messageContent = ''

    socket.on('newUser', data => {
        user_id = data.user_id

        messageContent = '<div><p class="user-notification"><span>' + data.pseudo + '</span> a rejoint le chat</p></div>'
        newContent(messageContent)
    })

    socket.on('message', message => {
        messageType = (message.pseudo == pseudo) ? 'out' : 'in'
        newAuthor = (message.pseudo == lastAuthor) ? false : true

        if (newAuthor) {
            messageContent = '<div class="message message-' + messageType + '"><p class="message-author"><i class="fa fa-user"></i>' + message.pseudo + '</p><div class="flex flex-horizontal flex-center"><p class="message-content">' + message.content + '</p><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        } else {
            messageContent = '<div class="message message-' + messageType + '"><div class="flex flex-horizontal flex-center"><p class="message-content">' + message.content + '</p><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        }

        lastAuthor = message.pseudo
        newContent(messageContent)
    })

    socket.on('userTyping', data => {
        if (data.userTyping) newContent('<p class="user-typing user-' + data.user_id + '-typing"><span>' + data.pseudo + '</span> est en train d\'ecrire...</p>')
        else $('#chat').find('.user-' + user_id + '-typing').remove()
    })

    socket.on('image', image => {
        messageType = (image.pseudo == pseudo) ? 'out' : 'in'
        newAuthor = (image.pseudo == lastAuthor) ? false : true

        if (newAuthor) {
            messageContent = '<div class="message message-' + messageType + '"><p class="message-author"><i class="fa fa-user"></i>' + image.pseudo + '</p><div class="flex flex-horizontal flex-center"><div class="message-content image"><a href="http://localhost:5000/images/' + image.fileName + '" target="_blank"><img src="' + server_URL + 'images/' + image.fileName + '"/></a></div><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        } else {
            messageContent = '<div class="message message-' + messageType + '"><div class="flex flex-horizontal flex-center"><div class="message-content image"><a href="http://localhost:5000/images/' + image.fileName + '" target="_blank"><img src="' + server_URL + 'images/' + image.fileName + '"/></a></div><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        }

        lastAuthor = image.pseudo
        newContent(messageContent)
    })

    $(window).on('unload', () => {
        socket.emit('userDisconnect', pseudo)
    })

    socket.on('userDisconnected', pseudo => {
        messageContent = '<div><p class="user-notification"><span>' + pseudo + '</span> a quitté le chat</p></div>'
        newContent(messageContent)
    })

    $('#message-input').on('input', () => {
        checkUserTyping()
    })

    $('#thumb_button').on('click', () => {
        let content = '<i class="fa fa-thumbs-up fa-lg"></i>';
        $('#message-input').focus()
        socket.emit('message', { content, pseudo })
    })

    $("#message-form").submit(event => {
        let content = $('#message-input').val()

        if (content) {
            $('#message-input').val('').focus()

            checkUserTyping()
            socket.emit('message', { content, pseudo })
        }

        event.preventDefault()
    })

    function checkUserTyping() {
        if ($('#message-input').val()) {
            if (userTyping == false) {
                userTyping = true
                socket.emit('userTyping', { userTyping, pseudo, user_id })
            }
        }
        else {
            if (userTyping == true) {
                userTyping = false
                socket.emit('userTyping', { userTyping, pseudo, user_id })
            }
        }
    }

    function updateScroll() {
        $('#chat').scrollTop($('#chat')[0].scrollHeight)
    }

    function newContent(content) {
        $('#chat').append(content).children(':last').css('opacity', 0).slideDown('slow').animate({ opacity: 1 }, { duration: 250 })
        updateScroll()
    }
});
