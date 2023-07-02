const express = require('express');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');

//Helper functions
const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers');

/**
 * Configuration
 */
const app = express();
const PORT = 8080; // default port 8080
//setting ejs as view engine
app.set('view engine', 'ejs');

/**
 * Middleware setup
 */
app.use(morgan('dev'));
// app.use(cookieParser());
app.use(
  cookieSession({
    name: 'user_id',
    keys: ['197b2e27-b1fa-4890-a457-5283ba1f09d0', '917dc71b-20d6-490d-bdf8-3ecc53cb55b3'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
);
//add parsing middleware to convert body from buffer to readable string
app.use(express.urlencoded({ extended: false }));

//method override
app.use(methodOverride('_method'));

//URL database
const urlDatabase = {
  b2xVn2: { longUrl: 'http://www.lighthouselabs.ca', userId: 'userRandomID' },
  '9sm5xK': { longUrl: 'http://www.google.com', userId: 'user2RandomID' },
  st53K: { longUrl: 'http://www.amazon.com', userId: 'user2RandomID' }
};

//User Database
const saltRounds = 10; //for hashing passwords
const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('purple-monkey-dinosaur', saltRounds)
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dishwasher-funk', saltRounds)
  },
  ug6kd: {
    id: 'ug6kd',
    email: 'test@test.com',
    password: bcrypt.hashSync('test', saltRounds)
  }
};

//
//
// ROUTES AND ENDPOINTS
//
//

//Routes
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

/*

GET ROUTES

*/

//Home page route will redirect to urls if user is loggen in or login page if not
app.get('/', (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect('/login');
  }
  res.redirect('/urls');
});

//route for user registration
app.get('/register', (req, res) => {
  const userId = req.session.user_id;
  const templateVars = { userId, users };
  if (!userId) {
    res.render('user_registration', templateVars);
    return;
  }
  //if the user is logged in , it redirects to the urls page
  res.redirect('/urls');
});

// route for express to pass data to the template: "urls_index.ejs"
app.get('/urls', (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    res.status(404).send('Please login to access urls page').redirect('/login');
  }

  foundUser = urlsForUser(userId, urlDatabase);

  const templateVars = {
    users,
    userId: req.session['user_id'],
    urls: foundUser
  };
  res.render('urls_index', templateVars);
});

//GET route to show URL form
app.get('/urls/new', (req, res) => {
  const userId = req.session.user_id;

  //if the user is not logged in , it redirects to the login page
  if (!userId) {
    res.redirect('/login');
  }
  const templateVars = {
    users,
    userId
  };
  res.render('urls_new', templateVars);
});

//route for single url
app.get('/urls/:id', (req, res) => {
  const userId = req.session.user_id; // id of the logged in user
  const userUrls = urlsForUser(userId, urlDatabase); // this gives an object containing urls that belong to the user
  const id = req.params.id;
  if (!urlDatabase[id]) {
    res.status(404).send('URL does not exist ');
    return;
  }

  if (!userId) {
    res.status(403).send('You do not have authorization to see page, Please login to access');
  }
  //checking if the dynamic url id belongs to the user
  if (userUrls[id] === undefined) {
    res.status(404).send('You do not own the URL you are trying to view');
  } else {
    const templateVars = { id, userId, users, longUrl: urlDatabase[req.params.id].longUrl };
    res.render('urls_show', templateVars);
  }
});

//route to handle shortURL requests
app.get('/u/:id', (req, res) => {
  const longUrl = urlDatabase[req.params.id].longUrl;
  if (!longUrl) {
    res.status(404).send('URL id does not exist in database 😓,Plese enter a valid id');
  }
  res.redirect(longUrl);
});

//route for login page
app.get('/login', (req, res) => {
  const userId = req.session.user_id;
  const templateVars = { userId, users };

  if (!userId) {
    res.render('user_login', templateVars);
    return;
  }
  res.redirect('/urls');
});

/*

POST ROUTES

*/
// Route for User Registration
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const existingUser = getUserByEmail(email, users);

  const newUser = {};
  newUser.id = generateRandomString();
  newUser.email = email;
  newUser.password = bcrypt.hashSync(password);

  if (!email || !password) {
    res.status(400).send('Please enter a valid email and password');
  } else if (existingUser) {
    res.status(400).send('Email address is taken, please select another email address');
  } else {
    users[newUser.id] = newUser;
    //set cookie for user using their userId and redirect to urls page.

    req.session.user_id = newUser.id;
    res.redirect('/urls');
  }
  console.log(users);
});

//Route for user login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  let user = getUserByEmail(email, users);
  const hashedPassword = user.password;
  let userId;

  if (user && bcrypt.compareSync(password, hashedPassword)) {
    userId = user.id;
    req.session.user_id = userId;
    // res.cookie('user_id', userSessionId)
    res.redirect('/urls');
  } else {
    res.status(403).send('Invalid Credientials');
  }
});

//Route for user logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

//Route for submitting the form for new Url
app.post('/urls', (req, res) => {
  userId = req.session.user_id;
  if (!userId) {
    res.status(401).send('You are not authorised to do that 😝, login to gain access ');
    return;
  }
  //generate TinyUrl for newLongUrl
  let newLongUrlId = generateRandomString();
  let longUrl = req.body.longUrl;
  //creating the newLongUrl object in database to pass in the lonUrl key and value
  urlDatabase[newLongUrlId] = {};
  urlDatabase[newLongUrlId].longUrl = longUrl;
  urlDatabase[newLongUrlId].userId = userId;

  res.redirect(`/urls/${newLongUrlId}`);
});

//Route for editing a long url
app.put('/urls/:id', (req, res) => {
  const urlId = req.params.id;
  const userId = req.session.user_id; // id of the logged in user
  const userUrls = urlsForUser(userId, urlDatabase); // this gives an object containing urls that belong to the user
  const newLongUrl = req.body.longUrl;
  //checking if user is logged in
  if (!userId) {
    res.status(401).send('You are not authorised to do that 😝, login to gain access ');
    return;
  }

  //checking if urlId exists in the database
  else if (!urlDatabase[urlId]) {
    res.status(404).send('URL does not exist ');
    return;
  } else if (userUrls[urlId] === undefined) {
    res.status(401).send('You are not authorised edit this URL');
    return;
  } else {
    urlDatabase[urlId].longUrl = newLongUrl;
    console.log(urlDatabase);
    res.redirect('/urls');
  }
});

//Route for deleteing a url
app.delete('/urls/:id/delete', (req, res) => {
  const urlId = req.params.id;
  const userId = req.session.user_id; // id of the logged in user
  const userUrls = urlsForUser(userId, urlDatabase); // this gives an object containing urls that belong to the user
  //checking if user is logged in
  if (!userId) {
    res.status(401).send('You are not authorised to do that 😝, login to gain access ');
    return;
  }

  //checking if urlId exists in the database
  else if (!urlDatabase[urlId]) {
    res.status(404).send('URL does not exist ');
    return;
  }

  //checking if the dynamic url id belongs to the user
  else if (userUrls[urlId] === undefined) {
    res.status(401).send('You are not authorised delete this URL');
    return;
  } else {
    delete urlDatabase[urlId];
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
