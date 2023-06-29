const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080; // default port 8080

//setting ejs as view engine
app.set('view engine', 'ejs');

//URL database
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
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
  }
};

/*

HELPER FUNCTIONS

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

const getUserByEmail = function (email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return;
};

//add parsing middleware to convert body from buffer to readable string
app.use(express.urlencoded({ extended: true }));

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
  res.render('user_registration');
});

// route for express to pass data to the template: "urls_index.ejs"
app.get('/urls', (req, res) => {
  const templateVars = {
    users,
    userId: req.cookies['user_id'],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

//GET route to show URL form
app.get('/urls/new', (req, res) => {
  const templateVars = {
    userId: req.cookies['user_id']
  };
  res.render('urls_new', templateVars);
});

//route for single url
app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render('urls_show', templateVars);
});

//route to handle shortURL requests
app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    res.status(404).send('URL id does not exist in database,Plese enter a valid id');
  }
  res.redirect(longURL);
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

//Route for submitting the form
app.post('/urls', (req, res) => {
  let newId = generateRandomString();
  urlDatabase[newId] = req.body.longURL;
  res.redirect(`/urls/${newId}`);
});

//Route for editing a long url
app.post('/urls/:id', (req, res) => {
  const newLongURL = req.body.longURL;
  urlDatabase[req.params.id] = newLongURL;
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
