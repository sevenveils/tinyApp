const express = require("express");
const cookieParser = require('cookie-parser'); // later on we will be using something else instead of cookie-parser
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser()); // later on we will be using something else instead of cookie-parser

app.use(function (req, res, next) {
  res.locals.userid = req.cookies.user_id;
  res.locals.user = users[req.cookies.user_id];
  next();
});

function checkUrl(req, res, next) {
  if (urlDatabase[req.params.id]) {
    next();
  } else {
    res.status(404).send("Page does not exist."); //add html to return to tinyapp index
  }
}

function checkUser(req, res, next) {
  if (urlDatabase[req.params.id].userid === req.cookies.user_id) {
    next();
  } else {
    res.status(403).send("You aren't allowed to access this page. <a href='/urls'>Return to TinyApp.</a>");
  }
}

function authenticate(req, res, next){
  if (req.cookies.user_id) {
    next();
  } else {
    res.status(401).send("Please <a href='/login'>login</a> to view this page.")
  }
}

function validHttp(url){
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
    console.log(url);
  }
  return url;
}

const urlDatabase = {
  "b2xVn2": {
    userid: "userRandomID",
    short: "b2xVn2",
    long: "http://www.lighthouselabs.ca"},
  "9sm5xK": {
    userid: "user2RandomID",
    short: "9sm5xK",
    long: "http://www.google.com"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "password"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
};

function generateRandomString() {
  let text = "";
  let charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++ ) {
    text += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return text;
}

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/urls", authenticate, (req, res) => {
  let userid = req.cookies["user_id"];
  let templateVars = { urls: urlDatabase }; // ejs
  res.render("urls_index", templateVars);
});

app.get('/urls/new', authenticate, (req, res) => {
  let user_ID = req.cookies['user_id'];
  if (users[user_ID]) {
    res.render('urls_new', {
      user: users[user_ID]
    });
  } else {
  res.redirect('/login');
  }
});

app.get("/u/:id", checkUrl, (req, res) => {
  let longURL = urlDatabase[req.params.id].long;
  res.redirect(longURL);
});

app.get("/urls/:id", checkUrl, checkUser, (req, res) => {
    let userid = req.cookies["user_id"];
    let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id].long };
    res.render("urls_show", templateVars);
});

app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Please enter both email and password");
    return;
  }
  for (let user in users) {
    if (users[user].email === req.body.email) {
      if (users[user].password === req.body.password) {
        res.cookie("user_id", users[user].id);
        res.redirect("/urls");
        return;
      } else {
          res.status(403).send("password for this email is not correct");
          return;
      }
    }
  }
  res.status(403).send("email does not match any user account");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls", authenticate, (req, res) => {
  const longURL = validHttp(req.body.longURL);
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    userid: req.cookies["user_id"],
    short: shortURL,
    long: longURL
  }
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", checkUrl, checkUser, (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", checkUrl, checkUser, (req, res) => {
  urlDatabase[req.params.id].long = req.body.newLongUrl;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("Please enter email and/or password");
    return;
  }

  for (let user in users) {
    if (users[user].email === req.body.email) {
      res.status(400).send("Email matches an account that already exists");
      return;
    }
  }
  let randomId = generateRandomString();
  users[randomId] = {
    id: randomId,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", randomId);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Make it so!`);
});