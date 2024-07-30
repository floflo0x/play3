const express = require('express');

const { body, validationResult } = require("express-validator");

const request = require("request");

const crypto = require("crypto");

const router = express.Router();

const baseUrl2 = "https://mateys.xyz/cryptoAPI/";

let selectFunction = (item1) => {
  let options = {
    method: "POST",
    url: "https://mateys.xyz/app/api/connection/crypto_api/query.php",
    formData: {
      q1: item1,
      q2: '',
    },
  };
  return options;
};

let loginFunction = (items) => {
  let options = {
    method: "POST",
    url: baseUrl2 + "login.php",
    formData: {
      email: items[0],
      password: items[1]
    },
  };
  return options;
};

let registerFunction = (items) => {
  let options = {
    'method': 'POST',
  	'url': baseUrl2 + 'register.php',
	  'headers': {
	  },
	  formData: {
	    'email': items[0],
	    'password': items[1],
	    'country': items[2],
	    'phone': items[3],
	    'invCode': items[4],
	    'remToken': items[5]
	  }
  };
  return options;
};

let insertFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: "https://mateys.xyz/app/api/connection/crypto_api/insert.php",
    formData: {
      insert_query: item,
      select_query: item2,
    },
  };
  return options;
};

router.get("/login", async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		return res.render("login", {
			title: "Login",
			errorMessage: message,
			oldInput: {
				email: '',
				password: ''
			}
		})
	}

	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.post("/login",
  	[
	    body("email")
	      .trim()
	      .notEmpty()
	      .withMessage("Email Address required")
	      .normalizeEmail()
	      .isEmail()
	      .withMessage("Invalid email or password"),
	    body("password")
	      .trim()
	      .notEmpty()
	      .withMessage("Password required")
	      .isLength({ min: 8 })
	      .withMessage("Password must be 8 characters long")
	      .matches(/(?=.*?[A-Z])/)
	      .withMessage("Password must have at least one Uppercase")
	      .matches(/(?=.*?[a-z])/)
	      .withMessage("Password must have at least one Lowercase")
	      .matches(/(?=.*?[0-9])/)
	      .withMessage("Password must have at least one Number")
	      .matches(/(?=.*?[#?!@$%^&*-])/)
	      .withMessage("Password must have at least one special character")
	      .not()
	      .matches(/^$|\s+/)
	      .withMessage("White space not allowed"),
  	],
  	async (req, res, next) => {
  		try {
    		const { email, password, } = req.body;

    		// console.log(req.body);

    		const error = validationResult(req);

        if (!error.isEmpty()) {
					// console.log(error.array());
					let msg1 = error.array()[0].msg;
					// console.log(msg1);

					return res.render("login", {
						title: "Login",
						errorMessage: msg1,
						oldInput: {
							email: email,
							password: ''
						}
					})
				}

				else {
					let opt1 = loginFunction([email, password]);

					request(opt1, async function (error, response) {
					  if (error) throw new Error(error);
					  else {
					  	// console.log(response.body);

					  	let x = JSON.parse(response.body);

					  	// console.log(x);

					  	if (x.isSuccess == true) {
								let values2 = `\'${email}\', \'true\', \'en\'`;

								let opt3 = insertFunction(
									"insert into hSession (email, isLoggedIn, lang) values ("
									.concat(`${values2}`)
									.concat(")"),
									"select * from hSession where email = '"
									.concat(`${email}`)
									.concat("' limit 10 offset 0")
								);

								request(opt3, (error, response) => {
									if (error) throw new Error(error);
									else {
										let z = JSON.parse(response.body);

										res.cookie("_prod_email", email, { 
                      secure: true, 
                      sameSite: "none", 
                      httpOnly: true 
                    });
		                res.cookie("_prod_isLoggedIn", true, { 
                      secure: true, 
                      sameSite: "none", 
                      httpOnly: true 
                    });

                    const sessionId = crypto.randomUUID();
                    // req.session.sessionId = sessionId;
                    res.cookie("_prod_sessionId", sessionId, { 
                      secure: true, 
                      sameSite: "none", 
                      httpOnly: true 
                    });
                    const csrfToken = crypto.randomUUID();
                    // req.session.prodToken = csrfToken;
                    res.cookie("_prod_token", csrfToken, { 
                      secure: true, 
                      sameSite: "none", 
                      httpOnly: true 
                    });
							  		// req.session.name = email;
							  		// req.session.isLoggedIn = true;
		                req.session.save(err => {
		                	if (!err) {
		                		let opt4 = selectFunction(
		                			"update account_info set remember_token = '"
		                				.concat(`${csrfToken}`)
		                				.concat("' where email = '")
		                				.concat(`${email}`)
		                				.concat("'")
		                		);

		                		request(opt4, (error, response) => {
													if (error) throw new Error(error);
													else {
														return res.redirect("/user/home");
													}
												})
		                	}
		                	else {
                        console.error('Session save error:', err);
                        return res.redirect("/login");
                      }
		                });
									}
								})
					  	}

					  	else {
								req.flash('error', "Invalid email or password...");
					  		return res.redirect("/login");
					  	}
					  }
					});
				}
  		}

  		catch(error) {
  			console.log(error);
  			return res.redirect("/");
  		}
	}
)

router.get("/register", async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		return res.render("register", {
			title: "Register",
			errorMessage: message,
			oldInput: {
				email: '',
				password: '',
				cPassword: '',
				country: '',
				phone: '',
				invCode: ''
			}
		})
	}

	catch(error) {
		console.log(error);
		return res.redirect("/register");
	}
})

router.post("/register",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email"),
    body('phone').trim().isNumeric().withMessage('Invalid phone number'),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .isLength({ min: 8 })
      .withMessage("Password must be 8 characters long")
      .matches(/(?=.*?[A-Z])/)
      .withMessage("At least one Uppercase")
      .matches(/(?=.*?[a-z])/)
      .withMessage("At least one Lowercase")
      .matches(/(?=.*?[0-9])/)
      .withMessage("At least one Number")
      .matches(/(?=.*?[#?!@$%^&*-])/)
      .withMessage("At least one special character")
      .not()
      .matches(/^$|\s+/)
      .withMessage("White space not allowed"),
    body("cPassword")
      .notEmpty()
      .withMessage("Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
    body('invCode').trim().isNumeric().withMessage('invCode must be a number')
  ],
  async (req, res, next) => {
		try {
	    	const { country, email, phone, password, cPassword, invCode } = req.body;

	    	// console.log(req.body);

	    	// console.log(remToken);

	    	const error = validationResult(req);

	      if (!error.isEmpty()) {
					// console.log(error.array());
					let msg1 = error.array()[0].msg;

					return res.render("register", {
						title: "Register",
						errorMessage: msg1,
						oldInput: {
							email: email,
							password: '',
							cPassword: '',
							country: country,
							phone: phone,
							invCode: invCode
						}
					})
				}

				else {
					let opt1 = registerFunction([email, password, country, phone, invCode, 'aaa']);

					request(opt1, function (error, response) {
					  if (error) throw new Error(error);
					  else {
					  	// console.log(response.body);

					  	let x = JSON.parse(response.body);

					  	// console.log(x);

					  	if (x.isSuccess == true) {
					  		let values2 = `\'${email}\', \'true\', \'en\'`;

					  		let opt3 = insertFunction(
									"insert into hSession (email, isLoggedIn, lang) values ("
									.concat(`${values2}`)
									.concat(")"),
									"select * from hSession where email = '"
									.concat(`${email}`)
									.concat("'")
								);

								request(opt3, (error, response) => {
									if (error) throw new Error(error);
									else {
										let z = JSON.parse(response.body);

							  		// req.session.name = email;
							  		// req.session.isLoggedIn = true;

							  		res.cookie("_prod_email", email, { 
                      secure: true, 
                      sameSite: "none", 
                      httpOnly: true 
                    });
		                res.cookie("_prod_isLoggedIn", true, { 
                      secure: true, 
                      sameSite: "none", 
                      httpOnly: true 
                    });

                    const sessionId = crypto.randomUUID();
                    // req.session.sessionId = sessionId;
                    res.cookie("_prod_sessionId", sessionId, { 
                      secure: true, 
                      sameSite: "none", 
                      httpOnly: true 
                    });
                    const csrfToken = crypto.randomUUID();
                    // req.session.prodToken = csrfToken;
                    res.cookie("_prod_token", csrfToken, { 
                      secure: true, 
                      sameSite: "none", 
                      httpOnly: true 
                    });

										req.session.save(err => {
		                	if (!err) {
		                		let opt4 = selectFunction(
		                			"update account_info set remember_token = '"
		                				.concat(`${csrfToken}`)
		                				.concat("' where email = '")
		                				.concat(`${email}`)
		                				.concat("'")
		                		);

		                		request(opt4, (error, response) => {
													if (error) throw new Error(error);
													else {
														return res.redirect("/user/home");
													}
												})
		                	}
		                	else {
                        console.error('Session save error:', err);
                        return res.redirect("/register");
                      }
		                });
									}
								})
					  	}

					  	else {
								req.flash('error', x.error);
					  		return res.redirect("/register");
					  	}
					  }
					});
				}
		}

		catch(error) {
			console.log(error);
			return res.redirect("/register");
		}
	}
)

router.get("/logout", async (req, res, next) => {
  req.session.destroy((err) => {
    // console.log(err);
    res.clearCookie('_prod_isLoggedIn');
    res.clearCookie("_prod_email");
    res.clearCookie("_prod_sessionId");
    res.clearCookie("_prod_token");
    return res.redirect("/");
  });
});

module.exports = router;