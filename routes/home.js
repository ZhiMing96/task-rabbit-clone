const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');

router.get('/', ensureAuthenticated, function (req, res) {
    pool.query("SELECT * FROM createdtasks  order by datecreated DESC limit 4;")
    .then((result)=>{
        res.render("home",{result: result});    
    })
    .catch((error)=>{
        req.flash("warning", "An error occured.");
        res.render("/home")
    })
    
});

module.exports = router;
