const express = require('express');
const app = express();
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
  let result = ' ';

  for (let i = 0; i < length; i++) {
    let index = Math.floor(Math.random() * characters.length);
    result += characters.charAt(index);
  }

  return result;
}
generateRandomString();

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

// route for express to pass data to the template: "urls_index.ejs"
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

//GET route to show form
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

//route for single url
app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render('urls_show', templateVars);
});

//Route for submitting the form
app.post('/urls', (req, res) => {
  console.log(req.body);
  res.send('ok');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
