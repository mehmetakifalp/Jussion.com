module.exports = function(app, passport) {

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        req.session.uid = '';
        req.session.email = '';
        req.session.username = '';
        req.session.birthyear = '';
        req.session.avatar = '';
        req.session.authtype = '';
        req.session.called_room= '';
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // process the login form
    app.post('/login', function(req, res, next) {
        passport.authenticate('local-login', {
            failureRedirect: '/',    // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }, function(err, user) {
            if (err) { return next(err); }
            if (!user)
                return res.send(req.flash('loginMessage'));
            user.keyword = req.body.keyword;
            user.status = 'disconnect';
            user.save();

            req.login(user, function(err) {
                if (err) { return next(err); }
                req.session.uid = user._id;
                req.session.email = user.local.email;
                req.session.username = user.local.username;
                req.session.avatar = user.local.avatar;
                req.session.birthyear = user.local.birthyear;
                req.session.gender = user.local.gender;
                req.session.authtype = 'local';

                if (req.session.called_room == '' || typeof req.session.called_room == 'undefined') {
                    return res.send("success");
                } else {
                    return res.send('gocall');
                }
            });
        })(req, res, next);
    });

    // SIGNUP =================================
    // process the signup form
    app.post('/signup', function(req, res, next) {
        passport.authenticate('local-signup', {
            failureRedirect: '/',    // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }, function(err, user) {
            if (err) { return next(err); }
            if (!user)
                return res.send(req.flash('signupMessage'));

            req.login(user, function(err) {
                if (err) { return next(err); }

                req.session.uid = user._id;
                req.session.email = user.local.email;
                req.session.username = user.local.username;
                req.session.authtype = 'local';
                req.session.avatar = user.local.avatar;
                req.session.birthyear = user.local.birthyear;
                req.session.gender = user.local.gender;

                if (req.session.called_room == '' || typeof req.session.called_room == 'undefined') {
                    return res.send("success");
                } else {
                    return res.send('gocall');
                }
            });
        })(req, res, next);
    });

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

    app.get('/auth/facebook/callback', function(req, res, next) {
        passport.authenticate('facebook', {
            failureRedirect: '/'
        }, function(err, user) {
            if (err) { return next(err); }
            if (!user)
                return res.redirect("/");

            req.login(user, function(err) {
                if (err) { return next(err); }

                req.session.uid = user._id;
                req.session.email = user.facebook.email;
                req.session.username = user.facebook.name;
                req.session.birthyear = user.facebook.birthyear;
                req.session.avatar = user.facebook.avatar;
                req.session.authtype = 'facebook';

                if (req.session.called_room == ''|| typeof req.session.called_room == 'undefined')
                    return res.redirect("/");
                else
                    return res.redirect ('/' + req.session.called_room);

            });
        })(req, res, next);
    });

    // google ---------------------------------

    // send to google to do the authentication
    app.get('/auth/google', passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'}));

    app.get('/auth/google/callback', function(req, res, next) {
        passport.authenticate('google', {
            failureRedirect: '/'
        }, function(err, user) {
            if (err) { return next(err); }
            if (!user)
                return res.redirect("/");

            req.login(user, function(err) {
                if (err) { return next(err); }

                req.session.uid = user._id;
                req.session.email = user.google.email;
                req.session.username = user.google.name;
                req.session.birthyear = user.google.birthyear;
                req.session.avatar = user.google.avatar;
                req.session.authtype = 'google';

                if (req.session.called_room == ''|| typeof req.session.called_room == 'undefined')
                    return res.redirect("/");
                else
                    return res.redirect ('/' + req.session.called_room);
            });
        })(req, res, next);
    });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
