var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo').default || require('connect-mongo');
var mongoose = require('mongoose');
var morgan = require('morgan');
var path = require('path');
var cors = require('cors');
var history = require('connect-history-api-fallback');

const apiVersion = 'v1';
var usersController=require("./controllers/userController");
var drinkController=require("./controllers/drinkController");
var reviewController=require("./controllers/reviewController");
var systembolagetController=require("./controllers/systembolagController");

// Variables
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apk_calc';
var port = process.env.PORT || 3000;
const cookieTtl = 1000 * 60 * 30; // 30 minutes

// Connect to MongoDB
mongoose.connect(mongoURI).catch(function(err) {
    console.error(`Failed to connect to MongoDB with URI: ${mongoURI}`);
    console.error(err.stack);
    process.exit(1);
}).then(function() {
    console.log(`Connected to MongoDB with URI: ${mongoURI}`); // mistake when forward porting
});

// Create Express app
var app = express();
// Parse requests of content-type 'application/json'
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'apekå',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, },
    store: MongoStore.create({ mongoUrl: mongoURI })
}));
// HTTP request logger
app.use(morgan('dev'));
// Enable cross-origin resource sharing for frontend must be registered before api
app.options('*', cors());
app.use(cors());

// Import routes
app.get('/api', function(req, res) {
    res.json({ 'message': 'Welcome to the APK Calc API' });
});

// Session check route for unregistered users, used to check if an
// age prompt is needed
app.get('/api/guest-sessions', function(req, res) {
    let isNewSession = false;

    if (req.session.cookie.maxAge == null ) {
        isNewSession = true;
    }

    req.session.cookie.maxAge = cookieTtl;

    return res.json({ 'newSession': isNewSession });
});

app.use(`/api/${apiVersion}`, drinkController);
app.use(`/api/${apiVersion}`, usersController);
app.use(`/api/${apiVersion}`, reviewController);
app.use(`/api/${apiVersion}`, systembolagetController);

// Catch all non-error handler for api (i.e., 404 Not Found)
app.use('/api/*', function (req, res) {
    res.status(404).json({ 'message': 'Not Found' });
});

// Configuration for serving frontend in production mode
// Support Vuejs HTML 5 history mode
app.use(history());
// Serve static assets
var root = path.normalize(__dirname + '/..');
var client = path.join(root, 'client', 'dist');
app.use(express.static(client));

// Error handler (i.e., when exception is thrown) must be registered last
var env = app.get('env');
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
    console.error(err.stack);
    var err_res = {
        'message': err.message,
        'error': {}
    };
    if (env === 'development') {
        // Return sensitive stack trace only in dev mode
        err_res['error'] = err.stack;
    }
    if (err.name === "ValidationError") {
        const errors = Object.keys(err.errors).map( key => err.errors[key].message);
        return res.status(400).json({"message": `Validation error: ${errors}`});
    }
    res.status(err.status || 500);
    res.json(err_res);
});

app.listen(port, function(err) {
    if (err) throw err;
    console.log(`Express server listening on port ${port}, in ${env} mode`);
    console.log(`Backend: http://localhost:${port}/api/`);
    console.log(`Frontend (production): http://localhost:${port}/`);
});

module.exports = app;
