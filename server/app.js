require('dotenv').config();
var https = require('https');
var fs = require('fs');
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
var mapController=require("./controllers/mapController");

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
  secret: 'apekå', // In production, use .env variable for this
  resave: false,
  saveUninitialized: false,
    
  // Cookie only sent over https, allow cookie to be sent between front and backend, 
  // cookie expires after 30 mins.
  cookie: { secure: true,
    sameSite: 'none',
    maxAge: cookieTtl

  },
  store: MongoStore.create({ mongoUrl: mongoURI })
}));
// HTTP request logger
app.use(morgan('dev'));
// Enable cross-origin resource sharing for frontend must be registered before api
app.options('*', cors({
  origin: 'https://localhost:5173',
  credentials: true
}));

// Import routes
app.get('/api', function(req, res) {
  res.json({ 'message': 'Welcome to the APK Calc API' });
});

app.use(`/api/${apiVersion}`, drinkController);
app.use(`/api/${apiVersion}`, usersController);
app.use(`/api/${apiVersion}`, reviewController);
app.use(`/api/${apiVersion}`, systembolagetController);
app.use(`/api/${apiVersion}`, mapController);

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

try {
  const httpsOptions = {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost.pem')
  };
  https.createServer(httpsOptions, app).listen(port, function(err) {
    if (err) throw err;
    console.log(`Express HTTPS server listening on port ${port}, in ${env} mode`);
    console.log(`Backend: https://localhost:${port}/api/`);
    console.log(`Frontend (production): https://localhost:${port}/`);
  });
} catch (err) {
  console.error("Failed to start HTTPS server:", err);
}


module.exports = app;
