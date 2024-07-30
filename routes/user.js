const express = require('express');

const path = require("path");

const request = require("request");

const { body, validationResult } = require("express-validator");

const crypto = require('crypto');

const QRCode = require('qrcode');

const router = express.Router();

const isAuth = require("../middleware/is_auth");

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

let updateFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: "https://mateys.xyz/app/api/connection/crypto_api/update.php",
    formData: {
      update_query: item,
      select_query: item2,
    },
  };
  return options;
};

let updateRefer = () => {
  // const email = req.session.name;
  let email = "e@gmail.com";
  // console.log(email);
  
  let opt18 = updateFunction(
    "update referrals set status = 'paid' where email = '"
      .concat(`${email}`)
      .concat("'"),
    "select * from referrals where email = '"
      .concat(`${email}`)
      .concat("' limit 10 offset 0")
  );

  request(opt18, (error, response) => {
    if (error) throw new Error(error);
    else {
      let r6 = JSON.parse(response.body);
      // console.log(r6);
    }
  });
}

let updateBalance = (depositedAmount, percentage, email) => {
  let opt17 = selectFunction(
  	"",
    "select main_balance from account_info where email = '"
      .concat(`${email}`)
      .concat("' limit 10 offset 0")
  );

  request(opt17, (error, response) => {
    if (error) throw new Error(error);
    else {
      let r5 = JSON.parse(response.body);
      let referAmt = (parseFloat(depositedAmount) * parseFloat(percentage)) / 100;
      // console.log(referAmt);
      let mb = parseFloat(r5[0].main_balance);
      mb += referAmt;
      // console.log(mb);

      let opt5 = updateFunction(
        "update account_info set main_balance = '"
            .concat(`${mb}`)
            .concat("' where email = '")
            .concat(`${email}`)
            .concat("'"),
        "select * from account_info where email = '"
            .concat(`${email}`)
            .concat("' limit 10 offset 0")
      );
    
      request(opt5, (error, response) => {
        if (error) throw new Error(error);
        else {
          let r3 = JSON.parse(response.body);
          // console.log(r3);

          for (let i = 0; i < r3.length; i++) {
            if (r3[i] == null) continue;
            if (percentage == '10') {
              // console.log('first');
              referred(email, '3', 'false', depositedAmount);
            }
            else if (percentage == '3') {
              // console.log('second');
              referred(email, '2', 'false', depositedAmount);
            }
            else {
              // console.log('update');
              updateRefer();
            }
          }
        }
      })
    }
  })
}

let referred = (email, percentage, checkStatus, depositedAmount) => {
  let opt16 = selectFunction(
  	"",
    "select * from referrals where referred_user = '"
      .concat(`${email}`)
      .concat("' limit 10 offset 0")
  );

  request(opt16, (error, response) => {
    if (error) throw new Error(error);
    else {
      let r4 = JSON.parse(response.body);
      // console.log(r4);

      for (let i = 0; i < r4.length; i++) {
        if (r4[i] == null) continue;
        if (r4[i].isReferredUserValid == 'true') {
          if (checkStatus) {
            let ownerI = r4[i].owner;
            // console.log(ownerI);
            if (r4[i].status == 'unpaid') {
              updateBalance(depositedAmount, percentage, ownerI);
            }
          }
          else {
            updateBalance(depositedAmount, percentage, ownerI);
          }
        }
      }
    }
  });
}

router.get("/", async (req, res, next) => {
	try {
		// return res.render("landing", {
		// 	title: "Welcome"
		// })
		res.sendFile(path.join(__dirname, '../views/bitcypo-html/index.html'));
	}

	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/about", async (req, res, next) => {
	try {
		res.sendFile(path.join(__dirname, '../views/bitcypo-html/about.html'));
	}

	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/services", async (req, res, next) => {
	try {
		res.sendFile(path.join(__dirname, '../views/bitcypo-html/services.html'));
	}

	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/testimonial", async (req, res, next) => {
	try {
		res.sendFile(path.join(__dirname, '../views/bitcypo-html/testimonial.html'));
	}

	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/works", async (req, res, next) => {
	try {
		res.sendFile(path.join(__dirname, '../views/bitcypo-html/works.html'));
	}

	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/contact", async (req, res, next) => {
	try {
		res.sendFile(path.join(__dirname, '../views/bitcypo-html/contact.html'));
	}

	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/user/home", isAuth, async (req, res, next) => {
	let email = (req.user !== undefined ? req.user?.email : '');
	// let email = "e@gmail.com";

	// console.log(req.session._prodToken, req.user?.remember_token, req.session._prodToken === req.user?.remember_token)

  async function processDeposits(email, mb, k) {
		try {
		    if (k && k.length > 0) {
		      for (let deposit of k) {
		        if (deposit.status === "confirmed") {
		          let id = deposit.id;
		          let amount = parseFloat(deposit.amount);
		          mb += amount;

		          // Perform asynchronous operations
		          await referred(email, '10', 'true', String(amount));

		          let query1 = `update deposits set status = 'added' where id = '${id}'`;

		          let opt1 = await new Promise((resolve, reject) => {
						    request(selectFunction(query1, ""), function (error, response) {
						        if (error) {
						          reject(error); // Reject the promise if there's an error
						        } else {
						          resolve(response); // Resolve with the response object
						        }
						    });
						  });

		          let query2 = `update account_info set main_balance = '${mb}' where email = '${email}'`;

		          let opt2 = await new Promise((resolve, reject) => {
						    request(selectFunction(query2, ""), function (error, response) {
						        if (error) {
						          reject(error); // Reject the promise if there's an error
						        } else {
						          resolve(response); // Resolve with the response object
						        }
						    });
						  });

		          // let r3 = JSON.parse(response5.body);
		          // console.log(r3);
		        }
		      }
		    }
		} 
		catch (error) {
		    console.log('Error processing deposits:', error);
		    throw new Error('Error processing deposits');
		    // Handle error appropriately, e.g., log, retry, show user-friendly message
		}
	}

	async function fetchData(email) {
		try {
		    // Construct the SQL query string
		    let query = `select * from account_info where email = '${email}' limit 10 offset 0`;
		    
		    // Execute the request asynchronously
		    let options = await new Promise((resolve, reject) => {
		      request(selectFunction("", query), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });
		    
		    // Parse the response body
		    let x = JSON.parse(options.body);
		    // console.log(x);

		    let query2 = `select * from levels where level_status = 'active' limit 10 offset 0`;
		    
		    // Execute the request asynchronously
		    let opt1 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query2), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });
		    
		    // Parse the response body
		    let y = JSON.parse(opt1.body);
		    // console.log(y);

		    let query3 = `select * from machine_profit where email = '${email}' limit 10 offset 0`;

		    let opt2 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query3), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    })

		    let z = JSON.parse(opt2.body);
		    let st = z[0].status;
		    let cl = z[0].current_level;
		    let co = z[0].date;
		    let mb = parseFloat(x["0"].main_balance);

		    let today = new Date();
        today = today.getDate() + "-" + String(today.getMonth()+1) + "-" + today.getFullYear();

		    // Further processing or logging
		    // console.log("Account Info:", x);
		    // console.log("Levels:", y);
		    // console.log("Machine Profit:", z);

		    let query4 = `select * from deposits where email = '${email}' limit 10 offset 0`;

		    let opt3 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query4), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    })

            let k = JSON.parse(opt3.body);

            // console.log(k, today, k != '');

            // if (k != '') {
            // 	await processDeposits(email, mb, k);
            // }

            let query5 = `select * from product_earnings where email = '${email}' limit 10 offset 0`;

            let opt4 = await new Promise((resolve, reject) => {
				      request(selectFunction("", query5), function (error, response) {
				        if (error) {
				          reject(error); // Reject the promise if there's an error
				        } else {
				          resolve(response); // Resolve with the response object
				        }
				      });
				    }) 

		    		let k1 = JSON.parse(opt4.body);
            // console.log(k1); 

            if (k1 != '') {
            	let pi = parseFloat(x[0].product_income); 
                let ti = parseFloat(x[0].today_income);
                let tti = parseFloat(x[0].total_income); 
                let mb = parseFloat(x[0].main_balance);

                for (let i = 1; i < k1.length; i++) {
                    // console.log(k1[i]);
                    let kSplit = k1[i].expire_date.split('/');
                    let kDate = `'${kSplit[2]}-${kSplit[1]}-${kSplit[0]}'`;
                    let kExpired = new Date(kDate).getTime();
                    let kToday = new Date().getTime();

                    if (
                        k1[i].product_id !== "null" &&
                        k1[i].status == "active" &&
                        k1[i].collected_on !== today &&
                        kExpired >= kToday
                    ) {
                        let interest = parseFloat(k1[i].min_invest) / 100 *
                            (parseFloat(k1[i].daily_rate));

                        pi += interest;
                        ti += interest;
                        tti += interest;
                        mb += interest;

                        let pid = k1[i]._id;

                        let query7 = `update product_earnings set collected_on = '${today}' where _id = '${pid}'`;

                        let opt7 = await new Promise((resolve, reject) => {
					      request(selectFunction(query7, ""), function (error, response) {
					        if (error) {
					          reject(error); // Reject the promise if there's an error
					        } else {
					          resolve(response); // Resolve with the response object
					        }
					      });
					    })

					    let query8 = `update account_info set main_balance = '${mb}', 
					    			product_income = '${pi}', total_income = '${tti}'
					    			, today_income = '${ti}', income_date = '${today}' 
					    			where email = '${email}'`;

					    let opt8 = await new Promise((resolve, reject) => {
					      request(selectFunction(query8, ""), function (error, response) {
					        if (error) {
					          reject(error); // Reject the promise if there's an error
					        } else {
					          resolve(response); // Resolve with the response object
					        }
					      });
					    })
                                        
                    }

                    else if (kExpired <= kToday) {
                        let pid2 = k1[i]._id;

                        let query6 = `update product_earnings set status = 'expired' where _id = '${pid2}'`;

                        let opt6 = await new Promise((resolve, reject) => {
					      request(selectFunction("", query6), function (error, response) {
					        if (error) {
					          reject(error); // Reject the promise if there's an error
					        } else {
					          resolve(response); // Resolve with the response object
					        }
					      });
					    })
                    }

                    else {
                    	break;
                    }
                }
            }

            let query9 = `select date from machine_profit where email = '${email}'`;

            let opt9 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query9), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    })

		    let k3 = JSON.parse(opt9.body);
            // console.log(k3[0].date, today, k3[0].date !== today);

            let query11 = `select * from settings limit 10 offset 0`;

            let opt11 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query11), function (error, response) {
			        if (error) {
			          reject(error); // Reject the promise if there's an error
			        } else {
			          resolve(response); // Resolve with the response object
			        }
			    });
			})

            if(k3[0].date !== today) {
            	let query10 = `update machine_profit set status = 'available' where email = '${email}'`;

            	let opt10 = await new Promise((resolve, reject) => {
			      request(selectFunction(query10, ""), function (error, response) {
			        if (error) {
			          reject(error); // Reject the promise if there's an error
			        } else {
			          resolve(response); // Resolve with the response object
			        }
			      });
			    })
            }

           	return {
			 	data: z[0],
                st: st,
                cl: cl,
                data2: x[0],
                vipData: y,
                today: today,
                date: co,
                kty: ''
			}

		    // Further processing with x
		} 
		catch (error) {
		    console.log('Error fetching account info:', error);
		    // Handle error appropriately, e.g., log, retry, show user-friendly message
		}
	}

	if (req.session._prodToken === req.user?.remember_token) {
		// Call fetchData with an email address
		fetchData(email)
		  .then(response => {
		  	// Handle success

		    // console.log(response);

				return res.render("home", {
	            title: "Home",
	            data: response.data,
	            st: response.st,
	            cl: response.cl,
	            data2: response.data2,
	            vipData: response.vipData,
	            today: response.today,
	            date: response.date,
	            kty: ''
	      });
		  })
		  .catch(error => {
		    console.log('Error:', error); // Handle error
		    return res.redirect("/user/home");
		  });
	}
	else {
		return res.redirect("/login");
	}
})

router.get("/user/collectReward", isAuth, async (req, res, next) => {
  const email = (req.user !== undefined ? req.user?.email : '');
	// let email = "e@gmail.com";

  async function fetchData(email) {
		try {
		    // Construct the SQL query string
		    let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;
		    
		    // Execute the request asynchronously
		    let opt1 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query1), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });
		    
		    // Parse the response body
		    let x = JSON.parse(opt1.body);

		    // console.log(x);

		    let mb = parseFloat(x["0"].main_balance);
		    let total_income = parseFloat(x["0"].total_income);
		    let today_income = parseFloat(x["0"].today_income);
		    let income_date = x["0"].income_date;

		    let today = new Date();

      		today = today.getDate() + "-" + String(today.getMonth()+1) + "-" + today.getFullYear();

      		let ttt = new Date();

      		let getTime = ttt.getHours() + ":" + ttt.getMinutes() + ":" + ttt.getSeconds();

      		let query2 = `select * from machine_profit where email = '${email}' limit 10 offset 0`;

      		let opt2 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query2), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });

		    let y = JSON.parse(opt2.body);
	          // console.log(y);
	          // console.log("------------------------");

	        let machine_profit = parseFloat(y[0].machine_profit);
	        mb += machine_profit;
	        total_income += machine_profit;
	        //   Changed now
	        if (income_date == today) {
	          today_income += machine_profit;
	        }
	        else {
	          today_income += machine_profit;
	        }

	        // console.log(mb, machine_profit, total_income, today_income);

          	let te = parseFloat(y[0].total_earnings);
          	let crr_level = x[0].current_level;

          	let query3 = `update account_info set main_balance = '${mb}', 
          			total_income = '${total_income}', today_income = '${today_income}',
          			income_date = '${today}' where email = '${email}'`;

          	let opt3 = await new Promise((resolve, reject) => {
		      request(selectFunction(query3, ""), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });

            let query4 = `select level_income from levels where level_name = '${crr_level}' limit 10 offset 0`;

            let opt4 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query4), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });

		    let k = JSON.parse(opt4.body);
            let level_income = parseFloat(k[0].level_income);
            te += level_income;

            // console.log(k, level_income, te);

            let query5 = `update machine_profit set date = '${today}', time = '${getTime}',
            		total_earnings = '${te}', status = 'collected' where email = '${email}'`;

            // console.log(query5);

            let opt5 = await new Promise((resolve, reject) => {
		      request(updateFunction(query5, ""), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });

		    return res.redirect("/user/home");
		}
		catch (error) {
		    console.log('Error fetching account info:', error);
		    // Handle error appropriately, e.g., log, retry, show user-friendly message
		}
  }

  if (req.session._prodToken === req.user?.remember_token) {
  	fetchData(email);
  }
  else {
		return res.redirect("/login");
	}
})

router.get("/user/finance", isAuth, async (req, res, next) => {
	const email = (req.user !== undefined ? req.user?.email : '');

	// let email = "e@gmail.com";

	async function fetchData(email) {
		try {
			let query1 = "select * from products limit 10 offset 0";

			// Execute the request asynchronously
		    let opt1 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query1), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });
		    
		    // Parse the response body
		    let x = JSON.parse(opt1.body);

		    let query2 = `select * from account_info where email = '${email}' limit 10 offset 0`;

		    let opt2 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query2), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });

		    let y = JSON.parse(opt2.body);

		    let query3 = `select * from product_earnings where email = '${email}' limit 10 offset 0`;

		    let opt3 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query3), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });

		    let z = JSON.parse(opt3.body);

		    if (z != '') {
		    	for(let i = 0; i < z.length; i++) {
		    		if (z[i] == null) continue;
		    		else if (z[i].status == 'active') {
			    		return {
			    			x: x,
			    			y1: y[0],
			    			z1: z
			    		}
			    	}
		    	}
		    }

		    else {
		    	return {
			    	x: x,
			    	y1: y[0],
			    	z1: []
			   	}
		    }

		}
		catch (error) {
		    console.log('Error fetching account info:', error);
		    // Handle error appropriately, e.g., log, retry, show user-friendly message
		}
	}

	fetchData(email)
		.then(response => {
			// console.log(response);

			const data1 = response.x.filter(item => response.z1.some(xItem => xItem.product_id === item.p_id)).map(i => {
				return {
					id: i.p_id,
					img: i.image_url
				}
			});

			// console.log(data1);

			return res.render("finance", {
        title: "Finance",
        x: response.x,
        y1: response.y1,
        z1: response.z1,
        imgUrl: data1
      });
		})
		.catch(error => {
		    console.log('Error:', error); // Handle error
		    return res.redirect("/user/finance");
		});
})

router.get("/user/financial/:id", isAuth, async (req, res, next) => {
	const { id } = req.params;

	const email = (req.user !== undefined ? req.user?.email : '');

	// let email = "e@gmail.com";

	async function fetchData(email) {
		try {
	  		let query1 = `select * from products where p_id = '${id}' limit 10 offset 0`;

	  		// Execute the request asynchronously
		    let opt1 = await new Promise((resolve, reject) => {
		      request(selectFunction("", query1), function (error, response) {
		        if (error) {
		          reject(error); // Reject the promise if there's an error
		        } else {
		          resolve(response); // Resolve with the response object
		        }
		      });
		    });
		    
		    // Parse the response body
		    let x = JSON.parse(opt1.body);

		    if (x.length >= 1) {
			    let duration = parseFloat(x[0].duration);
	        let date = new Date();
	        Date.prototype.addDays = function (days) {
	          date = new Date(this.valueOf());
	          date.setDate(date.getDate() + days);
	          return date;
	        };

	        const newDate = date.addDays(duration);

	        let newDate2 = String(newDate.getMonth()+1) + "/" + newDate.getDate() + "/" + newDate.getFullYear();

	        let today = new Date();

	        today = String(today.getMonth()+1) + "/" + today.getDate() + "/" + today.getFullYear();

	        let f = parseFloat(x[0].daily_rate) * parseFloat(x[0].duration);

	        let query2 = `select * from product_earnings where email = '${email}' limit 10 offset 0`;

	        let opt2 = await new Promise((resolve, reject) => {
			      request(selectFunction("", query2), function (error, response) {
			        if (error) {
			          reject(error); // Reject the promise if there's an error
			        } else {
			          resolve(response); // Resolve with the response object
			        }
			      });
			    });

			    let k = JSON.parse(opt2.body);
			    // console.log(k);
	        let active = 0;
	        let set = false;

	        for (let i = 0; i < k.length; i++) {
	          if (k[i].id == id && k[i].status == "active") {
	            set = true;
	            active++;
	            break;
	          }
	        }

	        let query3 = `select * from account_info where email = '${email}' limit 10 offset 0`;

	        let opt3 = await new Promise((resolve, reject) => {
			      request(selectFunction("", query3), function (error, response) {
			        if (error) {
			          reject(error); // Reject the promise if there's an error
			        } else {
			          resolve(response); // Resolve with the response object
			        }
			      });
			    });

			    let l = JSON.parse(opt3.body);

			    return {
			    	x: x[0],
	          newDate2: newDate2,
	          newDate3: today,
	          f,
	          set,
	          active,
	          l: l[0],
			    }
			  }
			  else {
		    	throw new Error('Invalid ID...');
			  }
	  }
	  catch (error) {
			console.log('Error fetching product:', error);
			// Handle error appropriately, e.g., log, retry, show user-friendly message
		}
	}

	if (req.session._prodToken === req.user?.remember_token) {
  	fetchData(email)
	  	.then(response => {
				// console.log(response);

				return res.render("fin1", {
		      title: "Financial",
		      x: response.x,
	        newDate2: response.newDate2,
	        newDate3: response.newDate3,
	        f: response.f,
	        set: response.set,
	        active: response.active,
	        l: response.l,
		    });
			})
			.catch(error => {
			  console.log('Error:', error); // Handle error
			  return res.redirect("/user/finance");
			});
	}
	else {
		return res.redirect("/login");
	}
})

router.post("/user/confirm/:id",
	[
		body("amount")
	    .trim()
	    .notEmpty()
	    .withMessage("Amount required...")
	    .isNumeric()
	    .withMessage("Invalid Amount...")
	],
 	async (req, res, next) => {
	  const { id } = req.params;

    const { amount } = req.body;

	  const email = (req.user !== undefined ? req.user?.email : '');

		// let email = "e@gmail.com";

	  async function fetchData(email) {
	  	try {
	  		const error = validationResult(req);

	  		if (!error.isEmpty()) {
					// console.log(error.array());
					let msg1 = error.array()[0].msg;

					throw new Error(msg1);
				}

	  		let query1 = `select * from products where p_id = '${id}' limit 10 offset 0`;

	  		// Execute the request asynchronously
			  let opt1 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query1), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });
			    
			  // Parse the response body
			  let x = JSON.parse(opt1.body);

			  if (x.length >= 1) {
				  let duration = parseFloat(x[0].duration);
	        let code = Math.floor(Math.random() * (200000 - 100000) + 100000);
				  let date = new Date();
		      Date.prototype.addDays = function (days) {
		        date = new Date(this.valueOf());
		        date.setDate(date.getDate() + days);
		        return date;
		      };

		      const newDate = date.addDays(duration);

		      let newDate2 = newDate.getDate() + "/" + String(newDate.getMonth()+1) + "/" + newDate.getFullYear();

		      let today = new Date();

		     	today = today.getDate() + "/" + String(today.getMonth()+1) + "/" + today.getFullYear();

		     	let query2 = `select * from account_info where email = '${email}' limit 10 offset 0`;

		     	let opt2 = await new Promise((resolve, reject) => {
				    request(selectFunction("", query2), function (error, response) {
				      if (error) {
				        reject(error); // Reject the promise if there's an error
				      } else {
				        resolve(response); // Resolve with the response object
				      }
				    });
				  });

				  let k = JSON.parse(opt2.body);

				  let pid = x[0].p_id;
		      let title = x[0].title;
		      let dr = x[0].daily_rate;
		      let mi = amount;
		      let dur = x[0].duration;
		      let cl = k[0]["current_level"];

		      let values = `\'${code}\', '${email}\', '${cl}\', '${pid}\', '${title}\', '${dr}\', '${mi}\', '${dur}\', 'null\', '${today}\', '${newDate2}\', 'active\'`;

		      // console.log(values);

		      let query3 = `insert into product_earnings 
		      	(_id, email, current_level, product_id, product_name, daily_rate, min_invest, 
		      	duration, collected_on, bought_on, expire_date, status) 
		      	values(${values})`;

		      let opt3 = await new Promise((resolve, reject) => {
				    request(selectFunction(query3, ""), function (error, response) {
				      if (error) {
				        reject(error); // Reject the promise if there's an error
				      } else {
				        resolve(response); // Resolve with the response object
				      }
				    });
				  });

				  let accBal = parseFloat(k[0]["main_balance"]);
		      let myInv = parseFloat(k[0]["my_investment"]);
		      mi = parseFloat(mi);

		      let remBal = parseFloat(accBal - mi);
		      myInv += mi;

		      let query4 = `update account_info set main_balance = '${remBal}', my_investment = '${myInv}', income_date = '${today}' where email = '${email}'`;

		      let opt4 = await new Promise((resolve, reject) => {
				    request(selectFunction(query4, ""), function (error, response) {
				      if (error) {
				        reject(error); // Reject the promise if there's an error
				      } else {
				        resolve(response); // Resolve with the response object
				      }
				    });
				  });

		      return 1;
		    }
		    else {
		    	throw new Error("Invalid ID...");
		    }
	  	}
		  catch (error) {
				console.log('Error fetching product:', error);
				// Handle error appropriately, e.g., log, retry, show user-friendly message
			}
	  }

		if (req.session._prodToken === req.user?.remember_token) {
		  fetchData(email)
		  	.then(response => {
		  		// console.log(response);

		      return res.redirect("/user/finance");
		  	})
		  	.catch(error => {
				  console.log('Error:', error); // Handle error
				  return res.redirect("/user/finance");
				});
		}
		else {
			return res.redirect("/login");
		}	
})

router.get("/user/vip", isAuth, async (req, res, next) => {
	const email = (req.user !== undefined ? req.user?.email : '');

	// let email = "e@gmail.com";

	async function fetchData(email) {
		try {
			let query1 = `select * from levels where level_status = 'active' limit 10 offset 0`;

			// Execute the request asynchronously
		  let opt1 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query1), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  }); 

		  let x = JSON.parse(opt1.body);

		  let query2 = `select current_level from account_info where email = '${email}' limit 10 offset 0`;

		  let opt2 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query2), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  }); 

		  let y = JSON.parse(opt2.body);

      const crr_level = y[0].current_level;

      let query3 = `select * from levels where level_name = '${crr_level}' limit 10 offset 0`;

      let opt3 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query3), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  });

		  let z = JSON.parse(opt3.body);

		  return {
		  	x: x,
		  	z: z,
		  }
		}

		catch(error) {
			console.log('Error fetching vip:', error);
		}
	}

	if (req.session._prodToken === req.user?.remember_token) {
		fetchData(email)
	  	.then(response => {
	  		// console.log(response);

	      return res.render("vip", {
	        title: "VIP",
	        x1: response.x,
	        z1: response.z[0]
	      });
	  	})
	  	.catch(error => {
			  console.log('Error:', error); // Handle error
			  return res.redirect("/user/vip");
			});
	}
	else {
		return res.redirect("/login");
	}
})

router.get("/user/buyVip/:n", isAuth, async (req, res, next) => {
  const { n } = req.params;
  const email = (req.user !== undefined ? req.user?.email : '');

	// let email = "e@gmail.com";

  async function fetchData(email) {
  	try {
  		let query1 = `select * from levels where level_name = '${n}' limit 10 offset 0`;

  		// Execute the request asynchronously
		  let opt1 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query1), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  });
		    
		  // Parse the response body
		  let x = JSON.parse(opt1.body);

		  // console.log(x, x[0].level_price != 0);

		  if (x.length >= 1 && x[0].level_price != 0) {
		  	let query2 = `select * from account_info where email = '${email}' limit 10 offset 0`;

		  	let opt2 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query2), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let y = JSON.parse(opt2.body);

			  return {
			  	x: x,
			  	y: y
			  }
		  }

		  else {
		  	throw new Error("Invalid level...");
		  }
  	}

  	catch(error) {
  		console.log("Error buying vip:", error);
  	}
  }

	if (req.session._prodToken === req.user?.remember_token) {
	  fetchData(email)
	  	.then(response => {
	  		// console.log(response);

	  		return res.render("buyVip", {
	        title: "BuyVip",
	        x: response.x[0],
	        accBal: parseInt(response.y[0].main_balance),
	        price: parseInt(response.x[0].level_price)
	      });
	  	})
	  	.catch(error => {
			  console.log('Error:', error); // Handle error
			  return res.redirect("/user/vip");
			});
	}
	else {
		return res.redirect("/login");
	}
})

router.get("/user/yesConfirm/:n", isAuth, async (req, res, next) => {
  const { n } = req.params;
  const email = (req.user !== undefined ? req.user?.email : '');

  // let email = "e@gmail.com";

  async function fetchData(email) {
  	try {
  		let query1 = `select * from levels where level_name = '${n}' limit 10 offset 0`;

  		// Execute the request asynchronously
		  let opt1 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query1), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  });
		    
		  // Parse the response body
		  let x = JSON.parse(opt1.body);

		  if (x.length >= 1) {
		  	let query2 = `select * from account_info where email = '${email}' limit 10 offset 0`;

		  	let opt2 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query2), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let y = JSON.parse(opt2.body);

			  let level_price = parseFloat(x[0].level_price);
      	let lname = x[0].level_name;
      	let profit =  parseFloat(x[0].machine_profit);

      	let accBal = parseFloat(y[0].main_balance);
        let tti = parseFloat(y[0].total_income);
        let tt = parseFloat(y[0].today_income);

        // console.log(accBal, level_price, accBal -= level_price)

        if (accBal >= level_price) {
          accBal -= level_price;
        }

        else {
        	throw new Error("Invalid level...");
        }

        accBal += profit;
        tti += profit;
        tt += profit;

        let query3 = `update account_info set main_balance = '${accBal}', total_income = '${tti}', 
        	today_income = '${tt}', current_level = '${lname}' where email = '${email}'`;

        let opt3 = await new Promise((resolve, reject) => {
			    request(selectFunction(query3, ""), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let query4 = `update machine_profit set current_level = '${lname}', 
			  	machine_profit = '${profit}' where email = '${email}'`;

			  let opt4 = await new Promise((resolve, reject) => {
			    request(selectFunction(query4, ""), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let query5 = `update product_earnings set current_level = '${lname}' where email = '${email}'`;

			  let opt5 = await new Promise((resolve, reject) => {
			    request(selectFunction(query5, ""), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  return 1;
		  }

		  else {
		  	throw new Error("Invalid level...");
		  }
  	}

  	catch(error) {
  		console.log("Error buying vip:", error);
  	}
  }

	if (req.session._prodToken === req.user?.remember_token) {
	  fetchData(email)
	  	.then(response => {
	  		// console.log(response);

	  		return res.redirect("/user/vip");
	  	})
	  	.catch(error => {
			  console.log('Error:', error); // Handle error
			  return res.redirect("/user/vip");
			});
	}
	else {
		return res.redirect("/login");
	}
})

router.get("/user/team", isAuth, async (req, res, next) => {
  const email = (req.user !== undefined ? req.user?.email : '');

  // let email = "e@gmail.com";

  async function fetchData(email) {
  	try {
  		let query1 = `select invitation_code from account_info where email = '${email}' limit 10 offset 0`;

  		// Execute the request asynchronously
		  let opt1 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query1), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  });
		    
		  // Parse the response body
		  let x = JSON.parse(opt1.body);

		  if (x.length >= 1) {
		  	let query2 = `select * from settings`;

		  	let opt2 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query2), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let k4 = JSON.parse(opt2.body);

			  // console.log(x[0], k4[0]);

			  return {
			  	x: x[0],
			  	k4: k4[0]
			  }
		  }

		  else {
		  	throw new Error("Invalid email...");
		  }
  	}

  	catch(error) {
  		console.log("Error fetching data:", error);
  	}
  }

	if (req.session._prodToken === req.user?.remember_token) {
	  fetchData(email)
	  	.then(response => {
	  		// console.log(response);

	  		return res.render("team", 
	  			{ 
	  				title: "Team", 
	  				x: response.x, 
	  				k4: response.k4
	  			}
	  		);
	  	})
	  	.catch(error => {
	  		console.log(error);
	  		return res.redirect("/user/team");
	  	})
  }
	else {
		return res.redirect("/login");
	}
})

router.get("/user/account", isAuth, async (req, res, next) => {
  const email = (req.user !== undefined ? req.user?.email : '');
  // let email = "e@gmail.com";

  async function fetchData(email) {
  	try {
  		let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

  		// Execute the request asynchronously
		  let opt1 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query1), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  });
		    
		  // Parse the response body
		  let x = JSON.parse(opt1.body);

		  if (x.length >= 1) {
		  	let today = new Date();

	     	today = today.getDate() + "/" + String(today.getMonth()+1) + "/" + today.getFullYear();

      	let income_date = x[0].income_date;

      	let query2 = "select * from settings limit 10 offset 0";

      	let opt2 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query2), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let y = JSON.parse(opt2.body);

			  return {
			  	x1: x[0],
			  	k4: y[0],
			  	today: today,
			  	income_date: income_date
			  }
		  }

		  else {
		  	throw new Error("Invalid email...");
		  }
  	}

  	catch(error) {
  		console.log("Error fetching account info:", error);
  	}
  }

	if (req.session._prodToken === req.user?.remember_token) {
	  fetchData(email)
	  	.then(response => {
	  		// console.log(response);

	  		res.render("account", {
	        title: "Account",
	        x1: response.x1,
	        today: response.today,
	        income_date: response.income_date,
	        k4: response.k4
	      });
	  	})
	  	.catch(error => {
	  		console.log(error);
	  		return res.redirect("/user/account");
	  	})
	}
	else {
		return res.redirect("/login");
	}
})

router.get("/user/settings", isAuth, async (req, res, next) => {
  const email = (req.user !== undefined ? req.user?.email : '');
  // let email = "e@gmail.com";

  async function fetchData(email) {
  	try {
  		let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

  		// Execute the request asynchronously
		  let opt1 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query1), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  });
		    
		  // Parse the response body
		  let x = JSON.parse(opt1.body);

		  if (x.length >= 1) {
		  	return {
		  		x: x[0]
		  	}
		  }

		  else {
		  	throw new Error("Invalid email...");
		  }
  	}

  	catch(error) {
  		console.log("Error fetching data:", error);
  	}
  }

	if (req.session._prodToken === req.user?.remember_token) {
	  fetchData(email)
	  	.then(response => {
	  		// console.log(response);

	      return res.render('setting', 
	      	{ 
	      		title: 'Settings', 
	      		x: response.x 
	      	}
	      );
	  	})
	  	.catch(error => {
	  		console.log(error);
	  		return res.redirect("/user/settings");
	  	})
  }
	else {
		return res.redirect("/login");
	}
})

router.get("/user/withdrawal", isAuth, async (req, res, next) => {
  const email = (req.user !== undefined ? req.user?.email : '');

  // let email = "e@gmail.com";

  let message = req.flash('error');
	// console.log(message);

	if (message.length > 0) {
		message = message[0];
	}
	else {
		message = null;
	}

  async function fetchData(email) {
  	try {
  		let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

  		// Execute the request asynchronously
		  let opt1 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query1), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  });
		    
		  // Parse the response body
		  let x = JSON.parse(opt1.body);

		  if (x.length >= 1) {
        let current_level = x[0]["current_level"];

        let query2 = `select withdrawal_amount from levels where level_name = '${current_level}' limit 10 offset 0`;

        let opt2 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query2), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let y = JSON.parse(opt2.body);

			  let accBBB = x[0]["main_balance"];
        let wAmt = y[0]["withdrawal_amount"];

        let query3 = `select * from withdrawals where email = '${email}' limit 10 offset 0`;

        let opt3 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query3), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let z = JSON.parse(opt3.body);

			  return {
			  	accBBB,
			  	wAmt,
			  	z
			  }
		  }

		  else {
		  	throw new Error("Invalid email...");
		  }
  	}

  	catch(error) {
  		// console.log("Error fetching data:", error);
  		throw new Error(error);
  	}
  }

	if (req.session._prodToken === req.user?.remember_token) {
	  fetchData(email)
	  	.then(response => {
	  		// console.log(response);

	  		return res.render("withdraw", {
	        title: "Withdraw",
	        accBBB: response.accBBB,
	        wAmt: response.wAmt,
	        z: response.z,
	        errorMessage: message,
					oldInput: {
						amount: '',
						mode: '',
						address: ''
					}
	      });
	  	})
	  	.catch(error => {
	  		console.log(error);
	  		return res.redirect("/user/withdrawal");
	  	})
	}
	else {
		return res.redirect("/login");
	}
})

router.get("/user/recharge", isAuth, async (req, res, next) => {
  const email = (req.user !== undefined ? req.user?.email : '');

  // let email = "e@gmail.com";

  async function fetchData(email) {
  	try {
  		let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

  		// Execute the request asynchronously
		  let opt1 = await new Promise((resolve, reject) => {
		    request(selectFunction("", query1), function (error, response) {
		      if (error) {
		        reject(error); // Reject the promise if there's an error
		      } else {
		        resolve(response); // Resolve with the response object
		      }
		    });
		  });
		    
		  // Parse the response body
		  let x = JSON.parse(opt1.body);

		  if (x.length >= 1) {
		  	let query2 = `select * from deposits where email = '${email}' limit 10 offset 0`;

			  let opt2 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query2), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let z = JSON.parse(opt2.body);

		  	let query3 = `select * from settings limit 10 offset 0`;

		  	let opt3 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query3), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });

			  let y = JSON.parse(opt3.body);

        return {
					x: z,
					y: y
				}
		  }

		  else {
		  	throw new Error("Invalid email...");
		  }
  	}

  	catch(error) {
  		// console.log("Error fetching data: ", error);
  		throw new Error(error);
  	}
  }

	if (req.session._prodToken === req.user?.remember_token) {
	  fetchData(email)
	  	.then(response => {

	  		// console.log(response);

	      return res.render("recharge", 
	      	{ 
	      		title: "Recharge", 
	      		y: response.y, 
	      		x: response.x
	      	}
	      );
	  	})
	  	.catch(error => {
	  		console.log(error);
	  		return res.redirect("/user/recharge");
	  	})
  }
	else {
		return res.redirect("/login");
	}
})

router.post("/user/withdrawal",
	[
		body("amount")
	    .trim()
	    .notEmpty()
	    .withMessage("Amount required...")
	    .isNumeric()
	    .withMessage("Invalid Amount..."),
	  body('mode')
	   	.trim()
	   	.notEmpty()
	   	.withMessage("Payment mode required...")
	   	.isIn(['USDT(TRC20)', 'BTC'])
    	.withMessage('Invalid Payment Mode'),
    body('address')
    	.trim()
    	.notEmpty()
    	.withMessage("Payment address required...")
	],
  async (req, res, next) => {
    const { amount, mode, address } = req.body;

    // console.log(req.body);

    // const email = req.session.name;

  	let email = (req.user !== undefined ? req.user?.email : '');

  	async function fetchData1(email) {
	  	try {
	  		let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

	  		// Execute the request asynchronously
			  let opt1 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query1), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });
			    
			  // Parse the response body
			  let x = JSON.parse(opt1.body);

			  if (x.length >= 1) {
	        let current_level = x[0]["current_level"];

	        let query2 = `select withdrawal_amount from levels where level_name = '${current_level}' limit 10 offset 0`;

	        let opt2 = await new Promise((resolve, reject) => {
				    request(selectFunction("", query2), function (error, response) {
				      if (error) {
				        reject(error); // Reject the promise if there's an error
				      } else {
				        resolve(response); // Resolve with the response object
				      }
				    });
				  });

				  let y = JSON.parse(opt2.body);

				  let accBBB = x[0]["main_balance"];
	        let wAmt = y[0]["withdrawal_amount"];

	        let query3 = `select * from withdrawals where email = '${email}' limit 10 offset 0`;

	        let opt3 = await new Promise((resolve, reject) => {
				    request(selectFunction("", query3), function (error, response) {
				      if (error) {
				        reject(error); // Reject the promise if there's an error
				      } else {
				        resolve(response); // Resolve with the response object
				      }
				    });
				  });

				  let z = JSON.parse(opt2.body);

				  return {
				  	accBBB,
				  	wAmt,
				  	z
				  }
			  }

			  else {
			  	throw new Error("Invalid email...");
			  }
	  	}

	  	catch(error) {
	  		// console.log("Error fetching data:", error);
	  		throw new Error(error);
	  	}
	  }

	  async function fetchData(email) {
	  	try {
	  		let today = new Date();

	     	today = today.getDate() + "/" + String(today.getMonth()+1) + "/" + today.getFullYear();

	  		let Amount = parseFloat(amount);

    		let wFee = Amount * 0.03;

    		let amt = Amount - wFee;

	  		let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

	  		// Execute the request asynchronously
			  let opt1 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query1), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });
			    
			  // Parse the response body
			  let x = JSON.parse(opt1.body);

			  if (x.length >= 1) {
			  	let current_level = x[0]["current_level"];

			  	let query2 = `select withdrawal_amount from levels where level_name = '${current_level}' limit 10 offset 0`;

			  	let opt2 = await new Promise((resolve, reject) => {
				    request(selectFunction("", query2), function (error, response) {
				      if (error) {
				        reject(error); // Reject the promise if there's an error
				      } else {
				        resolve(response); // Resolve with the response object
				      }
				    });
				  });

				  let y = JSON.parse(opt2.body);

				  let wAmt = parseFloat(y[0]["withdrawal_amount"]).toFixed(2);
          let accBal = parseFloat(x[0]["main_balance"]).toFixed(2);
          let phone = x[0]["phone"];

          let values = `\'${email}\', '${phone}\', '${amt}\', 'USD\', '${mode}\', '${address}\', '${today}\', '${wFee}\', 'pending\', '${today}\'`;

          // console.log(wAmt, accBal, Amount);
          if (wAmt > Amount) {
            console.log("Invalid Amount");
            throw new Error("Invalid Amount");
          } 

          else if (accBal < Amount) {
            console.log("Insufficient Balance");
            throw new Error("Insufficient Balance");
          }

          else {
          	let query3 = `insert into withdrawals(email, phone, amount, currency, 
          		payment_method, wallet_address, date, withdrawal_fee, status, 
          		status_changed_on) values (${values})`;

          	let opt3 = await new Promise((resolve, reject) => {
					    request(selectFunction(query3, ""), function (error, response) {
					      if (error) {
					        reject(error); // Reject the promise if there's an error
					      } else {
					        resolve(response); // Resolve with the response object
					      }
					    });
					  });

					  let accBBB = parseFloat(accBal - Amount).toFixed(2);
            let gtw = parseInt(x[0]["total_withdrawals"]);
            gtw += 1;

            // console.log(accBBB, gtw);

            let query4 = `update account_info set main_balance = '${accBBB}', 
            	total_withdrawals = '${gtw}' where email = '${email}'`;

            let opt4 = await new Promise((resolve, reject) => {
					    request(selectFunction(query4, ""), function (error, response) {
					      if (error) {
					        reject(error); // Reject the promise if there's an error
					      } else {
					        resolve(response); // Resolve with the response object
					      }
					    });
					  });

					  return 1;
          }
			  }

			  else {
			  	throw new Error("Invalid email...");
			  }
	  	}

	  	catch(error) {
	  		// console.log("Error withdrawing amount...", error);
	  		throw new Error(error);
	  	}
	  }

  	const error = validationResult(req);

		if (req.session._prodToken === req.user?.remember_token) {
	    if (!error.isEmpty()) {
				// console.log(error.array());
				let msg1 = error.array()[0].msg;
				// console.log(msg1);

				fetchData1(email)
			  	.then(response => {
			  		return res.render("withdraw", {
			        title: "Withdraw",
			        accBBB: response.accBBB,
			        wAmt: response.wAmt,
			        z: response.z,
			        errorMessage: msg1,
							oldInput: {
								amount: amount,
								mode: mode,
								address: address
							}
			      });
			  	})
			  	.catch(error => {
			  		console.log(error);
			  		return res.redirect("/user/withdrawal");
			  	})
			}

			else {
				fetchData(email)
					.then(response => {
						return res.redirect("/user/withdrawal");
					})
					.catch(error => {
						console.log(error);
						return res.redirect("/user/withdrawal");
					})
			}
		}  	
		else {
			return res.redirect("/login");
		}
  }
)

router.post("/user/recharge",
	async (req, res, next) => {
		const { price, custom_amount } = req.body;
	  const email = (req.user !== undefined ? req.user?.email : '');

	  // console.log(req.body, typeof price, price != 'on', parseInt(price) < 20);
	  // let email = "e@gmail.com";

	  async function fetchData(email) {
	  	try {
	  		let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

	  		// Execute the request asynchronously
			  let opt1 = await new Promise((resolve, reject) => {
			    request(selectFunction("", query1), function (error, response) {
			      if (error) {
			        reject(error); // Reject the promise if there's an error
			      } else {
			        resolve(response); // Resolve with the response object
			      }
			    });
			  });
			    
			  // Parse the response body
			  let x = JSON.parse(opt1.body);

			  if (x.length >= 1) {
		  		let today = new Date();
		      today = today.getDate() + "-" + String(today.getMonth()+1) + "-" + today.getFullYear();

				  let amount = 0;
				  let values = "";

				  if(parseInt(price) < 20) {
				    // console.log('p0 < 20');
				    throw new Error("Invalid Amount... try again...");
				  }
				  else if (parseInt(custom_amount) < 20) {
				    // console.log('p1 < 20');
				    throw new Error("Invalid Amount... try again...");
				  }
				  else {
				  	if (price != 'on') {
			        values = `\'${email}\', '${price}\', 'null', 'null', '${today}\', 'pending'`;
			      } 
			      else if (price === 'on', custom_amount == '') {
			        values = `\'${email}\', '20', 'null', 'null', '${today}\', 'pending'`;
			      }
			      else {
			        values = `\'${email}\', '${custom_amount}\', 'null', 'null', '${today}\', 'pending'`;
			      }

			      let query2 = `insert into deposits(email, amount, deposit_method, charge_id, date, status) values (${values})`;

			      // console.log(query2);

			      // Execute the request asynchronously
					  let opt2 = await new Promise((resolve, reject) => {
					    request(selectFunction(query2, ""), function (error, response) {
					      if (error) {
					        reject(error); // Reject the promise if there's an error
					      } else {
					        resolve(response); // Resolve with the response object
					      }
					    });
					  });
					    
					  return 1;
				  }
				}
				else {
			  	throw new Error("Invalid email...");
			  }
			}
			catch(error) {
				throw new Error(error);
			}
		}

		if (req.session._prodToken === req.user?.remember_token) {
			fetchData(email)
				.then(response => {
					return res.redirect("/user/payment");
				})
				.catch(error => {
					console.log("Error recharging amount: ", error);
					return res.redirect("/user/recharge");
				})
		}
		else {
			return res.redirect("/login");
		}
})

router.get("/user/payment", isAuth, async (req, res, next) => {
	const email = (req.user !== undefined ? req.user?.email : '');

	let message = req.flash('error');
	// console.log(message);

	if (message.length > 0) {
		message = message[0];
	}
	else {
		message = null;
	}

	async function fetchData(email) {
		try {
			let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

	  	// Execute the request asynchronously
			let opt1 = await new Promise((resolve, reject) => {
			  request(selectFunction("", query1), function (error, response) {
			    if (error) {
			      reject(error); // Reject the promise if there's an error
			    } else {
			      resolve(response); // Resolve with the response object
			    }
			  });
			});
			  
			// Parse the response body
			let x = JSON.parse(opt1.body);

			if (x.length >= 1) {
				const opt4 = {
	        method: 'get',
				  maxBodyLength: Infinity,
				  url: 'https://api.nowpayments.io/v1/full-currencies',
				  headers: { 
				    'x-api-key': '4FZG1FJ-26SM3C0-QTG55JJ-23EC1Z6'
				  }
	      };

	      let opt5 = await new Promise((resolve, reject) => {
				  request(opt4, function (error, response) {
				    if (error) {
				      reject(error); // Reject the promise if there's an error
				    } else {
				      resolve(response); // Resolve with the response object
				    }
				  });
				});

				let k = JSON.parse(opt5.body);
	      // console.log(k);

	      if (k.currencies.length >= 1) {
	        const getCurrency = k.currencies.filter(i => {
	          if(i.code.toUpperCase() == 'BTC' || i.code.toUpperCase() == 'ETH' 
	              || i.code.toUpperCase() == 'LTC' || i.code.toUpperCase() == 'TRX' 
	              || i.code.toUpperCase() == 'USDTERC20' || i.code.toUpperCase() == 'USDTTRC20') {
	              return true;
	          }
	        }).map(j => { return { code: j.code, name: j.name, imgUrl: j.logo_url } });

	        // console.log(getCurrency);

	        return {
	        	getCurrency
	        }
	      }

	      else {
	      	throw new Error("Error... try again...");
	      }
	    }
	    else {
			  throw new Error("Invalid email...");
			}
		}
		catch(error) {
			throw new Error(error);
		}
	}

	if (req.session._prodToken === req.user?.remember_token) {
		fetchData(email)
			.then(response => {
				// console.log(response);

				return res.render("payment", {
					title: 'Payment',
					errorMessage: message,
					currency: response.getCurrency
				})
			})
			.catch(error => {
				// console.log("Error: ", error);
				req.flash('error', error);
				return res.redirect("/user/payment");
			})
	}
	else {
		return res.redirect("/login");
	}
})

router.post("/user/pay", 
	isAuth,
	[
		body('crypto')
	  	.trim()
	  	.notEmpty()
	  	.withMessage("Payment mode required...")
	  	.isIn(['Bitcoin', 'Ethereum', 'Litecoin', 'Tron', 'Tether USD (Ethereum)', 'Tether USD (Tron)'])
    	.withMessage('Invalid Payment Mode'),
	],
	async (req, res, next) => {
		const email = (req.user !== undefined ? req.user?.email : '');

		const curry = req.body.crypto;

		// console.log(req.body);

		async function fetchData(email) {
			try {
				let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

		  	// Execute the request asynchronously
				let opt1 = await new Promise((resolve, reject) => {
				  request(selectFunction("", query1), function (error, response) {
				    if (error) {
				      reject(error); // Reject the promise if there's an error
				    } else {
				      resolve(response); // Resolve with the response object
				    }
				  });
				});
				  
				// Parse the response body
				let x = JSON.parse(opt1.body);

				if (x.length >= 1) {
					let query2 = `SELECT * FROM deposits where email = '${email}' AND status = 'pending' ORDER BY id DESC LIMIT 1`;

					let opt2 = await new Promise((resolve, reject) => {
					  request(selectFunction("", query2), function (error, response) {
					    if (error) {
					      reject(error); // Reject the promise if there's an error
					    } else {
					      resolve(response); // Resolve with the response object
					    }
					  });
					});

					let y = JSON.parse(opt2.body);

					if (y.length === 1) {
						const total = parseFloat(y[0].amount).toFixed(2);
						const uid = req.user.id;
						const notificationsKey = process.env.IPN.toString();

						// console.log(total, uid);

						const myJSON = JSON.stringify(
              { 
                "uid": uid,
                "email": req.user.email,
                "total": total,
                "crypto": curry
              }
            );

            // console.log(myJSON);

            // const hmac = crypto.createHmac('sha512', notificationsKey);
						// hmac.update(JSON.stringify(myJSON, Object.keys(myJSON).sort()));
						// const signature = hmac.digest('hex');

						// console.log(signature);

						const opt3 = {
						  'method': 'POST',
						  'url': 'https://api.nowpayments.io/v1/payment',
						  'headers': {
						    'x-api-key': '4FZG1FJ-26SM3C0-QTG55JJ-23EC1Z6',
						    'Content-Type': 'application/json',
						  },
						  body: JSON.stringify({
						    "price_amount": total,
						    "price_currency": "usd",
						    "pay_currency": curry,
						    "ipn_callback_url": "https://mateys.xyz/cryptoAPI/b.php",
						    "order_id": '0011'
						  })
						};

            let opt4 = await new Promise((resolve, reject) => {
						  request(opt3, function (error, response) {
						    if (error) {
						      reject(error); // Reject the promise if there's an error
						    } else {
						      resolve(response); // Resolve with the response object
						    }
						  });
						});

						let z = JSON.parse(opt4.body);

						// console.log(z);

						if (z.hasOwnProperty('code') && z.code === 'AMOUNT_MINIMAL_ERROR') {
							return {
								isSuccess: false,
								errorMessage: 'Change Crypto'
							}
						}

						else if (z.hasOwnProperty('payment_id')) {
							let query3 = `update deposits set deposit_method = '${z.pay_currency}', charge_id = '${z.payment_id}', status = 'waiting' where id = '${y[0].id}'`;

							let opt5 = await new Promise((resolve, reject) => {
							  request(selectFunction(query3, ""), function (error, response) {
							    if (error) {
							      reject(error); // Reject the promise if there's an error
							    } else {
							      resolve(response); // Resolve with the response object
							    }
							  });
							});

							return {
								isSuccess: true,
								errorMessage: ''
							}
						}

						else {
							throw new Error("Try Again...");
						}
					}

					else {
						throw new Error("No amount found...");
					}
				}

				else {
			  	throw new Error("Invalid email...");
				}
			}

			catch(error) {
				throw new Error(error);
			}
		}

		if (req.session._prodToken === req.user?.remember_token) {
			fetchData(email)
				.then(response => {
					// console.log(response);

					if (response.isSuccess == true) {
						return res.redirect("/user/qr");
					}
					else {
						req.flash('error', response.errorMessage);
						return res.redirect("/user/payment");
					}
				})
				.catch(error => {
					console.log("last catch Error: ", error);
					req.flash('error', error);
					return res.redirect("/user/payment");
				})
		}
		else {
			return res.redirect("/login");
		}
})

router.get("/user/qr", isAuth, async (req, res, next) => {
	const email = (req.user !== undefined ? req.user?.email : '');

	async function fetchData(email) {
		try {
			let query1 = `select * from account_info where email = '${email}' limit 10 offset 0`;

		  // Execute the request asynchronously
			let opt1 = await new Promise((resolve, reject) => {
			  request(selectFunction("", query1), function (error, response) {
			    if (error) {
			      reject(error); // Reject the promise if there's an error
			    } else {
			      resolve(response); // Resolve with the response object
			    }
			  });
			});
				  
			// Parse the response body
			let x = JSON.parse(opt1.body);

			if (x.length >= 1) {
				let query2 = `SELECT * FROM deposits where email = '${email}' AND status = 'waiting' ORDER BY id DESC LIMIT 1`;

				let opt2 = await new Promise((resolve, reject) => {
				  request(selectFunction("", query2), function (error, response) {
				    if (error) {
				      reject(error); // Reject the promise if there's an error
				    } else {
				      resolve(response); // Resolve with the response object
				    }
				  });
				});

				let y = JSON.parse(opt2.body);

				if (y.length === 1) {
					const opt3 = {
					  'method': 'GET',
					  'url': `https://api.nowpayments.io/v1/payment/${y[0].charge_id}`,
					  'headers': {
					    'x-api-key': '4FZG1FJ-26SM3C0-QTG55JJ-23EC1Z6'
					  }
					};

					let opt4 = await new Promise((resolve, reject) => {
					  request(opt3, function (error, response) {
					    if (error) {
					      reject(error); // Reject the promise if there's an error
					    } else {
					      resolve(response); // Resolve with the response object
					    }
					  });
					});

					let z = JSON.parse(opt4.body);

					return {
						address: z.pay_address,
						pay_amount: z.pay_amount,
						pay_currency: z.pay_currency,
						price_amount: y[0].amount
					}
				}

				else {
					throw new Error("No data found...");
				}
			}

			else {
			  throw new Error("Invalid email...");
			}
		}

		catch(error) {
			throw new Error(error);
		}
	}

	if (req.session._prodToken === req.user?.remember_token) {
		fetchData(email)
		 .then(response => {
		 		// console.log(response, response?.address);
		 		QRCode.toDataURL(response?.address, function (err, url) {
					if (err) {
						// Handle any errors that may occur when generating the QR code
					  console.error(err);
						return res.redirect("/user/recharge");
					} 
					else {
						return res.render('cryptoQR', {
	            title: "PAYNOW",
	            address: response.address,
	            amount: response.pay_amount,
	            currency: response.pay_currency,
	            cAmt: response.price_amount,
	            iSrc: url
	          });
					}
				})
		 })
		 .catch(error => {
				console.log("last catch Error: ", error);
				req.flash('error', error);
				return res.redirect("/user/qr");
			})
	}
	else {
		return res.redirect("/login");
	}	 
})

module.exports = router;