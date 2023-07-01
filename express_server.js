const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

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
app.use(cookieParser());
//add parsing middleware to convert body from buffer to readable string
app.use(express.urlencoded({ extended: false }));

//URL database
const urlDatabase = {
  b2xVn2: { longUrl: 'http://www.lighthouselabs.ca', userId: 'userRandomID' },
  '9sm5xK': { longUrl: 'http://www.google.com', userId: 'user2RandomID' },
  st53K: { longUrl: 'http://www.amazon.com', userId: 'user2RandomID' }
};

//User Database
const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  },
  ug6kd: {
    id: 'ug6kd',
    email: 'test@test.com',
    password: 'test'
  }
};

/*

HELPER FUNCTIONS

*/
/**
 * TinyUrl Generator
 * @returns tinyURl string
 */
const generateRandomString = function () {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const length = 6; //because we want a 6char string
  let result = '';

  for (let i = 0; i < length; i++) {
    let index = Math.floor(Math.random() * characters.length);
    result += characters.charAt(index);
  }

  return result;
};

/**
 *
 * @param {*} email
 * @returns
 */
const getUserByEmail = function (email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return;
};

/**
 * @param {*} id
 */
const urlsForUser = function (id) {
  let urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userId === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
};

//
//
// ROUTES AND ENDPOINTS
//
//

//Routes
app.get('/', (req, res) => {
  res.send('Hello!');
});
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

/*

GET ROUTES

*/

//route for user registration
app.get('/register', (req, res) => {
  const userId = req.cookies.user_id;

  if (!userId) {
    res.render('user_registration');
    return;
  }
  //if the user is logged in , it redirects to the urls page
  res.redirect('/urls');
});

// route for express to pass data to the template: "urls_index.ejs"
app.get('/urls', (req, res) => {
  const userId = req.cookies.user_id;

  if (!userId) {
    res.status(404).send('Please login to access urls page');
  }

  // const urlsForUser = function (id) {
  //   let result = {};
  //   for (const url in urlDatabase) {
  //     if (urlDatabase[url].userId === userId) {
  //       console.log(url);
  //       result[url] = urlDatabase[url];
  //     }
  //   }
  //   return result;
  // };

  foundUser = urlsForUser(userId);
  console.log('foundUser: ', foundUser);

  const templateVars = {
    users,
    userId: req.cookies['user_id'],
    urls: foundUser
  };
  res.render('urls_index', templateVars);
});

//GET route to show URL form
app.get('/urls/new', (req, res) => {
  const userId = req.cookies.user_id;

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
  const userId = req.cookies.user_id; // id of the logged in user
  const userUrls = urlsForUser(userId); // this gives an object containing urls that belong to the user
  const id = req.params.id;

  console.log('id :', id);
  console.log('userUrls :', userUrls);
  console.log('userUrls.id :', userUrls[id]);
  if (!userId) {
    res.status(403).send('You do not have authorization to see page, Please login to access');
  }
  //checking if the dynamic url id belongs to the user
  if (userUrls[id] === undefined) {
    res.status(404).send('You do not own the URL you are trying to view');
  } else {
    const templateVars = { id, longUrl: urlDatabase[req.params.id].longUrl };
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
  const userId = req.cookies.user_id;

  if (!userId) {
    res.render('user_login');
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
  const existingUser = getUserByEmail(email);

  const newUser = {};
  newUser.id = generateRandomString();
  newUser.email = email;
  newUser.password = password;

  if (!email || !password) {
    res.status(400).send('Please enter a valid email and password');
  } else if (existingUser) {
    res.status(400).send('Email address is taken, please select another email address');
  } else {
    users[newUser.id] = newUser;
    //set cookie for user using their userId and redirect to urls page.
    res.cookie('user_id', newUser.id).redirect('/urls');
  }
  console.log(users);
});

//Route for user login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  let user = getUserByEmail(email);
  console.log(user);
  let userId;

  if (user && password === user.password) {
    userId = user.id;
    res.cookie('user_id', userId).redirect('/urls');
  } else {
    res.status(403).send('Invalid Credientials');
  }
});

//Route for user logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id').redirect('/login');
});

//Route for submitting the form for new Url
app.post('/urls', (req, res) => {
  userId = req.cookies.user_id;
  if (!userId) {
    res.status(401).send('You are not authorised to do that 😝, login to gain access ');
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
app.post('/urls/:id', (req, res) => {
  const newLongUrl = req.body.longUrl;
  urlDatabase[req.params.id] = newLongUrl;
  res.redirect('/urls');
});

//Route for deleteing a url
app.post('/urls/:id/delete', (req, res) => {
  const urlId = req.params.id;
  delete urlDatabase[urlId];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
