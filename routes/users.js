const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'articlelist',
    password: 'password',
    port: 5432,
});
pool.connect();

//Register Form 
router.get('/register', function (req, res) {
    res.render('register');
});

//Register Process 
router.post('/register', (req, res) => {

    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match.').equals(req.body.password);


    let errors = req.validationErrors();
    if (errors) {
        res.render('register', {
            errors: errors
        });

    } else {

        let password = req.body.password;

        bcrypt.genSalt(10, function (error, salt) {
            bcrypt.hash(password, salt, function (err, hash) {
                if (error) {
                    console.log(error);
                }



                const sql = 'INSERT INTO users (name, email, username, password) VALUES ($1, $2, $3, $4)'
                const params = [req.body.name, req.body.email, req.body.username, hash];
                pool.query(sql, params, (error, result) => {
                    if (error) {
                        console.log('err: ', error);
                    }
                    req.flash('success', 'You have successfully registered as a user');
                    res.redirect('/users/login');
                });


            });
        });

    }

});

//Login form
router.get('/login', function (req, res) {
    res.render('login');
});

//Login process
router.post('/login', function(req,res, next){
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req,res,next);
});


//Logout
router.get('/logout', function(req,res){
    req.logout();
    res.redirect('/users/login');
});
module.exports = router;