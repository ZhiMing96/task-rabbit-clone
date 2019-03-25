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

router.get("/", (req, res) => {
    res.send(
      "IF Id exist in taskers table, load tasker info, else redirect to create profile page"
    );
    /*
    if((select name from taskers where ))
    */
  });
  
// Start: CRUD Listings

router.post("/addListings", (req, res) => {
//   console.log(req.body.catName);
//   console.log(req.body.description);
//   console.log(req.body.rate);

//Insert into CreatedTasks (taskId, taskName, Description, Duration, Manpower, taskDateTime, dateCreated, Completed, cusID  ) 

req.checkBody("Task Name", "description is required").notEmpty();
req.checkBody("description", "description is required").notEmpty();
req.checkBody("rate", "rate is required").notEmpty();
req.checkBody("date", "description is required").notEmpty();
req.checkBody("description", "description is required").notEmpty();
req.checkBody("catName", "Category Name is required").notEmpty();

let error = req.validationErrors();
if (error) {
    res.render("/");
    console.log("err: ", error);
} else {
    const paramSkill = ["1", "1", req.body.description, req.body.rate];
    const sqlAddSkill =
    "INSERT INTO AddedPersonalSkills(ssid,cusId,description,ratePerHour) VALUES($1,$2,$3,$4)";
    pool.query(sqlAddSkill, paramSkill, (error, result) => {
    if (error) {
        console.log("err: ", error);
    }
    res.redirect("/");
    });
}

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
router.get('/viewMyCompletedTasks', function (req, res) {
    const sql = 'SELECT taskname, description, duration, manpower, taskdatetime, datecreated FROM createdTasks C join assigned A on (C.taskid = A.taskid AND A.cusid = $1 AND A.completed = true)' 
    const params = [parseInt(req.user.cusId)]
    
    pool.query(sql, params, (error, result) => {
    
        if (error) {
            console.log('err: ', error);
        }
  
        res.render('view_my_tasks', {
            task: result.rows,
            taskType: 'COMPLETED'
        });
  
    });

//View all my completed Tasks
router.get('/viewMyCompletedTasks', function (req, res) {
    const sql = 'SELECT taskname, description, duration, manpower, taskdatetime, datecreated FROM createdTasks C join assigned A on (C.taskid = A.taskid AND A.cusid = $1 AND A.completed = true)' 
    const params = [parseInt(req.user.cusId)]
    
    pool.query(sql, params, (error, result) => {
    
        if (error) {
            console.log('err: ', error);
        }
  
        res.render('view_my_tasks', {
            task: result.rows,
            taskType: 'COMPLETED'
        });
  
    });

//View all my pending Tasks
router.get('/viewMyPendingTasks', function (req, res) {
    const sql = 'SELECT taskname, description, duration, manpower, taskdatetime, datecreated FROM createdTasks C join assigned A on (C.taskid = A.taskid AND A.cusid = $1 AND A.completed = false)' 
    const params = [parseInt(req.user.cusId)]
    
    pool.query(sql, params, (error, result) => {
    
        if (error) {
            console.log('err: ', error);
        }
  
        res.render('view_my_tasks', {
            task: result.rows,
            taskType: 'PENDING'
        });
  
    });
  
//View all biddings for the list
router.get('/viewMyBids', ensureAuthenticated, function (req, res) {
    const sql = 'SELECT C.taskName, B.bidPrice, L.biddingDeadline FROM CreatedTasks C join (Listings L join Bids B on (L.taskId = B.taskId)) on (C.taskId = L.taskId AND B.cusId = $1)'
    const params = [parseInt(req.user.cusId)]
    
    pool.query(sql, params, (error, result) => {
    
        if (error) {
            console.log('err: ', error);
        }
  
        res.render('view_my_bids', {
            bid: result.rows,
            
        });
  
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