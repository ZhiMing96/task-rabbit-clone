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

router.get("/",ensureAuthenticated, (req, res) => {
    //Retrieve all tasks and send along with render
    var cusId = parseInt(req.user.cusId)
    const param1 = [cusId];
    //console.log(cusId);
    const sql1 = "SELECT * FROM customers WHERE cusid = $1"
    pool.query(sql1,param1, (err, result1) => {
      if(err){
        console.log("ERROR RETRIEVING Customer");
      } else {
        res.render('taskReqProfile',{cusInfo: result1.rows});
      }
  
    });
    
});
  
// Start: CRUD Listings

//Add route
router.get("/addListings", function(req, res) {
    res.render("add_Listings");
});
  
router.post("/addListings", (req, res) => {
    req.checkBody("taskId", "Id is required").notEmpty();
    req.checkBody("taskName", "Category Name is required").notEmpty();
    req.checkBody("description", "Description is required").notEmpty();
    req.checkBody("duration", "Duration is required").notEmpty();
    req.checkBody("taskDateTime", "taskDateTime is required").notEmpty();
    req.checkBody("dateCreated", "Date created is required").notEmpty();
    req.checkBody("deadline", "Deadline is required").notEmpty();
    req.checkBody("startingBid", "Starting bid is required").notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.render('add_category');
        console.log(errors);

    } else {
        const sql1 = "INSERT INTO CreatedTasks (catId, catName) VALUES ($1, $2, $3, $4, $5, $6, $7)";
        const params1 = [req.body.taskId, req.body.taskName, req.body.taskName, req.body.description, req.body.duration, req.body.taskDateTime, req.body.dateCreated, req.user.cusId];
        pool.query(sql1, params1, (error, result) => {
            if (error) {
                console.log("err: ", error);
            }
        });

        const sql2 = "INSERT INTO Listings (biddingDeadlin, startingBid, taskId) VALUES ($1, $2, $3)";
        const params2 = [req.body.deadline, req.body.startingBid, req.body.taskId];
        pool.query(sql2, params2, (error, result) => {
            if (error) {
                console.log("err: ", error);
            }
            //req.flash('success', 'Article Added');
            console.log("result?", result);
            res.redirect("/");
        });
    }

});

router.get("/viewListings", (req, res) => {
    res.send("Retrieve all Listings that has not expired  ");
    /* const sqlViewListings =
        "SELECT C.description, C.manpower, C.taskDateTime, C.dateCreated, T.username 
        FROM CreatedTasks C, TaskRequesters T
        WHERE taskDateTime > (SELECT NOW())
        AND C.cusId = T.cusId
        VALUES ($1, $2, $3, $4, $5)"; */
});
    

router.put("/updateListings", (req, res) => {
    res.send(
        "Execute Update Skillset Query, create a form parameter with existing data as placeholder?"
    );
    /*
    var taskerId = 
    var description = 
    var rate = 
    var Category = 
    
    const sqlAddSkill = 
    "UPDATE AddedPersonalSkills 
        SET description = description, SET rate = rate"
    
        const sqlSetCat = 
        "UPDATE Belongs
        SET catId = (SELECT catId FROM Categories WHERE name = "Category")"
    "; */
});
    
router.delete("/deleteListings", (req, res) => {
res.send("Execute Delete SQL Statementm then redirect to /viewSkillsets");

/*
var taskerId = 

const sqlDeleteSkill = 
”DELETE FROM AddedPersonalSkills
    WHERE ssid = taskerId“
*/
});

//End: CRUD Listings 

//Start: CRUD Requests

router.get("/viewRequests", (req, res) => {
res.send(
    "Find all requests that is pending acceptance from a PARTICULAR tasker "
);
/*const sqlViewRequests = "";
    */
});

//Retrieve ALL Skillset with the cusId, if no record, redirect to create a new skillset
router.get("/skillsets", (req, res) => {
//res.render("");
/* 

const sqlRetrieveSkills = 
"SELECT ssid FROM AddedPersonalSkills 
    WHERE cusId = $1"; 

    const params = [req.body.cusId];

    pool.query(sql, params, (error, result) => {
    if (error) {
        console.log("err: ", error);
    }

    */
});
  
//End: CRUD Requests 

//View all Tasks
router.get('/viewAllTasks', function (req, res) {
    const sql = 'SELECT taskname, description, duration, manpower, taskdatetime, datecreated FROM createdTasks C join assigned A on (C.taskid = A.taskid AND A.cusid = $1 AND A.completed = true)' 
    const params = [parseInt(req.user.cusId)]
    
    pool.query(sql, params, (error, result) => {
    
        if (error) {
            console.log('err: ', error);
        }
  
        res.render('view_tr_all_tasks', {
            task: result.rows,
            taskType: 'COMPLETED'
        });
  
    });
});

//View all my completed Tasks
router.get('/viewCompletedTasks', function (req, res) {
    
    const params = [parseInt(req.user.cusId)]
    const sql = 'select taskname, description, duration, manpower, taskdatetime, datecreated from CreatedTasks C join assigned A on C.taskid = A.taskid where C.cusId = $1 and A.completed = true' 

    pool.query(sql, params, (error, result) => {
    
        if (error) {
            console.log('err: ', error);
        }
  
        res.render('view_tr_completed_tasks', {
            task: result.rows,
            taskType: 'COMPLETED'
        });
  
    });
});

//View all my pending Tasks
router.get('/viewPendingTasks', function (req, res) {
    const sql = 'select taskname, description, duration, manpower, taskdatetime, datecreated from CreatedTasks C join assigned A on C.taskid = A.taskid where C.cusId = $1 and A.completed = false'
    const params = [parseInt(req.user.cusId)]
    
    pool.query(sql, params, (error, result) => {
    
        if (error) {
            console.log('err: ', error);
        }
  
        res.render('view_tr_pending_tasks', {
            task: result.rows,
            taskType: 'PENDING'
        });
  
    });
});

//select task to show bids
router.get('/selectTaskBid', ensureAuthenticated, function (req, res) {
    res.render('select_bid_list');
});

//View all biddings for the list
router.get('/viewBids', ensureAuthenticated, function (req, res) {

    req.checkBody("taskName", "Id is required").notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.render('add_category');
        console.log(errors);

    } else {
        const sql = 'SELECT B.bidprice, C.name FROM (listings L join bids B on L.taskid = B.taskid) join customers C on B.cusid = C.cusid where L.taskid = $1' 
        const params = [req.body.taskName];
        //need to set this to strings 
        pool.query(sql, params, (error, result) => {

            if (error) {
                console.log('err: ', error);
            }

            res.render('view_tr_bid_tasks', {
                bid: result.rows,
                bidType: req.body.taskName
            });

        });
    }
});

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