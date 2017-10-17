require('font-awesome/css/font-awesome.css')
require('file-loader?name=[name].[ext]!./index.html')
import './scss/main.scss'

const $ = require('jquery')
const moment = require('moment')

// Replace with your own IP address
const server_URL = 'http://192.168.12.147:3000/'
const io = require('socket.io-client')
const socket = io.connect(server_URL)

// Initialize the library used to upload files with Socket.IO
const SocketIOFileUpload = require('socketio-file-upload')
let uploader = new SocketIOFileUpload(socket)

let timeout = 0
let lastPseudo = ''
let user = {
    user_id: 0,
    avatar: 'fa fa-user',
    typing: false,
    pseudo: null
}

$(document).ready(() => {
    // Prompt user to enter his pseudo and inform other users
    user.pseudo = prompt('Pseudo : ')
    socket.emit('newUser', user.pseudo)

    // Configure how SocketIOFileUpload can read files
    $('#file_button').on('click', () => {
        uploader.prompt()
    })

    uploader.addEventListener('start', event => {
        event.file.meta.user = user;
    })

    // Socket.IO 
    socket.on('newUser', data => {
        if (data.pseudo == user.pseudo) user.user_id = data.user_id

        let messageContent = '<div><p class="user-notification"><i class="fa fa-user"></i> <span>' + data.pseudo + '</span> a rejoint le chat</p></div>'
        newContent(messageContent)
    })

    socket.on('userDisconnected', pseudo => {
        messageContent = '<div><p class="user-notification"><span>' + pseudo + '</span> a quitté le chat</p></div>'
        newContent(messageContent)
    })

    socket.on('message', data => {
        let messageContent = ''
        let contentType = (data.user.pseudo == user.pseudo) ? 'out' : 'in'
        let newAuthor = (data.user.pseudo == lastPseudo) ? false : true

        if (newAuthor) {
            messageContent = '<div class="message message-' + contentType + '"><p class="message-author"><i class="' + data.user.avatar + '"></i>' + data.user.pseudo + '</p><div class="flex flex-horizontal flex-center"><p class="message-content">' + data.content + '</p><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        } else {
            messageContent = '<div class="message message-' + contentType + '"><div class="flex flex-horizontal flex-center"><p class="message-content">' + data.content + '</p><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        }

        lastPseudo = data.user.pseudo
        newContent(messageContent)
    })

    socket.on('image', data => {
        let messageContent = ''
        let contentType = (data.user.pseudo == user.pseudo) ? 'out' : 'in'
        let newAuthor = (data.user.pseudo == lastPseudo) ? false : true

        if (newAuthor) {
            messageContent = '<div class="message message-' + contentType + '"><p class="message-author"><i class="' + data.user.avatar + '"></i>' + data.user.pseudo + '</p><div class="flex flex-horizontal flex-center"><div class="message-content image"><a href="' + server_URL + 'images/' + data.fileName + '" target="_blank"><img src="' + server_URL + 'images/' + data.fileName + '"/></a></div><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        } else {
            messageContent = '<div class="message message-' + contentType + '"><div class="flex flex-horizontal flex-center"><div class="message-content image"><a href="' + server_URL + 'images/' + data.fileName + '" target="_blank"><img src="' + server_URL + 'images/' + data.fileName + '"/></a></div><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        }

        lastPseudo = data.user.pseudo
        newContent(messageContent)
    })

    socket.on('userTyping', data => {
        if (data.typing) newContent('<p class="user-typing user-' + data.user_id + '-typing"><span>' + data.pseudo + '</span> est en train d\'ecrire...</p>')
        else $('#chat').find('.user-' + data.user_id + '-typing').remove()
    })

    socket.on('newAvatar', user => {
        let messageContent = '<div><p class="user-notification"><i class="' + user.avatar + '"></i> <span>' + user.pseudo + '</span> a changé d\'avatar</p></div>'
        newContent(messageContent)
    })

    $(window).on('unload', () => {
        socket.emit('userDisconnect', pseudo)
    })

    $('#cogs_button').on('click', () => {
        $('#parameters').toggleClass('show-parameters')
        $('.container').toggleClass('show-parameters')
    })

    $('.avatar').click((e) => {
        user.avatar = $(e.target).attr('class').replace('active ', '')
        socket.emit('newAvatar', user)
        checkActiveAvatar()
    })

    $('#message_input').on('input', () => {
        checkUserTyping()
    })

    $("#message_form").submit(event => {
        event.preventDefault()

        let content = $('#message_input').val()

        if (content) {
            checkUserTyping()
            $('#message_input').prop('disabled', true)

            setTimeout(() => {
                socket.emit('message', {
                    content,
                    user
                })

                $('#message_input').val('')
                $('#message_input').prop('disabled', false)
                $('#message_input').focus()
            }, 250)
        }
    })

    $('#thumb_button').on('click', () => {
        let content = '<i class="fa fa-thumbs-up fa-lg"></i>';

        $('#message_input').focus()

        if (timeout == 0) socket.emit('message', {
            content,
            user
        })
        timeout = 1

        setTimeout(() => {
            timeout = 0
        }, 500)
    })

    function checkActiveAvatar() {
        $('.avatar').each((index, element) => {
            if ($(element).hasClass(user.avatar)) $(element).addClass('active')
            else if ($(element).hasClass('active')) $(element).removeClass('active')
        })
    }

    function checkUserTyping() {
        if ($('#message_input').val()) {
            if (user.typing == false) {
                user.typing = true
                socket.emit('userTyping', user)
            }
        } else {
            if (user.typing == true) {
                user.typing = false
                socket.emit('userTyping', user)
            }
        }
    }

    function updateScroll() {
        $('#chat').scrollTop($('#chat')[0].scrollHeight)
    }

    function newContent(content) {
        $('#chat').append(content).children(':last').css('opacity', 0).slideDown('slow').animate({
            opacity: 1
        }, {
            duration: 250
        })
        updateScroll()
    }
});
