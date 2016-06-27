
//@ models
var Room = require('../models/room');
var User = require('../models/user');

var findUser = function(ctx, callback){
    var email = ctx['email'],
        authType = ctx['authtype'],
        query = {};
    switch (authType){
        case 'local':
            query = {'local.email': email};
            break;
        case 'facebook':
            query = {'facebook.email': email};
            break;
        case 'google':
            query = {'google.email': email};
            break;
    }
    User.findOne(query, function(err, user){
        if (callback)
            callback(err, user);
    })
};

function generateRandomId(count) {
    var _sym = 'abcdefghijklmnopqrstuvwxyz1234567890';
    var str = '';
    for(var i = 0; i < count; i++) {
        str += _sym[parseInt(Math.random() * (_sym.length))];
    }
    return str;
}

exports.index = function(req, res, ctx) {
    var email = ctx['email'];
    if (email){
        findUser(ctx, function(err, user){
            if (!err && user){
                user.status = 'disconnect';
                user.save();
            }
        });
    }

    ctx['active'] = 'home';
    res.render('index', ctx);
};

exports.register_room = function(req, res, ctx) {
    //var room_name = req.body.room_name.trim();
    var room_name = 'room_' + generateRandomId(7);
    if (room_name){
        var email = ctx['email'];
        if (email){
            User.findOne({status: {$in: ['ready', 'talking']}, roomName: room_name}, function(err, prevUser){
                if (prevUser){
                    req.flash('message', 'Room name "' + room_name + '" already exist.');
                    res.redirect('/');
                }
                else {
                    findUser(ctx, function(err, user){
                        if (!err && user){
                            user.roomName = room_name;
                            user.status = 'ready';
                            user.save(function(err){
                                res.redirect('/' + room_name);
                            })
                        }
                        else {
                            if (err)
                                req.flash('message', 'db error');
                            else
                                req.flash('message', 'invalid user');
                            res.redirect('/');
                        }
                    })
                }
            })
        }
        else {
            req.flash('message', 'please login');
            res.redirect('/');
        }
/*
        Room.findOne({name: room_name}, function(err, room) {
            if (room) { // already created
                req.flash('message', 'Room name "' + room_name + '" already exist.');
                res.redirect('/');
            } else {
                var newRoom = new Room();
                newRoom.name = room_name;
                newRoom.save(function(err) {
                    if (err)
                        throw err;
                    res.redirect('/' + room_name);
                });
            }
        });
*/
    }
    else {
        req.flash('message', 'Empty Room name.');
        res.redirect('/');
    }
};

exports.enter_room = function(req, res, ctx){
    if (ctx['email']){
        var roomName = req.param('roomName');
        if (roomName == 'favicon.ico')
            res.redirect('/');
        else {
            User.findOne({status: 'ready', roomName: roomName}, function(err, prevUser){
                if (!err && prevUser){
                    ctx['roomName'] = roomName;
                    res.render('room', ctx);
                }
                else {
                    req.flash('message', 'No Exist ' + roomName + ' Room. please Find another user.');
                    req.session.called_room = roomName;
                    res.redirect('/');
                }
            });
/*
            Room.findOne({name: roomName}, function(err, room){
                if (!err && room){
                    ctx['roomName'] = roomName;
                    res.render('room', ctx);
                }
                else {
                    req.flash('message', 'No Exist ' + roomName + ' Room. please Create another room.');
                    req.session.called_room = roomName;
                    res.redirect('/');
                }
            })
*/
        }
    }
    else {
        req.flash('message', 'Please login.');
        res.redirect('/');
    }
};

exports.find_match = function(req, res, ctx){
    var email = ctx['email'];
    if (email){
        findUser(ctx, function(err, user){
            if (!err && user){
                var keyword = req.body.keyword;
                if (!keyword)
                    keyword = user.keyword;
                user.keyword = keyword;
                user.save(function(){
                    User.findOne({'local.email': {$ne: email},
                        'facebook.email': {$ne: email},
                        'google.email': {$ne: email},
                        'roomName': {$ne: user.roomName},
                        status: 'ready', keyword: keyword}, function(err, matchUser){
                        if (!err && matchUser){
                            res.json({err: 0, roomName: matchUser.roomName});
                        }
                        else {
                            res.json({err: 2, message: 'sorry, there is no match user'});
                        }
                    })
                });
            }
            else {
                res.json({err: 1, message: 'invalid user'});
            }
        })
    }
    else {
        res.json({err: 1, message: 'invalid user'});
    }
};

exports.report_match = function(req, res, ctx){
    var roomName = req.body.roomName;
    findUser(ctx, function(err, user){
        if (!err && user){
            user.status = 'talking';
            user.roomName = roomName;
            user.save(function(err){
                if (err)
                    res.json({err: 2, message: 'db error'});
                else
                    res.json({err: 0, message: 'success accept'});
            })
        }
        else {
            res.json({err: 1, message: 'invalid user'});
        }
    })
};

exports.report_leave = function(req, res, ctx){
    findUser(ctx, function(err, user){
        if (!err && user){
            user.status = 'ready';
            user.save(function(err){
                if (err)
                    res.json({err: 2, message: 'db error'});
                else
                    res.json({err: 0, message: 'success accept'});
            })
        }
        else {
            res.json({err: 1, message: 'invalid user'});
        }
    })
};