//init easyrtc
var needToCallOtherUsers = false;
var maxUserNum = 2;
var users = [];
var haveCamera, haveMic;

/**
 * init easyrtc
 */
function init_easyrtc(){
    easyrtc.dontAddCloseButtons(false);
    easyrtc.setUsername(email);
    easyrtc.setApplicationName('videoChat');
    easyrtc.setRoomOccupantListener(convertList);
    easyrtc.setRoomEntryListener(function(entry, roomname){
        needToCallOtherUsers = true;
    });

    /**
     *connect easyrtc
     */
    easyrtc.connect('VideoConf',
        function() {
            //success connect
            function init_media_source (cb) {
                easyrtc.initMediaSource(
                    function(mediastream) {
                        cb(true, mediastream);
                    }, function(errorCode, errorText) {
                        cb(false);
                    }
                );
            }
            init_media_source(function(successed, mediastream) {
                if (successed) {
                    haveCamera = true;
                    haveMic = true;
                    easyrtc.setVideoObjectSrc(selfVideo[0], mediastream);
                    joinARoom();
                } else {
                    easyrtc.enableVideo(false);
                    init_media_source(function (successed, mediastream) {
                        if (successed) {
                            haveCamera = false;
                            haveMic = true;
                            easyrtc.setVideoObjectSrc(selfVideo[0], mediastream);
                            joinARoom();
                        } else {
                            easyrtc.enableVideo(true);
                            easyrtc.enableAudio(false);
                            init_media_source(function(successed, mediastream){
                                if (successed){
                                    haveCamera = true;
                                    haveMic = false;
                                    easyrtc.setVideoObjectSrc(selfVideo[0], mediastream);
                                    joinARoom();
                                } else {
                                    haveCamera = false;
                                    haveMic = false;
                                    easyrtc.enableVideo(false);
                                    joinARoom();
                                }
                            });
                        }
                    });
                }
            });
        },
        function(error) {
            console.log(error);
        }
    );

    // when viewer call me
    easyrtc.setAcceptChecker(function(easyrtcid, acceptor) {
        if (users.length>maxUserNum)
            acceptor(false);
        else{
            acceptor(true);
        }
        //add_new_user(easyrtcid);
    });

    //disconnect event
    easyrtc.setDisconnectListener(
        function(){
            alert("Disconnected Easyrtc connection");
        }
    );

    //send data from other
    easyrtc.setPeerListener(handle_message);
}

//join easyrtc room
function joinARoom(global){
    //join room
    var newRoom = roomName;
    if (global)
        newRoom = global;

    for (var actualRoom in easyrtc.getRoomsJoined()) {
        if (newRoom === actualRoom) {
            alert("You can't join this room.");
            return;
        }
    }

    easyrtc.leaveRoom(actualRoom, function(actualRoom) {
        console.log("leave " + actualRoom);
    }, function(errorCode, errorText, actualRoom){
        console.log("Failure " + actualRoom);
    });

    easyrtc.joinRoom(newRoom, null, function(newRoom) {
        console.log("Success to join " + newRoom);
    }, function(errorCode, errorText, newRoom){
        console.log("Failure to join " + newRoom);
    });
}

/**
 * Easyrtc Room occupant Listener
 */
function convertList (roomName, occupants, isPrimary) {
    if (roomName == 'global' || roomName == 'default')
        return;
    var new_users = [];
    console.log('room occupants');

    if (needToCallOtherUsers) {
        //first entry room
        var list = [];
        var connectCount = 0;
        for (var easyrtcid in occupants)  {
            list.push(easyrtcid);
        }
        //
        // Connect in reverse order. Latter arriving people are more likely to have
        // empty slots.
        //
        function establishConnection(position) {
            function callSuccess() {
                console.log('call success');
            }
            function callFailure() {
                if (position > 0 && connectCount<maxUserNum) {
                    establishConnection(position - 1);
                }
                else {
                    sendAllMessage('hello', 'hello');
                }
            }
            function wasAccepted(wasAccepted, easyrtcid){
                if (wasAccepted){
                    connectCount++;
                }
                if (position > 0 && connectCount<maxUserNum) {
                    establishConnection(position - 1);
                }
                else {
                    sendAllMessage('hello', 'hello');
                }
            }
            easyrtc.call(list[position], callSuccess, callFailure, wasAccepted);
        }

        if (list.length > maxUserNum){
            alert('sorry, this room is full.');
            return false;
        } else if (list.length > 0){
            establishConnection(list.length-1);
        } else {
            report_leave();
        }
        needToCallOtherUsers = false;
    } else {
        //check other user list
        var list=[];
        for (var easyrtcid in occupants) {
            list.push(easyrtcid);
        }
        if (list.length == 0)
            report_leave();
        users = list;
    }
}

function sendAllMessage(msgType, msgData){
    easyrtc.sendDataWS({targetRoom: roomName}, msgType, msgData);
}

function sendPeerMessage(id, msgType, msgData){
    easyrtc.sendDataWS(id, msgType, msgData);
}

/**
 * Easyrtc Handle Message
 */
function handle_message(otherid, msgType, msgData){
    console.log("--------- Message " + msgType + "---------" );
    console.log(msgData);
    console.log("----------------------------------------");
    switch (msgType){
        case 'hello':
            easyrtc.setVideoObjectSrc(otherVideo[0], easyrtc.getRemoteStream(otherid));
            sendPeerMessage(otherid, 'answer-hello', 'hello');
            report_match();
            break;
        case 'answer-hello':
            easyrtc.setVideoObjectSrc(otherVideo[0], easyrtc.getRemoteStream(otherid));
            report_match();
            break;
        case 'public-message':
            var messageItem = $('<div><label>'+ easyrtc.idToName(otherid) +':</label><br>' + msgData + '</div>');
            historyPanel.append(messageItem);
            historyPanel.scrollTop(100000);
            break;
    }
}
