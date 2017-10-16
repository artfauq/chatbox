require('font-awesome/css/font-awesome.css');
import './scss/main.scss'

const $ = require('jquery')
const io = require('socket.io-client/socket.io')
const moment = require('moment')

$(document).ready(() => {
    const socket = io.connect('http://192.168.12.147:5000')

    let pseudo = prompt('Pseudo : ')
    socket.emit('newUser', pseudo)

    let user_id, userTyping, messageContent

    socket.on('newUser', data => {
        user_id = data.id

        messageContent = '<div><p class="user-notification"><span>' + data.pseudo + '</span> a rejoint le chat</p></div>'
        newContent(messageContent)
    })

    socket.on('message', message => {
        let messageType = (message.pseudo == pseudo) ? 'out' : 'in'

        if (message.newAuthor) {
            messageContent = '<div class="message message-' + messageType + '"><p class="message-author"><i class="fa fa-user"></i>' + message.pseudo + '</p><div class="flex flex-horizontal flex-center"><p class="message-content">' + message.content + '</p><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        } else {
            messageContent = '<div class="message message-' + messageType + '"><div class="flex flex-horizontal flex-center"><p class="message-content">' + message.content + '</p><p class="message-date">' + moment().format('HH:mm:ss'); + '<p/></div></div>'
        }

        newContent(messageContent)
    })

    socket.on('userTyping', data => {
        if (data.isTyping) newContent('<p class="user-typing user-' + data.user_id + '-typing"><span>' + data.pseudo + '</span> est en train d\'ecrire...</p>')
        else $('#chat').find('.user-' + user_id + '-typing').remove()
    })

    $('#message-input').on('input', () => {
        if ($(this).val()) {
            if (userTyping == false) {
                userTyping = true
                socket.emit('userTyping', { pseudo, isTyping, user_id })
            }
        }
        else {
            if (userTyping == true) {
                userTyping = false
                socket.emit('userTyping', { pseudo, isTyping, user_id })
            }
        }
    })

    $('#thumb-button').on('click', () => {
        let content = '<i class="fa fa-thumbs-up fa-lg"></i>';
        $('#message-input').focus()
        socket.emit('message', { content, pseudo })
    })

    $("#message-form").submit(event => {
        let content = $('#message-input').val()

        if (content) {
            $('#message-input').val('').focus()
            socket.emit('message', { content, pseudo })
        }

        event.preventDefault()
    })


    function updateScroll() {
        $('#chat').scrollTop($('#chat')[0].scrollHeight)
    }

    function newContent(content) {
        $('#chat').append(content).children(':last').css('opacity', 0).slideDown('slow').animate({ opacity: 1 }, { duration: 250 })
        updateScroll()
    }
});
