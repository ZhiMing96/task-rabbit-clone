const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');

router.get("/my_bids",ensureAuthenticated, (req, res) => {
  pool.query("SELECT t3.name,t3.avg,t3.completedTasks,t1.cusid,t1.bidprice,t1.winningbid,t2.taskname,t1.taskid FROM bids as t1 INNER JOIN createdtasks as t2 on t1.taskid=t2.taskid INNER JOIN (SELECT t11.cusid, t11.name, COUNT(t22.*) as completedTasks, AVG(t33.rating) FROM Customers as t11 LEFT JOIN assigned as t22 ON t11.cusid=t22.cusid AND t22.completed=true LEFT JOIN reviews as t33 ON t11.cusid=t33.cusid GROUP BY t11.cusid) as t3 ON t1.cusid = t3.cusid WHERE t2.cusid=$1;",[req.user.cusId])
  .then((result) => {
    res.render("view_tr_bids",{bids: result.rows})
  })
  .catch((error) => {
    req.flash("warning",'Encountered an error: ' + error);
    res.render("view_tr_bids");
  });
});

router.get("/my_bids/accept_bid/taskid/:taskid/tasker/:tasker_id",ensureAuthenticated, (req, res) => {

  return Promise.all([
      pool.query("SELECT t1.bidprice, t2.name,AVG(t3.rating) as rating,COUNT(t4.*) as count,t5.taskname FROM bids as t1 INNER JOIN customers as t2 ON t2.cusid=$2 LEFT JOIN reviews as t3 ON t3.cusid=$2 LEFT JOIN assigned as t4 ON t4.cusid=$2 AND t4.completed=true INNER JOIN createdtasks as t5 ON t5.taskid=$1 WHERE t1.taskid=$1 AND t1.cusid=$2 GROUP BY t2.name, t5.taskname, t1.bidprice;",[req.params.taskid,req.params.tasker_id]),
      pool.query("SELECT t3.description FROM requires as t1 INNER JOIN belongs as t2 ON t1.catid=t2.catid INNER JOIN addedpersonalskills as t3 ON t2.ssid=t3.ssid AND t3.cusid=$2 WHERE taskid=$1;",[req.params.taskid, req.params.tasker_id]),
      pool.query("SELECT t1.rating,t1.description,t3.name FROM reviews as t1 INNER JOIN createdtasks as t2 ON t2.taskid=$1 INNER JOIN customers as t3 ON t2.cusid=t3.cusid WHERE t1.cusid=$2",[req.params.taskid, req.params.tasker_id])
    ])
  .then(([result,result2,result3]) => {
    if(result.rows.length == 0 || result2.rows.length == 0){
      req.flash("warning",'Encountered an error. Please try again.');
      res.redirect("/taskRequesters/my_bids/");
    }
    res.render("tr_accept_bid",{tasker_info: result.rows[0], tasker_skills: result2.rows, tasker_reviews: result3.rows});
  })
  .catch((error) => {
    req.flash("warning",'Encountered an error: ' + error);
    res.redirect("/taskRequesters/my_bids/");
  });
});

router.get("/my_bids/accept_bid/taskid/:taskid/tasker/:tasker_id/accept",ensureAuthenticated, (req, res) => {

  return Promise.all([
      pool.query("UPDATE bids SET winningbid=true WHERE cusid=$2 AND taskid=$1;",[req.params.taskid,req.params.tasker_id]),
      pool.query("INSERT INTO Assigned(taskid,cusid,completed) VALUES($1,$2,false);",[req.params.taskid,req.params.tasker_id]),
      pool.query("UPDATE Listings SET hasChosenBid = true WHERE taskid = $1;",[req.params.taskid]),
      pool.query("UPDATE Listings SET biddingDeadline = now() WHERE taskid = $1;",[req.params.taskid]),
      pool.query("SELECT t1.*, t2.bidprice,t3.name FROM createdtasks as t1 INNER JOIN bids as t2 on t1.taskid=t2.taskid INNER JOIN customers as t3 on t2.cusid=t3.cusid WHERE t2.taskid=$1 AND t2.cusid=$2;",[req.params.taskid, req.params.tasker_id])
    ])
  .then(([result,result2,result3]) => {
    res.render("tr_accepted_bid",{result: result3.rows[0]});
  })
  .catch((error) => {
    req.flash("warning",'Encountered an error: ' + error);
    res.redirect("/taskRequesters/my_bids/");
  });
});

router.get("/write_review/:taskid/tasker/:tasker_id",ensureAuthenticated, (req, res) => {
  pool.query("SELECT * FROM reviews as t1 WHERE t1.taskid=$1 AND t1.cusid=$2;", [req.params.taskid, req.params.tasker_id])
  .then((result)=>{
    if(result.rows.length > 0){
      req.flash("warning",'Review has already been submitted for this task and this tasker.');
      res.redirect('/');
    }
  })
  pool.query("SELECT * FROM createdtasks as t1 INNER JOIN assigned as t2 ON t1.taskid=t2.taskid INNER JOIN customers as t3 ON t2.cusid=t3.cusid WHERE t1.taskid=$1 AND t2.cusid=$2;", [req.params.taskid, req.params.tasker_id])
  .then((result)=>{
    res.render("tr_write_review",{result: result.rows[0]})
  })
  .catch((error) => {
    req.flash("warning",'Encountered an error: ' + error);
    res.redirect("back");
  });
});

router.post("/write_review/:taskid/tasker/:tasker_id",ensureAuthenticated, (req, res) => {
  pool.query("INSERT INTO reviews(rating, description, taskid, cusid) VALUES($1,$2,$3,$4);",[req.body.rating,req.body.review,req.params.taskid,req.params.tasker_id])
  .then((result)=>{
    req.flash("success", 'Review submitted! Thanks for your review!')
    res.redirect("/");
  })
  .catch((error) => {
    req.flash("warning",'Encountered an error: ' + error);
    res.redirect("back");
  });
});


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
router.get("/addTasks", ensureAuthenticated, (req, res) => {
    res.render("add_Tasks");
});
// Start: CRUD Listings


//Add route
/*
router.get("/newListings/:catId", ensureAuthenticated, (req, res) => {
    
  var catId= req.params.catId;
  const sqlcat ="SELECT catname, catId FROM skillcategories where catId=" + catId +";"
  
  pool.query(sqlcat, (err,result) =>{
    if(err) {
      console.log("error in sqlcat query");
    } else {
              res.render("add_Listings", {cat: result.rows});
    }
  })
});
*/
/*
router.get("/addListings", ensureAuthenticated, async function(req, res){
  const categoryQuery ="SELECT * FROM skillcategories";
  var categoryResult = await pool.query(categoryQuery);

  var taskersByCategory = [];

  for(x=0;x<categoryResult.rows.length;x++){
      var sqlQuery = "with countCatTasks as (select a.cusid, count(r.catid) as num from assigned a join requires r on a.taskid=r.taskid where a.completed=true group by a.cusid, r.catid)"+ 
      " SELECT T.name, T.cusId, (SELECT avg(rating) FROM Reviews WHERE cusId=T.cusId) AS taskerRating, c.num, S.ratePerHour, S.description, S.ssid "+
      "FROM Customers T join AddedPersonalSkills S on T.cusId=S.cusId join Belongs B on S.ssid=B.ssId left join countCatTasks c on c.cusid=T.cusid WHERE B.catid=$1 order by ratePerHour desc;"
      var sqlParams = [categoryResult.rows[x].catid]; 
      var result = await pool.query(sqlQuery, sqlParams);
      taskersByCategory.push(result.rows);
  }
  
  console.log(taskersByCategory);

  res.render("add_Listings_1", {
      categories: categoryResult.rows,
      taskersByCategory: taskersByCategory
  });
});
*/

router.get("/addListings", ensureAuthenticated, async function(req, res){
    res.render("add_Listings");
});

router.post("/addListings", ensureAuthenticated, (req, res) => {
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
    
        const sqlinserttask = "INSERT INTO createdTasks (taskname, description, duration, manpower, taskDateTime, dateCreated, cusId, deadline) VALUES ($1, $2, $3, $4, $5, now(), $6, $7) RETURNING taskid;"
        const params1 = [req.body.taskName, req.body.description, parseInt(req.body.duration), parseInt(req.body.manpower), TDT, userID, req.body.deadline]
        pool.query(sqlinserttask, params1)
        .then((results) => {
          var paramRequires = [results.rows[0].taskid];
          // for now i just hard insert the catid until the category is implemented
          var sqlRequires = "INSERT INTO Requires(catid,taskid) VALUES (1,$1) RETURNING taskid";
          return pool.query(sqlRequires, paramRequires);
        })
        .then((results) => {
            const sqlListings = "INSERT INTO Listings (startingBid, taskId, hasChosenBid) VALUES ($1, $2, false) RETURNING taskid"
            const paramsListings = [req.body.startingBid, results.rows[0].taskid]
            return pool.query(sqlListings, paramsListings);
        })
        .then((results) => {
          var taskid = [results.rows[0].taskid];
          var sqlNewTask = "SELECT T.taskname, T.description, T.manpower, T.taskDateTime FROM createdtasks T join Listings L on T.taskid = L.taskid WHERE L.taskid=$1;"
          return pool.query(sqlNewTask,taskid); 
        })

      .then((results) => {
          console.log(results)
          res.render('newListingCreated', 
          {   taskname: results.rows[0].taskname,
              description: results.rows[0].description,
              manpower: results.rows[0].manpower,
              taskDateTime: results.rows[0].taskDateTime,
          });
      })
      .catch((error) => {
          console.log("Error creating new task", error);
          req.flash("warning", "An error was encountered. Please try again.")
          res.redirect('/addListings');
      })
    }

});

//Add route
router.get("/addRequests", ensureAuthenticated, async function(req, res) {
    const categoryQuery ="SELECT * FROM skillcategories";
    var categoryResult = await pool.query(categoryQuery);

    var taskersByCategory = [];

    for(x=0;x<categoryResult.rows.length;x++){
        var sqlQuery = "with countCatTasks as (select a.cusid, count(r.catid) as num from assigned a join requires r on a.taskid=r.taskid where a.completed=true group by a.cusid, r.catid)"+ 
        " SELECT T.name, T.cusId, (SELECT avg(rating) FROM Reviews WHERE cusId=T.cusId) AS taskerRating, c.num, S.ratePerHour, S.description, S.ssid "+
        "FROM Customers T join AddedPersonalSkills S on T.cusId=S.cusId join Belongs B on S.ssid=B.ssId left join countCatTasks c on c.cusid=T.cusid WHERE B.catid=$1 order by ratePerHour desc;"
        var sqlParams = [categoryResult.rows[x].catid]; 
        var result = await pool.query(sqlQuery, sqlParams);
        taskersByCategory.push(result.rows);
    }
    
    //console.log(taskersByCategory);

    res.render("select_tasker", {
        categories: categoryResult.rows,
        taskersByCategory: taskersByCategory
    });
});

router.post("/addRequests", (req, res) => {
    req.checkBody("taskName", "Task Name is required").notEmpty();
    req.checkBody("description", "Description is required").notEmpty();
    req.checkBody("duration", "Duration is required").notEmpty();
    req.checkBody("manpower", "manpower is required").notEmpty();
    req.checkBody("taskDateTime", "taskDateTime is required").notEmpty();
    req.checkBody("deadline", "deadline is required").notEmpty();
  
    let errors = req.validationErrors();
    if (errors) {
        res.render('add_category');
        console.log(errors);

    } else {
        
        const userID = parseInt(req.user.cusId)
        const TDT = req.body.taskDateTime
        
        const sqlinserttask = "INSERT INTO createdTasks (taskname, description, duration, manpower, taskDateTime, dateCreated, cusId, deadline) VALUES ($1, $2, $3, $4, $5, now(), $6, $7) RETURNING taskid;"
        const params1 = [req.body.taskName, req.body.description, parseInt(req.body.duration), parseInt(req.body.manpower), TDT, userID, req.body.deadline]
        pool.query(sqlinserttask, params1)
        .then((results) => {
            var paramRequires = [req.body.catid, results.rows[0].taskid];
            
            var sqlRequires = "INSERT INTO Requires(catid,taskid) VALUES ($1,$2) RETURNING taskid";
            return pool.query(sqlRequires, paramRequires);
        })
        .then((results) => {
          var paramRequests = [results.rows[0].taskid, req.body.taskerid];
          var sqlRequests = "INSERT INTO Requests(taskid, cusid, hasResponded) VALUES ($1, $2, false) RETURNING taskid;"
          return pool.query(sqlRequests,paramRequests); 
      })
      
        .then((results) => {
            var taskid = [results.rows[0].taskid];
            var sqlNewTask = "SELECT T.taskname, T.description, T.manpower, T.taskDateTime, C.name FROM createdtasks T join Requests R on T.taskid= R.taskid join customers C on R.cusid=C.cusid WHERE R.taskid=$1;"
            return pool.query(sqlNewTask,taskid); 
        })

        .then((results) => {
            //console.log(results)
            res.render('newTaskCreated', 
            {   taskname: results.rows[0].taskname,
                description: results.rows[0].description,
                manpower: results.rows[0].manpower,
                taskDateTime: results.rows[0].taskDateTime,
                tasker: results.rows[0].name

            });
        })
        .catch((error) => {
            console.log("Error creating new task", error);
            req.flash("warning", "An error was encountered. Please try again.")
            res.redirect('/addRequests');
        })

    }
});


router.get("/addRequests/:category/:ssid/:value/:tasker_id", ensureAuthenticated, async function(req, res) {
    

  var catId= req.params.category;
  var ssId= req.params.ssid;
  var taskerId= req.params.tasker_id;
  var val= req.params.value;

  var sqlprofile = "with countCatTasks as (select a.cusid, count(r.catid) as num from assigned a join requires r on a.taskid=r.taskid where a.completed=true group by a.cusid, r.catid) "+
  "SELECT T.name, T.cusid, (SELECT avg(rating) FROM Reviews WHERE cusId=T.cusId) AS taskerRating, c.num, S.ratePerHour, S.description "+
  "FROM Customers T join AddedPersonalSkills S on T.cusId=S.cusId join Belongs B on S.ssid=B.ssId left join countCatTasks c on c.cusid=T.cusid WHERE B.catid=" +catId + " and S.ssid=" +ssId + " and T.cusid=" +taskerId + ";"
  
  pool.query(sqlprofile, (err,profileresults)=> {
    if (err) {
      console.log("error in sqlprofile query" + err);
    } else {
      const sqlreviews = "SELECT C.catName as catName, RV.rating, RV.description, RV.taskId, CU1.name FROM Reviews RV join Requires R on RV.taskId=R.taskId "+
      "join SkillCategories C on R.catId=C.catId join Customers CU on RV.cusId=CU.cusId join CreatedTasks T on RV.taskid=T.taskid join Customers CU1 on CU1.cusid=T.cusid WHERE CU.cusid=" + taskerId+ ";"
        pool.query(sqlreviews, (err, reviewsresults)=> {
        if (err){
          console.log("error in sqlreviews query" + err);
        } else {
          var cat = "SELECT catname from skillcategories where catid=" + catId + ";"
          pool.query(cat, (err, category) => {
            if (err) {
              console.log("error in cat query" + err);
            } else {
                res.render("viewTaskerProfileAndReviews", {
                profile: profileresults.rows,
                reviews: reviewsresults.rows,
                catName: category.rows[0].catname,
                catId,
                val               
                });
              }
              
            }
          )
        }
      })
    }
  });
});

router.get("/newTask/:catId/:taskerId", ensureAuthenticated, (req, res) => {
    
    var catId= req.params.catId;
    var taskerId= req.params.taskerId;
    const sqlcat ="SELECT catname, catId FROM skillcategories where catId=" + catId +";"
    
    pool.query(sqlcat, (err,result) =>{
      if(err) {
        console.log("error in sqlcat query");
      } else {
        const sqltasker ="SELECT name, cusId FROM customers where cusId=" + taskerId +";"
        pool.query(sqltasker, (err,result1) =>{
            if(err) {
              console.log("error in sqltasker query");
            } else {
                res.render("add_Requests", {cat: result.rows, tasker: result1.rows});
            }
        })
      }
    })
});

router.get("/viewListings", (req, res) => {
    console.log("here")
    const sql = "SELECT C.taskid as taskid, taskname, description, duration, manpower, taskdatetime, datecreated, deadline, L.hasChosenBid as haschosenbid, A.completed as completed FROM (createdtasks C inner join Listings L on C.taskid = L.taskid) left outer join assigned A on C.taskid = A.taskid WHERE C.cusid = $1;"
    const params = [parseInt(req.user.cusId)]
    console.log(req.user.cusId)
    
    pool.query(sql, params, (error, result) => {
    
        if (error) {
            console.log('err: ', error);
        }
        res.render('view_tr_listings', {
            task: result.rows,
        });
    });
});
    

router.get("/updateListings/:taskid", (req, res) => {
    var taskid = req.params.taskid;
  
    var sqlTaskName = "SELECT taskname, taskid FROM createdTasks WHERE taskid = " + taskid;
  
    pool.query(sqlTaskName, (err,result)=> {
      if(err){
        console.log('ERROR RETRIEVING TASKNAME' + err);
      } else {
            console.log(taskid)
            res.render('update_listings', {
            task: result.rows
            });
        }
    });  
});

router.post("/updateListings/:taskid",ensureAuthenticated, (req, res) => {
    req.checkBody("newDescription", "description is required").notEmpty();
    req.checkBody("newDuration", "duration is required").notEmpty();
    req.checkBody("newManpower", "manpower is required").notEmpty();
    req.checkBody("newTaskDateTime", "taskDateTime is required").notEmpty();
    req.checkBody("newDeadline", "deadline is required").notEmpty();
    var taskid = req.params.taskid;
  
    const params1 = [req.body.newDescription, req.body.newDuration, req.body.newManpower, req.body.newTaskDateTime, req.body.newDeadline, taskid];
    var sqlUpCreatedTask = "UPDATE createdTasks SET description = $1, duration = $2, manpower = $3, taskDateTime = $4, deadline = $5 WHERE taskid = $6";
  
    pool.query(sqlUpCreatedTask, params1,(err, result) =>{
        if(err){
          console.log(err + " ERROR UPDATING CREATED TASKS");
        } else { 
          res.redirect('/taskRequesters/viewListings');
        }
      });

    /*
    const params2 = [req.body.newDeadline, taskid];
    var sqlUpListings = "UPDATE Listings SET biddingDeadline = $1 WHERE taskid = $2";
    pool.query(sqlUpListings, params2,(err, result) =>{
        if(err){
            console.log(err + " ERROR UPDATING LISTINGS");
        }
        else { 
            res.redirect('/taskRequesters/viewListings');
        }
    });
    */
  });
    
router.get("/deleteListings/:taskid", ensureAuthenticated,(req, res) => {
    var taskid = parseInt(req.params.taskid);

    sqlDeleteCreatedTask = "DELETE FROM createdTasks WHERE taskid = " + taskid
    sqlDeleteBids = "DELETE FROM Bids WHERE taskid = " + taskid

   pool.query(sqlDeleteBids,(err,result)=> {
    if(err){
      console.log("Unable to delete Bids " + err);
    } else { 
    }
  });

    pool.query(sqlDeleteCreatedTask,(err,result)=> {
      if(err){
        console.log("Unable to delete created task" + err);
      } else { 

        res.redirect('/taskRequesters/viewListings');
      }
    });
    
});

//End: CRUD Listings 

//Start: CRUD Requests

router.get("/viewRequests", ensureAuthenticated, (req, res) => {

  
  const sqlUpdate = "UPDATE requests SET accepted = false, hasresponded = true WHERE (select taskid from createdtasks where deadline <= CURRENT_TIMESTAMP) = requests.taskid and hasresponded = false;"
  
  pool.query(sqlUpdate, (error, result) => {
  
    if (error) {
        console.log('err: ', error);
    }
  });
  
  const sql = "SELECT C.taskid, taskname, description, duration, manpower, taskdatetime, datecreated, deadline, accepted, R.hasResponded as hasresponded, CS.Name as taskername, completed FROM (createdtasks C inner join (customers CS natural join Requests R) on C.taskid = R.taskid) left outer join assigned A on C.taskid = A.taskid where C.cusid = $1;"
  const params = [parseInt(req.user.cusId)]
  console.log(req.user.cusId)

  pool.query(sql, params, (error, result) => {
  
      if (error) {
          console.log('err: ', error);
      }
      
      console.log(result.rows[0])
      res.render('view_tr_requests', {
          task: result.rows,
      });
  });

});

router.get("/updateRequests/:taskid", ensureAuthenticated,(req, res) => {
    var taskid = req.params.taskid;
  
    var sqlTaskName = "SELECT taskname, taskid FROM createdTasks WHERE taskid = " + taskid;
  
    pool.query(sqlTaskName, (err,result)=> {
      if(err){
        console.log('ERROR RETRIEVING TASKNAME' + err);
      } else {
            console.log(taskid)
            res.render('update_requests', {
            task: result.rows
            });
        }
    });  
  });
  
  router.post("/updateRequests/:taskid",ensureAuthenticated, (req, res) => {
    req.checkBody("newDescription", "description is required").notEmpty();
    req.checkBody("newDuration", "duration is required").notEmpty();
    req.checkBody("newManpower", "manpower is required").notEmpty();
    req.checkBody("newTaskDateTime", "taskDateTime is required").notEmpty();
    var taskid = req.params.taskid;
  
    let error = req.validationErrors();
      const params = [req.body.newDescription,req.body.newDuration,req.body.newManpower,req.body.newTaskDateTime, taskid];
      var sql = "UPDATE createdTasks SET description = $1, duration = $2, manpower = $3, taskDateTime = $4 WHERE taskid = $5";
  
      pool.query(sql, params,(err, result) =>{
        if(err){
          console.log(err + " ERROR UPDATING TASKS");
        } else {
          //delete assigned 
          sqlDeleteAssigned = "DELETE FROM assigned WHERE taskid = " + taskid
          pool.query(sqlDeleteAssigned, (err,data)=>{
            if(err){
              console.log(err + "ERROR DELETE ASSIGNED");
            } 
          });
          
          //update Requests -> change Accept to false 
          var sqlupdateRequests = "UPDATE requests SET accepted = false WHERE taskid = " + taskid
          pool.query(sqlupdateRequests, (err,data)=>{
            if(err){
              console.log(err + "ERROR UPDATING REQUESTS");
            } 
          });
          //send request to tasker again 

          res.redirect('/taskRequesters/viewRequests');

        }
      });
    
  });
  
  router.get("/deleteRequests/:taskid", ensureAuthenticated,(req, res) => {
    var taskid = parseInt(req.params.taskid);

    sqlDeleteCreatedTask = "DELETE FROM createdTasks WHERE taskid = " + taskid
   
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

//View all biddings for a task
router.get('/viewBids/:taskid', ensureAuthenticated, function (req, res) {
    pool.query("SELECT t3.name,t3.avg,t3.completedTasks,t1.cusid,t1.bidprice,t1.winningbid,t2.taskname,t1.taskid FROM bids as t1 INNER JOIN createdtasks as t2 on t1.taskid=t2.taskid INNER JOIN (SELECT t11.cusid, t11.name, COUNT(t22.*) as completedTasks, AVG(t33.rating) FROM Customers as t11 LEFT JOIN assigned as t22 ON t11.cusid=t22.cusid AND t22.completed=true LEFT JOIN reviews as t33 ON t11.cusid=t33.cusid GROUP BY t11.cusid) as t3 ON t1.cusid = t3.cusid WHERE t2.cusid=$1 and t2.taskid=$2;",[req.user.cusId,parseInt(req.params.taskid)])
    .then((result) => {
      res.render("view_tr_bids",{bids: result.rows})
    })
    .catch((error) => {
      req.flash("warning",'Encountered an error: ' + error);
      res.render("view_tr_bids");
    });
});

//View tasker profile before accepting bid
router.get("/viewBids/accept_bid/taskid/:taskid/tasker/:tasker_id",ensureAuthenticated, (req, res) => {

    return Promise.all([
        pool.query("SELECT t1.bidprice, t2.name,AVG(t3.rating) as rating,COUNT(t4.*) as count,t5.taskname FROM bids as t1 INNER JOIN customers as t2 ON t2.cusid=$2 LEFT JOIN reviews as t3 ON t3.cusid=$2 LEFT JOIN assigned as t4 ON t4.cusid=$2 AND t4.completed=true INNER JOIN createdtasks as t5 ON t5.taskid=$1 WHERE t1.taskid=$1 AND t1.cusid=$2 GROUP BY t2.name, t5.taskname, t1.bidprice;",[req.params.taskid,req.params.tasker_id]),
        pool.query("SELECT t3.description FROM requires as t1 INNER JOIN belongs as t2 ON t1.catid=t2.catid INNER JOIN addedpersonalskills as t3 ON t2.ssid=t3.ssid AND t3.cusid=$2 WHERE taskid=$1;",[req.params.taskid, req.params.tasker_id]),
        pool.query("SELECT t1.rating,t1.description,t3.name FROM reviews as t1 INNER JOIN createdtasks as t2 ON t2.taskid=$1 INNER JOIN customers as t3 ON t2.cusid=t3.cusid WHERE t1.cusid=$2",[req.params.taskid, req.params.tasker_id])
      ])
    .then(([result,result2,result3]) => {
      if(result.rows.length == 0 || result2.rows.length == 0){
        req.flash("warning",'Encountered an error. Please try again.');
        res.redirect("/taskRequesters/my_bids/");
      }
      res.render("tr_accept_bid",{tasker_info: result.rows[0], tasker_skills: result2.rows, tasker_reviews: result3.rows});
    })
    .catch((error) => {
      req.flash("warning",'Encountered an error: ' + error);
      res.redirect("/taskRequesters/my_bids/");
    });
  });
  
  //Select winning bid
  router.get("/viewBids/accept_bid/taskid/:taskid/tasker/:tasker_id/accept",ensureAuthenticated, (req, res) => {
  
    return Promise.all([
        pool.query("UPDATE bids SET winningbid=true WHERE cusid=$2 AND taskid=$1;",[req.params.taskid,req.params.tasker_id]),
        pool.query("INSERT INTO Assigned(taskid,cusid,completed) VALUES($1,$2,false);",[req.params.taskid,req.params.tasker_id]),
        pool.query("SELECT t1.*, t2.bidprice,t3.name FROM createdtasks as t1 INNER JOIN bids as t2 on t1.taskid=t2.taskid INNER JOIN customers as t3 on t2.cusid=t3.cusid WHERE t2.taskid=$1 AND t2.cusid=$2;",[req.params.taskid, req.params.tasker_id])
      ])
    .then(([result,result2,result3]) => {
      res.render("tr_accepted_bid",{result: result3.rows[0]});
    })
    .catch((error) => {
      req.flash("warning",'Encountered an error: ' + error);
      res.redirect("/taskRequesters/my_bids/");
    });
  });

module.exports = router;