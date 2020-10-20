"use strict";

var _passport = _interopRequireDefault(require("passport"));

var _passportGithub = _interopRequireDefault(require("passport-github"));

var _expressSession = _interopRequireDefault(require("express-session"));

var _path = _interopRequireDefault(require("path"));

var _express = _interopRequireDefault(require("express"));

var _passportGoogleOauth = _interopRequireDefault(require("passport-google-oauth2"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

//////////////////////////////////////////////////////////////////////////
//IMPORTS AND VARIABLE INITIALIZATIONS
//The following code imports necessary dependencies and initializes
//variables used in the server middleware.
//////////////////////////////////////////////////////////////////////////
var LOCAL_PORT = 8081;
var DEPLOY_URL = "http://ch20-env.eba-rhvqsihb.us-east-1.elasticbeanstalk.com";
var PORT = process.env.HTTP_PORT || LOCAL_PORT;
var GithubStrategy = _passportGithub["default"].Strategy;
var GoogleStrategy = _passportGoogleOauth["default"].Strategy;
var app = (0, _express["default"])(); //////////////////////////////////////////////////////////////////////////
//PASSPORT SET-UP
//The following code sets up the app with OAuth authentication using
//the 'github' strategy in passport.js.
//////////////////////////////////////////////////////////////////////////

_passport["default"].use(new GithubStrategy({
  clientID: "1d90e0594c090c4a6a8b",
  clientSecret: "97b239b3bc79632dfd4f9d197628cfac487d2086",
  callbackURL: DEPLOY_URL + "/auth/github/callback"
}, function (accessToken, refreshToken, profile, done) {
  // TO DO: If user in profile object isn’t yet in our database, add the user here
  return done(null, profile);
}));

_passport["default"].use(new GoogleStrategy({
  clientID: "932434474282-at5bu4nelv37fmmklq15li2g85nlpakn.apps.googleusercontent.com",
  clientSecret: "Nghf69OlNbqJStpCf0rjG9-T",
  callbackURL: DEPLOY_URL + "/auth/google/callback"
}, function (accessToken, refreshToken, profile, done) {
  // TO DO: If user in profile object isn’t yet in our database, add the user here
  return done(null, profile);
}));

_passport["default"].serializeUser(function (user, done) {
  console.log("In serializeUser.");
  console.log(JSON.stringify(user)); //Note: The code does not use a back-end database. When we have back-end 
  //database, we would put user info into the database in the callback 
  //above and only serialize the unique user id into the session

  var userObject = {
    id: user.displayName + "@" + user.provider,
    displayName: user.displayName,
    provider: user.provider,
    profileImageUrl: user.photos[0].value
  };
  done(null, userObject);
}); //Deserialize the current user from the session
//to persistent storage.


_passport["default"].deserializeUser(function (user, done) {
  console.log("In deserializeUser."); //TO DO: Look up the user in the database and attach their data record to
  //req.user. For the purposes of this demo, the user record received as a param 
  //is just being passed through, without any database lookup.

  done(null, user);
}); //////////////////////////////////////////////////////////////////////////
//INITIALIZE EXPRESS APP
// The following code uses express.static to serve the React app defined 
//in the client/ directory at PORT. It also writes an express session
//to a cookie, and initializes a passport object to support OAuth.
/////////////////////////////////////////////////////////////////////////


app.use((0, _expressSession["default"])({
  secret: "speedgolf",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60
  }
})).use(_express["default"]["static"](_path["default"].join(__dirname, "client/build"))).use(_passport["default"].initialize()).use(_passport["default"].session()).listen(PORT, function () {
  return console.log("Listening on ".concat(PORT));
}); //////////////////////////////////////////////////////////////////////////
//DEFINE EXPRESS APP ROUTES
//////////////////////////////////////////////////////////////////////////
//AUTHENTICATE route: Uses passport to authenticate with GitHub.
//Should be accessed when user clicks on 'Login with GitHub' button on 
//Log In page.

app.get('/auth/github', _passport["default"].authenticate('github')); //CALLBACK route:  GitHub will call this route after the
//OAuth authentication process is complete.
//req.isAuthenticated() tells us whether authentication was successful.

app.get('/auth/github/callback', _passport["default"].authenticate('github', {
  failureRedirect: '/'
}), function (req, res) {
  console.log("auth/github/callback reached.");
  res.redirect('/'); //sends user back to login screen; 
  //req.isAuthenticated() indicates status
}); //AUTHENTICATE route: Uses passport to authenticate with GitHub.
//Should be accessed when user clicks on 'Login with GitHub' button on 
//Log In page.

app.get('/auth/google', _passport["default"].authenticate('google', {
  scope: ['profile']
})); //CALLBACK route:  GitHub will call this route after the
//OAuth authentication process is complete.
//req.isAuthenticated() tells us whether authentication was successful.

app.get('/auth/google/callback', _passport["default"].authenticate('google', {
  failureRedirect: '/'
}), function (req, res) {
  console.log("auth/google/callback reached.");
  res.redirect('/'); //sends user back to login screen; 
  //req.isAuthenticated() indicates status
}); //LOGOUT route: Use passport's req.logout() method to log the user out and
//redirect the user to the main app page. req.isAuthenticated() is toggled to false.

app.get('/auth/logout', function (req, res) {
  console.log('/auth/logout reached. Logging out');
  req.logout();
  res.redirect('/');
}); //TEST route: Tests whether user was successfully authenticated.
//Should be called from the React.js client to set up app state.

app.get('/auth/test', function (req, res) {
  console.log("auth/test reached.");
  var isAuth = req.isAuthenticated();

  if (isAuth) {
    console.log("User is authenticated");
    console.log("User record tied to session: " + JSON.stringify(req.user));
  } else {
    //User is not authenticated
    console.log("User is not authenticated");
  } //Return JSON object to client with results.


  res.json({
    isAuthenticated: isAuth,
    user: req.user
  });
});
