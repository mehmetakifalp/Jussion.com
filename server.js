
/*
 * Load required modules
 */
var http   		    = require("http");
var https 			= require('https');
var express		    = require("express");
var fs 				= require('fs');
var bodyParser	    = require('body-parser');
var io     		    = require("socket.io");
var easyrtc 	    = require("easyrtc");
var path 		    = require('path');
var config 		    = require('./config/config');
var mongoose        = require('mongoose');
var passport        = require('passport');
var session 		= require('express-session');
var cookieParser    = require('cookie-parser');
var flash           = require('connect-flash');


// connect to our database
mongoose.connect(config.dbUrl);

// pass passport for configuration
require('./libs/passport')(passport);

/*
 * Setup and configure Express http server.
//set up our express application
*/
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', config.APP_PORT);

//app.use(morgan('tiny'));    // log every request to the console
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({secret: 'simpleWebrtc', resave: true, saveUninitialized: true})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(express.static(path.join(__dirname, 'public')));

/*
 * Routes
 */
// load our routes and pass in our app and fully configured passport
require('./routes/auth.js')(app, passport);

// http requests
var home = require('./routes/index');
/*
 * Controllers
 */
var ctx = {
	env: app.get('env')
};

var httpHandler = function(handler) {
	return function(req, res) {
        ctx['email'] =  req.session.email;
        ctx['username'] =  req.session.username;
        ctx['authtype'] =  req.session.authtype;
        ctx['birthyear'] = req.session.birthyear;
        ctx['gender'] = req.session.gender;
        ctx['avatar'] = req.session.avatar;
        ctx['message'] = req.flash('message');
        ctx['called_room'] = req.session.called_room;
        ctx['keywords'] = config.keywords;
        handler(req, res, ctx);
	};
};

// Redirect Non-WWW to WWW
/*
app.get('*', function(req, res, next) {
    if (req.headers.host.slice(0, 3) != 'www' && req.headers.host.slice(0, 9) != 'localhost' && req.headers.host.slice(0, 3) != '192') {
        res.redirect('http://www.' + req.headers.host + req.url, 301);
    } else {
        next();
    }
});
*/

app.get('/', httpHandler(home.index));
app.post('/create-room', httpHandler(home.register_room));
app.get('/:roomName', httpHandler(home.enter_room));
app.post('/find-match', httpHandler(home.find_match));
app.post('/report-match', httpHandler(home.report_match));
app.post('/report-leave', httpHandler(home.report_leave));

/*
 * Start Express http server on port APP_PORT
 */
/*
var httpServer = http.createServer(app).listen(config.APP_PORT, function() {
	console.log('Express server listening on port ' + app.get('port'));
});

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(httpServer, {"log level":1});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer);
*/

/**
 * Setting SSL
 */

http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(app.get('port'));

//Start Express https server on port 443
var httpsServer = https.createServer({
    key:  fs.readFileSync("./keys/jussion.key"),
    cert: fs.readFileSync("./keys/jussion.crt")
}, app).listen(443);

// Start Socket.io so it attaches itself to Express server
var socketSslServer = io.listen(httpsServer, {"log level":1});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketSslServer);

