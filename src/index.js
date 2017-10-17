require('font-awesome/css/font-awesome.css');
import './scss/main.scss'

const $ = require('jquery')
const io = require('socket.io-client')
const moment = require('moment')
const SocketIOFileUpload = require('socketio-file-upload')

// Replace with your own IP address
const server_URL = 'http://192.168.12.147:5000/'

$(document).ready(() => {
    let user = {
        user_id: 0,
        avatar: 'fa fa-user',
        typing: false,
        pseudo: null
    }

    const socket = io.connect(server_URL)

    user.pseudo = prompt('Pseudo : ')
    socket.emit('newUser', user.pseudo)

    activeAvatar()

    let uploader = new SocketIOFileUpload(socket)

    // Configure how SocketIOFileUpload can read files
    $('#file_button').on('click', () => {
        uploader.prompt()
    })

    uploader.addEventListener('start', event => {
        event.file.meta.user = user;
    })

    // uploader.addEventListener('progress', event => {
    //     let percent = event.bytesLoaded / event.file.size * 100;
    //     console.log("File is", percent.toFixed(2), "percent loaded");
    // });

    // Do something when a file is uploaded:
    // uploader.addEventListener('complete', event => {
    //     console.log(event.success);
    //     console.log(event.file);
    // });

    let lastPseudo = ''
    let timeout = 0

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
        activeAvatar()
    })

    $('#message-input').on('input', () => {
        checkUserTyping()
    })

    $("#message-form").submit(event => {
        event.preventDefault()

        let content = $('#message-input').val()

        if (content) {
            checkUserTyping()
            $('#message-input').prop('disabled', true)

            setTimeout(() => {
                socket.emit('message', {
                    content,
                    user
                })

                $('#message-input').val('')
                $('#message-input').prop('disabled', false)
                $('#message-input').focus()
            }, 250)
        }
    })

    $('#thumb_button').on('click', () => {
        let content = '<i class="fa fa-thumbs-up fa-lg"></i>';

        $('#message-input').focus()

        if (timeout == 0) socket.emit('message', {
            content,
            user
        })
        timeout = 1

        setTimeout(() => {
            timeout = 0
        }, 500)
    })

    function activeAvatar() {
        $('.avatar').each((index, element) => {
            console.log($(element))
            if ($(element).hasClass(user.avatar)) $(element).addClass('active')
            else if ($(element).hasClass('active')) $(element).removeClass('active')
        })
    }

    function checkUserTyping() {
        if ($('#message-input').val()) {
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
