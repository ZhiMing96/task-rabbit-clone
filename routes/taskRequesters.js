
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const passport = require('passport');


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cs2102project',
    password: 'password',
    port: 5432,
});
pool.connect();

//Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
  
    } else {
        req.flash('danger', 'Please Log In');
        
        res.redirect('/users/login');
    }
  
  }
module.exports = router;