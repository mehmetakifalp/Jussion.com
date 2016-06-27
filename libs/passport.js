// load all the things we need
var LocalStrategy       = require('passport-local').Strategy;
var FacebookStrategy    = require('passport-facebook').Strategy;
var GoogleStrategy      = require('passport-google-oauth').OAuth2Strategy;
var moment              = require('moment');


// load up the user model
var User = require('../models/user');

// load the auth variables
var configAuth = require('../config/auth');

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function(req, email, password, done) {
            // asynchronous
            process.nextTick(function() {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user) {
                        console.log('local.email', 'No user found.');
                        return done(null, false, req.flash('loginMessage', 'Incorrect username or password.'));
                    }

                    if (!user.validPassword(password)) {
                        console.log('local.email', 'Oops! Wrong password.');
                        return done(null, false, req.flash('loginMessage', 'Incorrect username or password.'));
                    }

                    // all is well, return user
                    else
                        return done(null, user);
                });
            });
        })
    );

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function(req, email, password, done) {
            // asynchronous
            process.nextTick(function() {

                //  Whether we're signing up or connecting an account, we'll need
                //  to know if the email address is in use.
                User.findOne({'local.email': email}, function(err, existingUser) {

                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if there's already a user with that email
                    if (existingUser)
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));

                    //  If we're logged in, we're connecting a new local account.
                    if(req.user) {
                        var user                = req.user;
                        user.local.email        = email;
                        user.local.password     = user.generateHash(password);
                        user.local.username     = req.body.username;
                        user.local.birthyear    = req.body.birthyear;
                        user.local.gender       = req.body.gender;
                        user.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, user);
                        });
                    }
                    //  We're not logged in, so we're creating a brand new user.
                    else {
                        console.log(req.body);
                        // create the user
                        var newUser             = new User();
                        newUser.local.email     = email;
                        newUser.local.password  = newUser.generateHash(password);
                        newUser.local.username  = req.body.username;
                        newUser.local.birthyear = req.body.birthyear;
                        newUser.local.gender    = req.body.gender;

                        newUser.save(function(err) {
                            if (err)
                                throw err;

                            return done(null, newUser);
                        });
                    }

                });
            });

        })
    );

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({
            clientID        : configAuth.facebookAuth.clientID,
            clientSecret    : configAuth.facebookAuth.clientSecret,
            callbackURL     : configAuth.facebookAuth.callbackURL,
            passReqToCallback : true, // allows us to pass in the req from our route (lets us check if a user is logged in or not)
            profileFields: ['id', 'displayName', 'email', 'birthday', 'gender', 'photos']
        },
        function(req, token, refreshToken, profile, done) {
            // asynchronous
            process.nextTick(function() {
                // check if the user is already logged in
                if (!req.user) {
                    User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.facebook.token) {
                                user.facebook.token = token;
                                user.facebook.name  = profile.displayName;
                                user.facebook.email = profile.emails[0].value;
                                if (profile.gender)
                                    user.facebook.gender = profile.gender;
                                else
                                    user.facebook.gender = '';
                                if (profile._json.birthday)
                                    user.facebook.birthyear = moment(profile._json.birthday).year();
                                else
                                    user.facebook.birthyear = 0;
                                if (profile.photos && profile.photos.length)
                                    user.facebook.avatar = profile.photos[0].value;
                                else
                                    user.facebook.avatar = '';

                                user.save(function(err) {
                                    if (err)
                                        throw err;
                                    return done(null, user);
                                });
                            }

                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user, create them
                            var newUser            = new User();
                            newUser.facebook.id    = profile.id;
                            newUser.facebook.token = token;
                            newUser.facebook.name  = profile.displayName;
                            newUser.facebook.email = profile.emails[0].value;
                            if (profile.gender)
                                newUser.facebook.gender = profile.gender;
                            else
                                newUser.facebook.gender = '';
                            if (profile._json.birthday)
                                newUser.facebook.birthyear = moment(profile._json.birthday).year();
                            else
                                newUser.facebook.birthyear = 0;
                            if (profile.photos && profile.photos.length)
                                newUser.facebook.avatar = profile.photos[0].value;
                            else
                                newUser.facebook.avatar = '';

                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }
                    });

                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user            = req.user; // pull the user out of the session
                    user.facebook.id    = profile.id;
                    user.facebook.token = token;
                    user.facebook.name  = profile.displayName;
                    user.facebook.email = profile.emails[0].value;
                    if (profile.gender)
                        user.facebook.gender = profile.gender;
                    else
                        user.facebook.gender = '';
                    if (profile._json.birthday)
                        user.facebook.birthyear = moment(profile._json.birthday).year();
                    else
                        user.facebook.birthyear = 0;
                    if (profile.photos && profile.photos.length)
                        user.facebook.avatar = profile.photos[0].value;
                    else
                        user.facebook.avatar = '';

                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });

                }
            });

        })
    );
    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({
            clientID        : configAuth.googleAuth.clientID,
            clientSecret    : configAuth.googleAuth.clientSecret,
            callbackURL     : configAuth.googleAuth.callbackURL,
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function(req, token, refreshToken, profile, done) {

            // asynchronous
            process.nextTick(function() {

                // check if the user is already logged in
                if (!req.user) {

                    User.findOne({ 'google.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);

                        if (user) {

                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.google.token) {
                                user.google.token = token;
                                user.google.name  = profile.displayName;
                                user.google.email = profile.emails[0].value; // pull the first email
                                if (profile.gender)
                                    user.google.gender = profile.gender;
                                else
                                    user.google.gender = '';
                                if (profile._json.birthday)
                                    user.google.birthyear = moment(profile._json.birthday).year();
                                else
                                    user.google.birthyear = 0;
                                if (profile.photos && profile.photos.length)
                                    user.google.avatar = profile.photos[0].value;
                                else
                                    user.google.avatar = '';

                                user.save(function(err) {
                                    if (err)
                                        throw err;
                                    return done(null, user);
                                });
                            }

                            return done(null, user);
                        } else {
                            var newUser          = new User();
                            newUser.google.id    = profile.id;
                            newUser.google.token = token;
                            newUser.google.name  = profile.displayName;
                            newUser.google.email = profile.emails[0].value; // pull the first email
                            if (profile.gender)
                                newUser.google.gender = profile.gender;
                            else
                                newUser.google.gender = '';
                            if (profile._json.birthday)
                                newUser.google.birthyear = moment(profile._json.birthday).year();
                            else
                                newUser.google.birthyear = 0;
                            if (profile.photos && profile.photos.length)
                                newUser.google.avatar = profile.photos[0].value;
                            else
                                newUser.google.avatar = '';

                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }
                    });

                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user          = req.user; // pull the user out of the session
                    user.google.id    = profile.id;
                    user.google.token = token;
                    user.google.name  = profile.displayName;
                    user.google.email = profile.emails[0].value; // pull the first email
                    if (profile.gender)
                        user.google.gender = profile.gender;
                    else
                        user.google.gender = '';
                    if (profile._json.birthday)
                        user.google.birthyear = moment(profile._json.birthday).year();
                    else
                        user.google.birthyear = 0;
                    if (profile.photos && profile.photos.length)
                        user.google.avatar = profile.photos[0].value;
                    else
                        user.google.avatar = '';

                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });

                }

            });

        })
    );
};
