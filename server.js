//////////////////////////////////////////////////////////////////////////
//IMPORTS AND VARIABLE INITIALIZATIONS
//The following code imports necessary dependencies and initializes
//variables used in the server middleware.
//////////////////////////////////////////////////////////////////////////
import passport from 'passport';
import passportGithub from 'passport-github'; 
import session from 'express-session';
import path from 'path';
import express from 'express';
import passportGoogle from 'passport-google-oauth2';


const LOCAL_PORT = 8081;
const DEPLOY_URL = "http://ch20-env.eba-rhvqsihb.us-east-1.elasticbeanstalk.com";
const PORT = process.env.HTTP_PORT || LOCAL_PORT;
const GithubStrategy = passportGithub.Strategy;
var GoogleStrategy = passportGoogle.Strategy;
const app = express();

//////////////////////////////////////////////////////////////////////////
//PASSPORT SET-UP
//The following code sets up the app with OAuth authentication using
//the 'github' strategy in passport.js.
//////////////////////////////////////////////////////////////////////////
passport.use(new GithubStrategy({
    clientID: "1d90e0594c090c4a6a8b",
    clientSecret: "97b239b3bc79632dfd4f9d197628cfac487d2086",
    callbackURL: DEPLOY_URL + "/auth/github/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // TO DO: If user in profile object isn’t yet in our database, add the user here
    return done(null, profile);
  }
));

passport.use(new GoogleStrategy({
    clientID:     "932434474282-at5bu4nelv37fmmklq15li2g85nlpakn.apps.googleusercontent.com",
    clientSecret: "Nghf69OlNbqJStpCf0rjG9-T",
    callbackURL: DEPLOY_URL + "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // TO DO: If user in profile object isn’t yet in our database, add the user here
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
    console.log("In serializeUser.");
    console.log(JSON.stringify(user));
    //Note: The code does not use a back-end database. When we have back-end 
    //database, we would put user info into the database in the callback 
    //above and only serialize the unique user id into the session
    let userObject = {
      id: user.displayName + "@" + user.provider,
      displayName : user.displayName,
      provider : user.provider,
      profileImageUrl : user.photos[0].value
    };
    done(null, userObject);
  });
  
  //Deserialize the current user from the session
  //to persistent storage.
  passport.deserializeUser((user, done) => {
    console.log("In deserializeUser.");
    //TO DO: Look up the user in the database and attach their data record to
    //req.user. For the purposes of this demo, the user record received as a param 
    //is just being passed through, without any database lookup.
    done(null, user);
  });
  

//////////////////////////////////////////////////////////////////////////
//INITIALIZE EXPRESS APP
// The following code uses express.static to serve the React app defined 
//in the client/ directory at PORT. It also writes an express session
//to a cookie, and initializes a passport object to support OAuth.
/////////////////////////////////////////////////////////////////////////
app
  .use(session({secret: "speedgolf", 
                resave: false,
                saveUninitialized: false,
                cookie: {maxAge: 1000 * 60}}))
  .use(express.static(path.join(__dirname,"client/build")))
  .use(passport.initialize())
  .use(passport.session())
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

//////////////////////////////////////////////////////////////////////////
//DEFINE EXPRESS APP ROUTES
//////////////////////////////////////////////////////////////////////////

//AUTHENTICATE route: Uses passport to authenticate with GitHub.
//Should be accessed when user clicks on 'Login with GitHub' button on 
//Log In page.
app.get('/auth/github', passport.authenticate('github'));

//CALLBACK route:  GitHub will call this route after the
//OAuth authentication process is complete.
//req.isAuthenticated() tells us whether authentication was successful.
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    console.log("auth/github/callback reached.")
    res.redirect('/'); //sends user back to login screen; 
                       //req.isAuthenticated() indicates status
  }
);

//AUTHENTICATE route: Uses passport to authenticate with GitHub.
//Should be accessed when user clicks on 'Login with GitHub' button on 
//Log In page.
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

//CALLBACK route:  GitHub will call this route after the
//OAuth authentication process is complete.
//req.isAuthenticated() tells us whether authentication was successful.
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    console.log("auth/google/callback reached.")
    res.redirect('/'); //sends user back to login screen; 
                       //req.isAuthenticated() indicates status
  }
);

//LOGOUT route: Use passport's req.logout() method to log the user out and
//redirect the user to the main app page. req.isAuthenticated() is toggled to false.
app.get('/auth/logout', (req, res) => {
    console.log('/auth/logout reached. Logging out');
    req.logout();
    res.redirect('/');
});

//TEST route: Tests whether user was successfully authenticated.
//Should be called from the React.js client to set up app state.
app.get('/auth/test', (req, res) => {
    console.log("auth/test reached.");
    const isAuth = req.isAuthenticated();
    if (isAuth) {
        console.log("User is authenticated");
        console.log("User record tied to session: " + JSON.stringify(req.user));
    } else {
        //User is not authenticated
        console.log("User is not authenticated");
    }
    //Return JSON object to client with results.
    res.json({isAuthenticated: isAuth, user: req.user});
});
