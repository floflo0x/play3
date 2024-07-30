if(process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require('express');

// const csrf = require('csurf');

const cookieParser = require('cookie-parser');

const session = require('express-session');

const flash = require('connect-flash');

const authRoute = require('./routes/auth');

const userRoute = require('./routes/user');

const path = require('path');

const request = require("request");

const app = express();

// const csrfProtection = csrf({ cookie: true });

app.set("view engine", "ejs");

app.set("views", "views");

let selectFunction = (item1, item2) => {
  let options = {
    method: "POST",
    url: "https://mateys.xyz/app/api/connection/crypto_api/query.php",
    formData: {
      q1: item1,
      q2: item2,
    },
  };
  return options;
};

app.enable("trust proxy");

app.use(cookieParser());

app.use(session({
  secret: 'jefjwegj@!*&%^*%(1234#',
  resave: false,
  proxy: true,
  saveUninitialized: true,
  cookie: { secure: true, sameSite: "none", httpOnly: true },
}));

app.use(flash());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// app.use(csrfProtection);

// app.use((req, res, next) => {
//   res.locals.csrfToken = req.csrfToken();
//   next();
// })

// Middleware to set the default language to French ('fr')
app.use((req, res, next) => {
  // req.cookies.email = req.cookies.email || '';
  // req.cookies.isLoggedIn = req.cookies.isLoggedIn || 'false';
  req.session.name = req.session.name || req.cookies._prod_email || '';
  req.session.isLoggedIn = req.session.isLoggedIn || req.cookies._prod_isLoggedIn || 'false';
  req.session._prodSID = req.session._prodSID || req.cookies._prod_sessionId || '';
  req.session._prodToken = req.session._prodToken || req.cookies._prod_token || '';
  next();
});

app.use((req, res, next) => {
  // console.log(req.session.user);
  if (!req.session.name) {
    return next();
  }

  else {
    let opt1 = selectFunction(
      "",
      "select * from account_info where email = '"
        .concat(`${req.session.name}`)
        .concat("' limit 10 offset 0")
    );

    request(opt1, async (error, response) => {
      if (error) throw new Error(error);
      else {
        let x = JSON.parse(response.body);
        // console.log(x);

        if (x.length >= 1) {
          req.user = x[0];
          res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
          return next();
        }

        else {
          console.log("error");
        }
      }
    })
  }
})

app.use(authRoute);

app.use(userRoute);

app.use('*', (req, res, next) => {
  return res.redirect("/login");
});

app.listen(4000, () => {
  console.log("Listening to localhost PORT 4000...");
})