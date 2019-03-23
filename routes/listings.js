
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

//View All Available Listings
router.get('/viewAllAvailable', function (req, res) {
    const sql = 'SELECT taskname, description, duration, manpower, taskdatetime, datecreated FROM createdTasks WHERE taskId IN (SELECT taskId FROM listings WHERE biddingDeadline > (SELECT NOW())) AND taskdatetime > (SELECT NOW()) AND taskid not in (SELECT taskid FROM assigned)'
    pool.query(sql, (error, result) => {
        if (error) {
            console.log('err: ', error);
        }

        res.render('view_available_listings', {
            availableListing: result.rows,
        });

    });


});


module.exports = router;