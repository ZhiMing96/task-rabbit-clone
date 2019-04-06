const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
//const session = require('express-session');
//const expressflash = require('express-flash');

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');



//Register Form 
router.get('/register', function (req, res) {
    req.flash('warning', 'Passwords do not match');
    if (req.isAuthenticated()) {
        res.redirect("/home");
    }
    res.render('register');
});


//Register Process 
router.post('/register', (req, res) => {

    
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('gender', 'Gender is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match.').equals(req.body.password);

    if (req.body.password != req.body.password2){
        req.flash('warning', 'Passwords do not match');
        res.render('register');
    } else {
        let password = req.body.password;

        bcrypt.genSalt(10, function (error, salt) {
            bcrypt.hash(password, salt, function (err, hash) {
                if (error) {
                    console.log(error);
                }


                const sql = 'INSERT INTO customers (password, name, username, enabled, gender, email) VALUES ($1, $2, $3, $4, $5, $6)'
                const params = [hash, req.body.name, req.body.username, true, req.body.gender, req.body.email];
                pool.query(sql, params, (error, result) => {
                    if (error) {
                        console.log('err: ', error);
                    }

                    const sql1 = 'SELECT * FROM customers WHERE username = $1'
                    const params1 = [req.body.username];
                    pool.query(sql1, params1, (error, result) => {
                        if (error) {
                            console.log('err: ', error);
                        };

                        const sql2 = 'INSERT INTO taskrequesters (cusid) VALUES ($1)'
                        const params2 = [result.rows[0].cusid]; 
                        pool.query(sql2, params2, (error, result) => {
                            if (error) {
                                console.log('error adding to taskrequesters: ', error);
                            }
                        });

                        const sql3 = 'INSERT INTO taskers (cusid) VALUES ($1)'
                        const params3 = [result.rows[0].cusid]; 
                        pool.query(sql3, params3, (error, result) => {
                            if (error) {
                                console.log('error adding to taskers: ', error);
                            } else {
                                req.flash('success', 'You have successfully registered as a user! <i class="far fa-laugh-beam"></i>');
                                res.redirect('/users/login');
                            }
                        });



                    });


                });
            });

        })
    }

});


//Login form
router.get('/login', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/home");
    }
    res.render('login');
});

//Login process
router.post('/login', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/home/',
        failureRedirect: '/users/login',
        failureFlash: '<i class="fas fa-times"></i> Username/password combination wrong.'
    })(req, res, next);
});


//Logout
router.get('/logout', function (req, res) {
    req.flash('success', 'You have successfully logged out.')
    req.logout();
    res.redirect('/users/login');
});
module.exports = router;

