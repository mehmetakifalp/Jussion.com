var selfVideo,
    otherVideo,
    historyPanel,
    inputChat;

$(function() {
    window.onbeforeunload = function () {
        if (roomName) {
            var msg = 'Are you sure exit ' + roomName + '\'s Jussion?';
            return msg;
        }
    };

    selfVideo = $('#self-video');
    otherVideo = $('#other-video');
    historyPanel = $('#chat-history');
    inputChat = $('#input-chat');

    inputChat.bind('keypress', function (keyEvent) {
        if ((keyEvent.keyCode || keyEvent.which) == 13) {
            var txt = $(this).val().trim();
            if (txt)
                sendMessage(txt);
            $(this).val('');
        }
    });

    function sendMessage(message) {
        sendAllMessage('public-message', message);
        var messageItem = $('<div><label>Me :</label><br>' + message + '</div>');
        historyPanel.append(messageItem);
        historyPanel.scrollTop(100000);
    };

    init_easyrtc();
});

