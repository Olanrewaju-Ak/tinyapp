const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080; // default port 8080

//setting ejs as view engine
app.set('view engine', 'ejs');

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

function generateRandomString() {
  //get a random number -math.random
  //how do you generate random letters
  //concantenate the letters and strings?
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const length = 6; //because we want a 6char string
  let result = '';

  for (let i = 0; i < length; i++) {
    let index = Math.floor(Math.random() * characters.length);
    result += characters.charAt(index);
  }

  return result;
}

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

// route for express to pass data to the template: "urls_index.ejs"
app.get('/urls', (req, res) => {
  const templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

//GET route to show form
app.get('/urls/new', (req, res) => {
  const templateVars = {
    username: req.cookies['username']
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

/*

POST ROUTES

*/

//Route for user login
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username).redirect('/urls');
});

//Route for user logout
app.post('/logout', (req, res) => {
  res.clearCookie('username').redirect('/urls');
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
  console.log(`Example app listening on port ${PORT}!`);
});
