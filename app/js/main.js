$(document).ready(function() {
    var socket = io.connect('http://localhost:8080');
    var chat = $('#chat');

    var pseudo = prompt('Pseudo : ');
    socket.emit('newUser', pseudo);

    socket.on('message', function(message) {
        chat.append(message).children(':last').css('opacity', 0).slideDown('slow').animate({ opacity: 1 }, { duration: 'slow' });
         updateScroll();
    })

    socket.on('userTyping', function(data) {
        var isTyping = data.isTyping;
        var pseudo = data.pseudo;

        if (isTyping) {
            var userTyping = '<div id="' + pseudo + 'Typing"><p class="userTyping"><span>' + pseudo + '</span> est en train d\'écrire...</p></div>';
            chat.append(userTyping);
            updateScroll();
        } else {
            chat.find('#' + pseudo + 'Typing').remove();
        }
    })

    $('#message').on('input', function() {
        var input = $(this);

        if (input.val()) {
            input.addClass('input-focus');
            socket.emit('userTyping', true);
        } else {
            input.removeClass('input-focus');
            socket.emit('userTyping', false);
        }
    });

    $("#message-form").submit(function(event) {
        var messageContent = $('#message').val();

        if (messageContent) {
            socket.emit('message', messageContent);
            socket.emit('userTyping', false);
            $('#message').val('');
            $('#message').focus();
        }

        event.preventDefault();

        if ($('#message').hasClass('input-focus')) {
            $('#message').removeClass('input-focus');
        }
    });

    function updateScroll() {
        document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
    }
})
