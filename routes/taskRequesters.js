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
  
// link to the add task page 
router.get("/addTasks", function(req, res) {
    res.render("add_Tasks");
});
// Start: CRUD Listings


//Add route
router.get("/addListings", function(req, res) {
    res.render("add_Listings");
});
  
router.post("/addListings", (req, res) => {
    req.checkBody("taskName", "Task Name is required").notEmpty();
    req.checkBody("description", "Description is required").notEmpty();
    req.checkBody("duration", "Duration is required").notEmpty();
    req.checkBody("manpower", "manpower is required").notEmpty();
    req.checkBody("taskDateTime", "taskDateTime is required").notEmpty();
    req.checkBody("deadline", "Deadline is required").notEmpty();
    req.checkBody("startingBid", "Starting bid is required").notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.render('add_category');
        console.log(errors);

    } else {
        
        const userID = parseInt(req.user.cusId)
        var TDT = req.body.taskDateTime
        var DL = req.body.deadline     
        var dateCreated = new Date().toISOString().split('T')[0]
        const sql1 = "INSERT INTO createdTasks (taskname, description, duration, manpower, taskDateTime, dateCreated, cusId) VALUES ($1, $2, $3, $4, $5, $6, $7)"
        const params1 = [req.body.taskName, req.body.description, parseInt(req.body.duration), parseInt(req.body.manpower), TDT, dateCreated, userID]
        pool.query(sql1, params1, (error, result) => {
            if (error) {
                console.log("err: ", error);
            }
        });
        
        const sql2 = "select count(taskid) from createdtasks"

        pool.query(sql2, (error, result) => {
            if (error) {
                console.log("err: ", error);
            }
            console.log(req.body.taskName)
            const resTaskId = result.rows[0].count
            const sql3 = "INSERT INTO Listings (biddingDeadline, startingBid, taskId) VALUES ($1, $2, $3)"
            const params3 = [req.body.deadline, req.body.startingBid, resTaskId]
            pool.query(sql3, params3, (error, result) => {
                if (error) {
                    console.log("err: ", error);
                }
                //req.flash('success', 'Article Added');
                console.log("result?", result);
                res.redirect("/");
            });

        });
    }

});

//Add route
router.get("/addRequests", function(req, res) {
    const sql ="SELECT * FROM skillcategories";
    pool.query(sql, (err,data) =>{
      if(err) {
        console.log("error in sql query");
      } else {
        res.render("add_Requests", {data: data.rows});
      }
    });
});

router.post("/addRequests", (req, res) => {
    req.checkBody("taskName", "Task Name is required").notEmpty();
    req.checkBody("description", "Description is required").notEmpty();
    req.checkBody("duration", "Duration is required").notEmpty();
    req.checkBody("manpower", "manpower is required").notEmpty();
    req.checkBody("taskDateTime", "taskDateTime is required").notEmpty();
    req.checkBody("catName", "Category Name is required").notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.render('add_category');
        console.log(errors);

    } else {
        
        const userID = parseInt(req.user.cusId)
        const TDT = req.body.taskDateTime
        const dateCreated = new Date().toISOString().split('T')[0]
        const sql1 = "INSERT INTO createdTasks (taskname, description, duration, manpower, taskDateTime, dateCreated, cusId) VALUES ($1, $2, $3, $4, $5, $6, $7)"
        const params1 = [req.body.taskName, req.body.description, parseInt(req.body.duration), parseInt(req.body.manpower), TDT, dateCreated, userID]
        pool.query(sql1, params1, (error, result) => {
            if (error) {
                console.log("err: ", error);
            }
        });
        
        //get task id from the created task
        const sql2 = "select count(taskid) from createdtasks"

        pool.query(sql2, (error, data) => {
            if (error) {
                console.log("err: ", error);
            }
            else {
                console.log(req.body.taskName)
                const resTaskId = data.rows[0].count
                const paramCatName = [req.body.catName];
                var sqlCat = "SELECT * FROM skillcategories WHERE catname = $1";
  
                pool.query(sqlCat,paramCatName, (err,data) =>{
                    if(err){
                      console.log("ERROR RETRIEVING CATEGORY ID" + err);
                    } else {
                      var paramRequires = [data.rows[0].catid, resTaskId];
                      var sqlRequires = "INSERT INTO requires(catid,taskid) VALUES ($1,$2)";
                      pool.query(sqlRequires,paramRequires);
                      //redirect to pick a tasker
                      res.redirect("/taskRequesters");
                    }
                    });
            }
        });
    }

});

router.get("/viewListings", (req, res) => {
    res.render("view_tr_Listings");
});
    

router.put("/updateListings", (req, res) => {
    
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
    const sql = "SELECT C.taskid, taskname, description, duration, manpower, taskdatetime, datecreated, accepted, R.cusid, completed FROM (createdtasks C inner join Requests R on C.taskid = R.taskid) left outer join assigned A on C.taskid = A.taskid where C.cusid = $1"
    const params = [parseInt(req.user.cusId)]
    console.log(req.user.cusId)
    
    pool.query(sql, params, (error, result) => {
    
        if (error) {
            console.log('err: ', error);
        }
  
        res.render('view_tr_requests', {
            task: result.rows,
        });
        
        console.log(result.rows[0])
    });

});

router.get("/updateRequests/:ssid", ensureAuthenticated,(req, res) => {
    var ssId = req.params.ssid;
    
  
    var sqlSkill = "SELECT * FROM addedpersonalskills WHERE ssid = " + ssId;
  
    pool.query(sqlSkill, (err,data)=> {
      if(err){
        console.log('ERROR RETRIEVING SKILL' + err);
      } else {
        var sqlCat = "SELECT * FROM skillcategories s INNER JOIN belongs b ON s.catid = b.catid WHERE b.ssid = " + ssId;
        pool.query(sqlCat, (err,results)=> {
          if(err){
            console.log('ERROR RETRIEVING CATEGORY' + err);
          } else {
            var catId = results.rows[0].catid
            var sqlAllCats = "SELECT * FROM skillcategories WHERE catid <> " + catId;
              pool.query(sqlAllCats, (err,allCats)=> {
              if(err){
                console.log('ERROR RETRIEVING ALL CATEGORIES' + err);
              } else {
                res.render('updateSkill',{skills: data.rows, category: results.rows, allCats: allCats.rows});
              }
            });
            
          }
        });
      }
    });
    
  });
  
  router.post("/updateRequests/:ssid",ensureAuthenticated, (req, res) => {
    req.checkBody("newDescription", "Description is required").notEmpty();
    req.checkBody("newRate", "Rate is required").notEmpty();
    req.checkBody("catName", "Category is required").notEmpty();
    var ssId = req.params.ssid;
    console.log("SSID OF UPDATED SKILL IS:" + ssId);
    console.log("New Rate: "+req.body.newRate);
    console.log("New Description: " +req.body.newDescription);
    console.log("New Cat: " +req.body.catName);
  
    let error = req.validationErrors();
    if (error) {
      res.render("/taskerSettings");
      console.log('Error with inputs')
    } else {
      const params = [req.body.newDescription,req.body.newRate,ssId];
      var sql = "UPDATE addedpersonalskills SET description = $1, rateperhour = $2 WHERE ssid = $3";
  
      pool.query(sql, params,(err, result) =>{
        if(err){
          console.log(err + " ERROR UPDATING SKILL");
        } else {
          var params2 = [req.body.catName];
          var sqlCatId = "SELECT * FROM skillcategories WHERE catname = $1";
          pool.query(sqlCatId,params2, (err,data)=>{
            if(err){
              console.log(err + "ERROR GETTING CATID");
            } else {
              var params3 = [data.rows[0].catid,ssId];
              var sqlUpdate = "UPDATE belongs SET catid = $1 WHERE ssid = $2";
  
              pool.query(sqlUpdate,params3,(err,data1)=> {
                if(err){
                  console.log(err + "ERROR GETTING CATID");
                } else {
                  res.redirect('/taskers/taskerSettings');
                }
              });
            }
          });
        }
      });
    }
    
  });
  
  router.get("/deleteRequests/:taskid", ensureAuthenticated,(req, res) => {
    var taskid = parseInt(req.params.taskid);

    sqlDeleteCreatedTask = "DELETE FROM createdTasks WHERE taskid = " + taskid
    sqlDeleteRequests = "DELETE FROM requests WHERE taskid = " + taskid
    sqlDeleteAssigned = "DELETE FROM assigned WHERE taskid = " + taskid
    sqlDeleteRequires  = "DELETE FROM requires WHERE taskid = " + taskid
  
    pool.query(sqlDeleteCreatedTask,(err,result)=> {
      if(err){
        console.log("Unable to delete requests record" + err);
      } else { 
          
        res.redirect('/taskRequesters/viewRequests');
      }
    });
    
  });
  
  
//End: CRUD Requests 

router.get("/viewAllTasks", function(req, res) {
    res.render("view_tr_all_tasks");
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