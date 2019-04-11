const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');

router.get('/', ensureAuthenticated, function (req, res){
    return Promise.all([
        pool.query("SELECT * FROM createdtasks order by datecreated DESC limit 4;"),
        pool.query("SELECT a.cusid,c.Name AS taskerName, c.email AS email, count(*) AS numtask FROM assigned a INNER JOIN createdtasks ct ON a.taskid=ct.taskid INNER JOIN customers c ON c.cusid = a.cusid INNER JOIN reviews r ON r.cusid = c.cusid WHERE a.completed = TRUE AND r.rating >= 3 AND CAST(EXTRACT(MONTH FROM ct.taskstartdatetime) AS INTEGER) = (SELECT CAST(EXTRACT(MONTH FROM current_date) AS INTEGER)) GROUP BY a.cusid, c.Name, c.email ORDER BY count(*)DESC LIMIT 3;")
    ])
    .then(([result1, result2]) => {
        res.render("home",{task: result1.rows, tasker: result2.rows});
    
    })
    .catch((error)=>{
        req.flash("warning", "An error occured.");
        res.render("home")
    })
});

module.exports = router;
