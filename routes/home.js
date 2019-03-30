const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');

router.get('/', ensureAuthenticated, function (req, res) {
    pool.query("SELECT * FROM createdtasks;")
    .then((result)=>{
        res.render("home",{result: result});    
    })
    .catch((error)=>{

    })
    
});

module.exports = router;
