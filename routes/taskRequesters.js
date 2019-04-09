const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');

//VIEW ALL OF MY BIDS
router.get("/my_bids", ensureAuthenticated, (req, res) => {
  pool.query("SELECT t3.name,t3.avg,t3.completedTasks,t1.cusid,t1.bidprice,t1.winningbid,t2.taskname,t1.taskid, t2.deadline FROM bids as t1 INNER JOIN createdtasks as t2 on t1.taskid=t2.taskid INNER JOIN (SELECT t11.cusid, t11.name, COUNT(t22.*) as completedTasks, AVG(t33.rating) FROM Customers as t11 LEFT JOIN assigned as t22 ON t11.cusid=t22.cusid AND t22.completed=true LEFT JOIN reviews as t33 ON t11.cusid=t33.cusid GROUP BY t11.cusid) as t3 ON t1.cusid = t3.cusid WHERE t2.cusid=$1;", [req.user.cusId])
    .then((result) => {
      res.render("view_tr_bids", { bids: result.rows })
    })
    .catch((error) => {
      req.flash("warning", 'Encountered an error: ' + error);
      res.render("view_tr_bids");
    });
});
//VIEW TASKER PROFILE BEFORE ACCEPTING BID
router.get("/my_bids/accept_bid/taskid/:taskid/tasker/:tasker_id", ensureAuthenticated, (req, res) => {

  return Promise.all([
    pool.query("SELECT t1.bidprice, t2.name,AVG(t3.rating) as rating,COUNT(t4.*) as count,t5.taskname FROM bids as t1 INNER JOIN customers as t2 ON t2.cusid=$2 LEFT JOIN reviews as t3 ON t3.cusid=$2 LEFT JOIN assigned as t4 ON t4.cusid=$2 AND t4.completed=true INNER JOIN createdtasks as t5 ON t5.taskid=$1 WHERE t1.taskid=$1 AND t1.cusid=$2 GROUP BY t2.name, t5.taskname, t1.bidprice;", [req.params.taskid, req.params.tasker_id]),
    pool.query("SELECT t3.description FROM requires as t1 INNER JOIN belongs as t2 ON t1.catid=t2.catid INNER JOIN addedpersonalskills as t3 ON t2.ssid=t3.ssid AND t3.cusid=$2 WHERE taskid=$1;", [req.params.taskid, req.params.tasker_id]),
    pool.query("SELECT t1.rating,t1.description,t3.name FROM reviews as t1 INNER JOIN createdtasks as t2 ON t2.taskid=$1 INNER JOIN customers as t3 ON t2.cusid=t3.cusid WHERE t1.cusid=$2", [req.params.taskid, req.params.tasker_id])
  ])
    .then(([result, result2, result3]) => {
      if (result.rows.length == 0 || result2.rows.length == 0) {
        req.flash("warning", 'Encountered an error. Please try again.');
        res.redirect("/taskRequesters/my_bids/");
      }
      res.render("tr_accept_bid", { tasker_info: result.rows[0], tasker_skills: result2.rows, tasker_reviews: result3.rows });
    })
    .catch((error) => {
      req.flash("warning", 'Encountered an error: ' + error);
      res.redirect("/taskRequesters/my_bids/");
    });
});

//SELECT WINNING BID
router.get("/my_bids/accept_bid/taskid/:taskid/tasker/:tasker_id/accept", ensureAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await client.query("INSERT INTO Assigned(taskid,cusid,completed) VALUES($1,$2,false);", [req.params.taskid, req.params.tasker_id]);
    await client.query("UPDATE Bids SET winningbid = true WHERE taskid=$1 AND cusid=$2;", [req.params.taskid, req.params.tasker_id]),
    await client.query("UPDATE Listings SET hasChosenBid = true WHERE taskid = $1;", [req.params.taskid]),
    result = await client.query("SELECT t1.*, t2.bidprice,t3.name FROM createdtasks as t1 INNER JOIN bids as t2 on t1.taskid=t2.taskid INNER JOIN customers as t3 on t2.cusid=t3.cusid WHERE t2.taskid=$1 AND t2.cusid=$2;", [req.params.taskid, req.params.tasker_id])
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.message == 'ONLY ONE WINNING BID ALLOWED!'){
      req.flash('danger', 'You have already chosen a winning bid!');
      res.redirect('/taskRequesters/my_bids');
    }
    throw e;
  } finally {
    res.render("tr_accepted_bid", { result: result.rows[0] });
  }

});

router.get("/write_review/:taskid/tasker/:tasker_id", ensureAuthenticated, (req, res) => {
  pool.query("SELECT * FROM reviews as t1 WHERE t1.taskid=$1 AND t1.cusid=$2;", [req.params.taskid, req.params.tasker_id])
    .then((result) => {
      if (result.rows.length > 0) {
        req.flash("warning", 'Review has already been submitted for this task and this tasker.');
        res.redirect('/');
      }
    })
  pool.query("SELECT * FROM createdtasks as t1 INNER JOIN assigned as t2 ON t1.taskid=t2.taskid INNER JOIN customers as t3 ON t2.cusid=t3.cusid WHERE t1.taskid=$1 AND t2.cusid=$2;", [req.params.taskid, req.params.tasker_id])
    .then((result) => {
      res.render("tr_write_review", { result: result.rows[0] })
    })
    .catch((error) => {
      req.flash("warning", 'Encountered an error: ' + error);
      res.redirect("back");
    });
});

router.post("/write_review/:taskid/tasker/:tasker_id", ensureAuthenticated, (req, res) => {
  pool.query("INSERT INTO reviews(rating, description, taskid, cusid) VALUES($1,$2,$3,$4);", [req.body.rating, req.body.review, req.params.taskid, req.params.tasker_id])
    .then((result) => {
      req.flash("success", 'Review submitted! Thank You for your review! <i class="far fa-smile-wink"></i>')
      res.redirect("/");
    })
    .catch((error) => {
      req.flash("warning", 'Encountered an error: ' + error);
      res.redirect("back");
    });
});

//PROFILE
router.get("/", ensureAuthenticated, (req, res) => {  
    
  return Promise.all([
    pool.query("SELECT * FROM customers WHERE cusid = $1", [req.user.cusId]),
    pool.query("select count(*) as num from createdtasks t join customers c on t.cusid=c.cusid where t.cusid=$1", [req.user.cusId])

  ]).then(([profileresults, countTasks]) => {
      res.render('taskReqProfile', { 
        cusInfo: profileresults.rows,
        num: countTasks.rows[0].num
      });
    })
    .catch((error) => {
      req.flash("warning", 'Encountered an error viewing taskreq profile: ' + error);
      res.redirect("/home");
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

router.get("/addListings", ensureAuthenticated, async function (req, res) {

  try {
    var categories = await pool.query("SELECT * FROM skillcategories");
    
    console.log(categories)
    res.render("add_Listings", { categories: categories.rows });
    
  } catch (error) {
    console.log(error)
  }

});

router.post("/addListings", ensureAuthenticated, async function (req, res) {
  req.checkBody("catid", "Category is required").notEmpty();
  req.checkBody("taskName", "Task Name is required").notEmpty();
  req.checkBody("description", "Description is required").notEmpty();
  req.checkBody("taskstartdatetime", "taskstartdatetime is required").notEmpty();
  req.checkBody("taskenddatetime", "taskenddatetime is required").notEmpty();
  req.checkBody("deadline", "Deadline is required").notEmpty();
  req.checkBody("startingBid", "Starting bid is required").notEmpty();
  
  let errors = req.validationErrors();
  if (errors) {
    for (var i = 0; i < errors.length; i++) {
      if(errors[i].msg == 'Category is required') {
        req.flash('danger', 'Category is required' );
        res.redirect('/addListings');
        return;
    
      }
      else if (errors[i].msg == 'Starting bid is required'){
        req.flash('danger', 'Starting bid is required');
        res.redirect('/addListings');
        return;
      }
      else if(errors[i].msg == 'Task Name is required') {
        req.flash('danger', 'Task Name is required' );
        res.redirect('/addListings');
        return;
    
      }
      else if (errors[i].msg == 'Description is required'){
        req.flash('danger', 'Description is required' );
        res.redirect('/addListings');
        return;
      }
      else if (errors[i].msg == 'taskstartdatetime is required'){
        req.flash('danger', 'Task Start Date / Time is required');
        res.redirect('/addListings');
        return;
      }
      else if (errors[i].msg == 'taskenddatetime is required'){
        req.flash('danger', 'Task End Date / time is required');
        res.redirect('/addListings');
        return;
      }
      else if (errors[i].msg == 'Deadline is required'){
        req.flash('danger', 'Deadline is required');
        res.redirect('/addListings');
        return;
      }
      else{
      console.log(errors[i].msg);
      }
    }
  } else {

    const userID = parseInt(req.user.cusId)

    const sqlinserttask = "INSERT INTO createdTasks (taskname, description, taskstartdatetime, taskenddatetime, dateCreated, cusId, deadline) VALUES ($1, $2, $3, $4,now(), $5, $6) RETURNING taskid;"
    const params1 = [req.body.taskName, req.body.description, req.body.taskstartdatetime, req.body.taskenddatetime, userID, req.body.deadline]
    await pool.query("BEGIN")
    await pool.query(sqlinserttask, params1)
      .then((results) => {
        var paramRequires = [results.rows[0].taskid, req.body.catid];
        // for now i just hard insert the catid until the category is implemented
        var sqlRequires = "INSERT INTO Requires(catid,taskid) VALUES ($2,$1) RETURNING taskid";
        return pool.query(sqlRequires, paramRequires);
      })
      .then((results) => {
        const sqlListings = "INSERT INTO Listings (startingBid, taskId, hasChosenBid) VALUES ($1, $2, false) RETURNING taskid"
        const paramsListings = [req.body.startingBid, results.rows[0].taskid]
        return pool.query(sqlListings, paramsListings);
      })
      .then((results) => {
        var taskid = [results.rows[0].taskid];
        var sqlNewTask = "SELECT T.taskname, T.description, T.taskstartdatetime, T.taskenddatetime, T.deadline FROM createdtasks T join Listings L on T.taskid = L.taskid WHERE L.taskid=$1;"
        return pool.query(sqlNewTask, taskid);
      })

      .then((results) => {
        console.log(results)
        pool.query("COMMIT")
        res.render('newListingCreated',
          {
            taskname: results.rows[0].taskname,
            description: results.rows[0].description,
            taskstartdatetime: results.rows[0].taskstartdatetime,
            taskenddatetime: results.rows[0].taskenddatetime,
            deadline: results.rows[0].deadline,
          });
      })
      .catch((error) => {
        pool.query("ROLLBACK")
        if(error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check4"') {
          req.flash('danger', 'Task End Date / Time must be at least 1 hour after Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check3"'){
          req.flash('danger', 'Task End Date / Time must be on the same day as Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check2"'){
          req.flash('danger', 'Deadline must be before Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check1"'){
          req.flash('danger', 'Deadline must be later than the current Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check"'){
          req.flash('danger', 'Task Start Date / Time must be later than the current date' );
        }
        else if (error.message == 'SPAMMING'){
          req.flash('danger', 'You are not allowed to create more than 10 requests/listings (combined) in 3 days' );
        } 
        else {
          console.log(error.message)
          req.flash("warning", "An error was encountered. Please try again.");
        }
        res.redirect('/addListings');
      })
  }

});


router.get("/addRequests", ensureAuthenticated, async function (req, res) {
  var taskersByCategory = [];
  var greatValueTaskersList = [];
  var categoryResult = [];

  try {
    categoryResult = await pool.query("SELECT * FROM skillcategories");
    for (x = 0; x < categoryResult.rows.length; x++) {
      var taskersQuery = "with countCatTasks as (select a.cusid, count(r.catid) as num from assigned a join requires r on a.taskid=r.taskid where a.completed=true group by a.cusid, r.catid)" +
        " SELECT DISTINCT T.name, T.cusId, (SELECT avg(rating) FROM Reviews WHERE cusId=T.cusId) AS taskerRating, c.num, S.ratePerHour, S.name as ssname, S.description, S.ssid " +
        "FROM Customers T join AddedPersonalSkills S on T.cusId=S.cusId join Belongs B on S.ssid=B.ssId left join countCatTasks c on c.cusid=T.cusid WHERE B.catid=" + [categoryResult.rows[x].catid] + " order by ratePerHour desc;"
      var numTasksQuery = "select count(*) as num from belongs where catid=" + [categoryResult.rows[x].catid] + ";";
      const greatValueTaskersQuery = "WITH TaskerRating AS (SELECT cusId, avg(rating) AS tr FROM Reviews GROUP BY cusId) SELECT S.cusId, S.ssId FROM AddedPersonalSkills S JOIN TaskerRating T ON S.cusId=T.cusId JOIN Belongs B ON S.ssId=B.ssId WHERE tr>=4 and B.catid=" + [categoryResult.rows[x].catid] + " order by ratePerHour desc limit 9/4;"

      var tmp = await pool.query(taskersQuery);
      taskersByCategory.push(tmp.rows);
      var tmp2 = await pool.query(numTasksQuery);
      var tmp3 = await pool.query(greatValueTaskersQuery);
      greatValueTaskersList.push(tmp3.rows);
    }
    const eliteTaskersQuery = "WITH TaskerRating AS (SELECT cusId, avg(rating) AS tr FROM Reviews GROUP BY cusId) SELECT cusId FROM TaskerRating R WHERE 1<=(SELECT count(*) FROM Assigned A WHERE R.cusId=A.cusId AND completed=TRUE) AND tr>=4.0;";
    eliteTaskerResult = await pool.query(eliteTaskersQuery)
    console.log(eliteTaskerResult.rows)
    console.log(greatValueTaskersList)

    res.render("select_tasker", {
      categories: categoryResult.rows,
      taskersByCategory: taskersByCategory,
      eliteList: eliteTaskerResult.rows,
      greatValueList: greatValueTaskersList
    });

  } catch (error) {
    console.log(error)
  }
});

router.post("/addRequests", async function (req, res) {
  req.checkBody("taskName", "Task Name is required").notEmpty();
  req.checkBody("description", "Description is required").notEmpty();
  req.checkBody("taskstartdatetime", "taskstartdatetime is required").notEmpty();
  req.checkBody("taskenddatetime", "taskenddatetime is required").notEmpty();
  req.checkBody("deadline", "deadline is required").notEmpty();

  let errors = req.validationErrors();
  if (errors) {
    for (var i = 0; i < errors.length; i++) {
      if(errors[i].msg == 'Task Name is required') {
        req.flash('danger', 'Task Name is required' );
        res.redirect('/addListings');
        return;
    
      }
      else if (errors[i].msg == 'Description is required'){
        req.flash('danger', 'Description is required' );
        res.redirect('/addListings');
        return;
      }
      else if (errors[i].msg == 'taskstartdatetime is required'){
        req.flash('danger', 'Task Start Date / Time is required');
        res.redirect('/addListings');
        return;
      }
      else if (errors[i].msg == 'taskenddatetime is required'){
        req.flash('danger', 'Task End Date / time is required');
        res.redirect('/addListings');
        return;
      }
      else if (errors[i].msg == 'Deadline is required'){
        req.flash('danger', 'Deadline is required');
        res.redirect('/addListings');
        return;
      }
       else{
      console.log(errors[i].msg);
      }
    }
  } else {

    const userID = parseInt(req.user.cusId)
    const TDT = req.body.taskDateTime

    const sqlinserttask = "INSERT INTO createdTasks (taskname, description, taskstartdatetime, taskenddatetime, dateCreated, cusId, deadline) VALUES ($1, $2, $3, $4,now(), $5, $6) RETURNING taskid;"
    const params1 = [req.body.taskName, req.body.description, req.body.taskstartdatetime, req.body.taskenddatetime, userID, req.body.deadline]
    await pool.query("BEGIN")
    await pool.query(sqlinserttask, params1)
      .then((results) => {
        var paramRequires = [req.body.catid, results.rows[0].taskid];

        var sqlRequires = "INSERT INTO Requires(catid,taskid) VALUES ($1,$2) RETURNING taskid";
        return pool.query(sqlRequires, paramRequires);
      })
      .then((results) => {
        var paramRequests = [results.rows[0].taskid, req.body.taskerid];
        var sqlRequests = "INSERT INTO Requests(taskid, cusid, hasResponded) VALUES ($1, $2, false) RETURNING taskid;"
        return pool.query(sqlRequests, paramRequests);
      })

      .then((results) => {
        var taskid = [results.rows[0].taskid];
        var sqlNewTask = "SELECT T.taskname, T.description, T.taskstartdatetime, T.taskenddatetime, C.name FROM createdtasks T join Requests R on T.taskid= R.taskid join customers C on R.cusid=C.cusid WHERE R.taskid=$1;"
        return pool.query(sqlNewTask, taskid);
      })
      .then((results) => {
        console.log(results)
        pool.query("COMMIT")
        res.render('newTaskCreated',
          {
            taskname: results.rows[0].taskname,
            description: results.rows[0].description,
            taskstartdatetime: results.rows[0].taskstartdatetime,
            taskenddatetime: results.rows[0].taskenddatetime,
            tasker: results.rows[0].name
          });
      })
      .catch((error) => {
        pool.query("ROLLBACK")
        if(error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check4"') {
          req.flash('danger', 'Task End Date / Time must be at least 1 hour after Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check3"'){
          req.flash('danger', 'Task End Date / Time must be on the same day as Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check2"'){
          req.flash('danger', 'Deadline must be before Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check1"'){
          req.flash('danger', 'Deadline must be later than the current Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check"'){
          req.flash('danger', 'Task Start Date / Time must be later than the current date' );
        }
        else if (error.message == 'SPAMMING'){
          req.flash('danger', 'You are not allowed to create more than 10 requests/listings (combined) in 3 days' );
        } else {
          req.flash("warning", "An error was encountered. Please try again.");
        }
        res.redirect('/addRequests');
      })

  }
});


router.get("/addRequests/:category/:ssid/:tasker_id", ensureAuthenticated, async function (req, res) {


  var catId = req.params.category;
  var ssId = req.params.ssid;
  var taskerId = req.params.tasker_id;


  return Promise.all([
    pool.query("with countCatTasks as (select a.cusid, count(r.catid) as num from assigned a join requires r on a.taskid=r.taskid where a.completed=true group by a.cusid, r.catid) " +
      "SELECT T.name, T.cusid, (SELECT avg(rating) FROM Reviews WHERE cusId=T.cusId) AS taskerRating, c.num, S.ratePerHour, S.description " +
      "FROM Customers T join AddedPersonalSkills S on T.cusId=S.cusId join Belongs B on S.ssid=B.ssId left join countCatTasks c on c.cusid=T.cusid WHERE B.catid=" + catId + " and S.ssid=" + ssId + " and T.cusid=" + taskerId + ";"),
    pool.query("SELECT C.catName as catName, RV.rating, RV.description, RV.taskId, CU1.name FROM Reviews RV join Requires R on RV.taskId=R.taskId " +
      "join SkillCategories C on R.catId=C.catId join Customers CU on RV.cusId=CU.cusId join CreatedTasks T on RV.taskid=T.taskid join Customers CU1 on CU1.cusid=T.cusid WHERE CU.cusid=" + taskerId + ";"),
    pool.query("SELECT catname from skillcategories where catid=" + catId + ";"),

  ])
    .then(([profileresults, reviewsresults, category]) => {
      
      res.render("viewTaskerProfileAndReviews", {
        profile: profileresults.rows,
        reviews: reviewsresults.rows,
        catName: category.rows[0].catname,
        catId,
        
      });
    })
    .catch((error) => {
      req.flash("warning", 'Encountered an error viewing particular tasker: ' + error);
      res.redirect("/taskRequesters/addRequests");
    });
});


router.get("/newTask/:catId/:taskerId", ensureAuthenticated, (req, res) => {

  var catId = req.params.catId;
  var taskerId = req.params.taskerId;
  const sqlcat = "SELECT catname, catId FROM skillcategories where catId=" + catId + ";"

  pool.query(sqlcat, (err, result) => {
    if (err) {
      console.log("error in sqlcat query");
    } else {
      const sqltasker = "SELECT name, cusId FROM customers where cusId=" + taskerId + ";"
      pool.query(sqltasker, (err, result1) => {
        if (err) {
          console.log("error in sqltasker query");
        } else {
          res.render("add_Requests", { cat: result.rows, tasker: result1.rows });
        }
      })
    }
  })
});

router.get("/viewListings", (req, res) => {
  console.log("here")
  const sql = "SELECT C.taskid as taskid, taskname, description, taskStartDateTime, taskEndDateTime, datecreated, deadline, hasCancelled, L.hasChosenBid as haschosenbid, A.completed as completed FROM (createdtasks C inner join Listings L on C.taskid = L.taskid) left outer join assigned A on C.taskid = A.taskid WHERE C.cusid = $1;"
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

  pool.query(sqlTaskName, (err, result) => {
    if (err) {
      console.log('ERROR RETRIEVING TASKNAME' + err);
    } else {
      console.log(taskid)
      res.render('update_listings', {
        task: result.rows
      });
    }
  });
});

router.post("/updateListings/:taskid", ensureAuthenticated, (req, res) => {
  req.checkBody("newDescription", "Description is required").notEmpty();
  req.checkBody("newTaskStartDateTime", "taskstartdatetime is required").notEmpty();
  req.checkBody("newTaskEndDateTime", "taskenddateTime is required").notEmpty();
  req.checkBody("newDeadline", "Deadline is required").notEmpty();
  var taskid = req.params.taskid;
  let errors = req.validationErrors();
  if (errors) {
    for (var i = 0; i < errors.length; i++) {
     if (errors[i].msg == 'Description is required'){
        req.flash('danger', 'Description is required' );
        res.redirect('/updateListings');
        return;
      }
      else if (errors[i].msg == 'taskstartdatetime is required'){
        req.flash('danger', 'Task Start Date / Time is required');
        res.redirect('/updateListings');
        return;
      }
      else if (errors[i].msg == 'taskenddatetime is required'){
        req.flash('danger', 'Task End Date / time is required');
        res.redirect('/updateListings');
        return;
      }
      else if (errors[i].msg == 'Deadline is required'){
        req.flash('danger', 'Deadline is required');
        res.redirect('/updateListings');
        return;
      }
       else{
      console.log(errors[i].msg);
      }
    }

  } else {
    //Update listing dont need to delete assigned cause once assigned, there will be no more updates allowed 
    const params1 = [req.body.newDescription, req.body.newTaskStartDateTime, req.body.newTaskEndDateTime, req.body.newDeadline, taskid];
    var sqlUpCreatedTask = "UPDATE createdTasks SET description = $1, taskstartdatetime = $2, taskenddatetime = $3, deadline = $4 WHERE taskid = $5";

    pool.query(sqlUpCreatedTask, params1, (error, result) => {
        if(error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check4"') {
          req.flash('danger', 'Task End Date / Time must be at least 1 hour after Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check3"'){
          req.flash('danger', 'Task End Date / Time must be on the same day as Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check2"'){
          req.flash('danger', 'Deadline must be before Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check1"'){
          req.flash('danger', 'Deadline must be later than the current Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check"'){
          req.flash('danger', 'Task Start Date / Time must be later than the current date' );
        }
        else {
          console.log("Error creating new task", error);
          req.flash("warning", "An error was encountered. Please try again.")
        }
        res.redirect('/updateListings');
    });
  }
});

router.get("/deleteListings/:taskid", ensureAuthenticated, async function (req, res) {
  var taskid = parseInt(req.params.taskid);

  sqlDeleteCreatedTask = "DELETE FROM createdTasks WHERE taskid = " + taskid
  sqlDeleteBids = "DELETE FROM Bids WHERE taskid = " + taskid

  await pool.query("BEGIN")
  await pool.query(sqlDeleteBids)
    .then(() => {
      return pool.query(sqlDeleteCreatedTask)
    })
    .then(() => {
      pool.query("COMMIT")
      res.redirect('/taskRequesters/viewListings');
    })
    .catch((error) => {
      pool.query("ROLLBACK")
      if (error.message == 'CANNOT DELETE 1 DAY BEFORE'){
      req.flash('danger', 'CANNOT DELETE TASK 24 HOURS BEFORE START DATE / TIME. MUST CANCEL INSTEAD!');
      res.redirect('/taskRequesters/viewListings');
      }
      else{
      req.flash("warning", "An error was encountered. Please try again.")
      res.redirect('/taskRequesters/viewListings');
      }
    })
});

//End: CRUD Listings 

//Start: CRUD Requests

router.get("/viewRequests", ensureAuthenticated, (req, res) => {


  const sqlUpdate = "UPDATE requests SET accepted = false, hasresponded = true WHERE taskid in ((select taskid from createdtasks where deadline <= CURRENT_TIMESTAMP)) and hasresponded = false;"

  pool.query(sqlUpdate, (error, result) => {

    if (error) {
      console.log('err: ', error);
    }
  });

  const sql = "SELECT C.taskid, taskname, description, taskstartdatetime, taskenddatetime, datecreated, deadline, accepted, hascancelled, R.hasResponded as hasresponded, CS.Name as taskername, completed FROM (createdtasks C inner join (customers CS natural join Requests R) on C.taskid = R.taskid) left outer join assigned A on C.taskid = A.taskid where C.cusid = $1;"
  const params = [parseInt(req.user.cusId)]

  pool.query(sql, params, (error, result) => {

    if (error) {
      console.log('err: ', error);
    }
    console.log("view")
    res.render('view_tr_requests', {
      task: result.rows,
    });
  });

});

router.get("/updateRequests/:taskid", ensureAuthenticated, (req, res) => {
  var taskid = req.params.taskid;

  var sqlTaskName = "SELECT taskname, taskid FROM createdTasks WHERE taskid = " + taskid;

  pool.query(sqlTaskName, (err, result) => {
    if (err) {
      console.log('ERROR RETRIEVING TASKNAME' + err);
    } else {
      console.log(taskid)
      res.render('update_requests', {
        task: result.rows
      });
    }
  });
});

router.post("/updateRequests/:taskid", ensureAuthenticated, async function (req, res) {
  req.checkBody("newDescription", "description is required").notEmpty();
  req.checkBody("newTaskStartDateTime", "taskstartdatetime is required").notEmpty();
  req.checkBody("newTaskEndDateTime", "taskenddatetime is required").notEmpty();
  req.checkBody("newDeadline", "deadline is required").notEmpty();
  var taskid = req.params.taskid;
  let errors = req.validationErrors();
  if (errors) {
    for (var i = 0; i < errors.length; i++) {
     if (errors[i].msg == 'description is required'){
        req.flash('danger', 'Description is required' );
        res.redirect('/updateRequests');
        return;
      }
      else if (errors[i].msg == 'taskstartdatetime is required'){
        req.flash('danger', 'Task Start Date / Time is required');
        res.redirect('/updateRequests');
        return;
      }
      else if (errors[i].msg == 'taskenddatetime is required'){
        req.flash('danger', 'Task End Date / time is required');
        res.redirect('/updateRequests');
        return;
      }
      else if (errors[i].msg == 'deadline is required'){
        req.flash('danger', 'Deadline is required');
        res.redirect('/updateRequests');
        return;
      }
       else{
      console.log(errors[i].msg);
      }
    }
  }
  else {
    const params = [req.body.newDescription, req.body.newTaskStartDateTime, req.body.newTaskEndDateTime, req.body.newDeadline, taskid];
    var sql = "UPDATE createdTasks SET description = $1, taskstartdatetime = $2, taskenddatetime = $3, deadline = $4 WHERE taskid = $5 RETURNING taskid";

    await pool.query("BEGIN")
    pool.query(sql, params)
      .then(() => {
        sqlDeleteAssigned = "DELETE FROM assigned WHERE taskid = " + taskid
        return pool.query(sqlDeleteAssigned);
      })
      .then(() => {
        var sqlupdateRequests = "UPDATE requests SET accepted = false, hasResponded = false WHERE taskid = " + taskid
        return pool.query(sqlupdateRequests);
      })
      .then(() => {
        console.log("COMMITTED")
        pool.query("COMMIT");
        res.redirect('/taskRequesters/viewRequests');
      })
      .catch((error) => {
        pool.query("ROLLBACK")
        if(error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check4"') {
          req.flash('danger', 'Task End Date / Time must be at least 1 hour after Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check3"'){
          req.flash('danger', 'Task End Date / Time must be on the same day as Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check2"'){
          req.flash('danger', 'Deadline must be before Task Start Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check1"'){
          req.flash('danger', 'Deadline must be later than the current Date / Time' );
        }
        else if (error.message == 'new row for relation "createdtasks" violates check constraint "createdtasks_check"'){
          req.flash('danger', 'Task Start Date / Time must be later than the current date' );
        }
      
        else {
          console.log("Error creating new task", error);
          req.flash("warning", "An error was encountered. Please try again.")
        }
        res.redirect('/updateRequests');
      })
    }
});

router.get("/deleteRequests/:taskid", ensureAuthenticated, (req, res) => {
  var taskid = parseInt(req.params.taskid);

  sqlDeleteCreatedTask = "DELETE FROM createdTasks WHERE taskid = " + taskid

  pool.query(sqlDeleteCreatedTask, (err, result) => {
    console.log(err)
    if (err == 'error: CANNOT DELETE 1 DAY BEFORE'){
      req.flash('danger', 'CANNOT DELETE TASK 24 HOURS BEFORE START DATE / TIME. MUST CANCEL INSTEAD!');
      res.redirect('/taskRequesters/viewRequests');
    }
    else {
      res.redirect('/taskRequesters/viewRequests');
    }
  });

});

//select Request to cancel 
router.get("/cancelRequests/:taskid", (req, res) => {
  var paramCancel = [req.params.taskid];
  var sqlCancel = "UPDATE createdTasks SET hasCancelled = true where taskid = $1";

  pool.query(sqlCancel, paramCancel, (err, result) => {
    if (err){
      console.log(err);
      res.redirect('/taskRequesters/viewRequests');
    }
    else {
      res.redirect('/taskRequesters/viewRequests');
    }
  });
});

//select Request to cancel 
router.get("/cancelListings/:taskid", (req, res) => {
  var paramCancel = [req.params.taskid];
  var sqlCancel = "UPDATE createdTasks SET hasCancelled = true where taskid = $1";
  pool.query(sqlCancel, paramCancel, (err, result) => {
    if (err){
      console.log(err);
      res.redirect('/taskRequesters/viewListings');
    }
    else {
      res.redirect('/taskRequesters/viewListings');
    }
  });
});

//select Task to complete 
router.get("/completeTasks/:taskid", (req, res) => {
  var paramComplete = [req.params.taskid];
  var sqlComplete = "UPDATE assigned SET completed = true where taskid = $1 RETURNING taskid";

  pool.query(sqlComplete, paramComplete)
    .then((results) => {
      var paramRequires = [results.rows[0].taskid];
      var sqlRequires = "select C.taskid, taskname, C.cusid as taskRid, A.cusid as taskerid from createdtasks C join assigned A on C.taskid = A.taskid where C.taskid = $1";
      return pool.query(sqlRequires, paramRequires);
    })
    .then((results) => {
      res.render('tr_write_review', {
        result: results.rows,
      });
    })
    .catch((error) => {
      console.log("Error completing a task", error);
      res.redirect('/viewRequests');
    })
  
});

//End: CRUD Requests 

router.get("/viewAllTasks", function (req, res) {
  res.render("view_tr_all_tasks");
});

//View all my completed Tasks
router.get('/viewCompletedTasks', function (req, res) {

  const params = [parseInt(req.user.cusId)]
  const sql = 'select C.taskid, C.taskname, C.description, C.taskstartdatetime, C.taskenddatetime, C.datecreated, A.cusid from CreatedTasks C join assigned A on C.taskid = A.taskid where C.cusId = $1 and A.completed = true'

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
  const sql = '	select C1.email, C.taskid, taskname, description, taskstartdatetime, taskenddatetime, datecreated from (Customers C1 join (CreatedTasks C join assigned A on C.taskid = A.taskid) on C1.cusid = A.cusid) where C.cusId = $1 and A.completed = false';
  const params = [parseInt(req.user.cusId)]

  pool.query(sql, params, (error, result) => {

    if (error) {
      console.log('err: ', error);
    }

    res.render('view_tr_pending_tasks', {
      task: result.rows,
      taskType: 'Pending'
    });

  });
});

//View all biddings for a task
router.get('/viewBids/:taskid', ensureAuthenticated, function (req, res) {
  pool.query("SELECT t3.name,t3.avg,t3.completedTasks,t1.cusid,t1.bidprice,t1.winningbid,t2.taskname,t1.taskid, t2.deadline FROM bids as t1 INNER JOIN createdtasks as t2 on t1.taskid=t2.taskid INNER JOIN (SELECT t11.cusid, t11.name, COUNT(t22.*) as completedTasks, AVG(t33.rating) FROM Customers as t11 LEFT JOIN assigned as t22 ON t11.cusid=t22.cusid AND t22.completed=true LEFT JOIN reviews as t33 ON t11.cusid=t33.cusid GROUP BY t11.cusid) as t3 ON t1.cusid = t3.cusid WHERE t2.cusid=$1 and t2.taskid=$2;", [req.user.cusId, parseInt(req.params.taskid)])
    .then((result) => {
      res.render("view_tr_bids", { bids: result.rows })
    })
    .catch((error) => {
      req.flash("warning", 'Encountered an error: ' + error);
      res.render("view_tr_bids");
    });
});



module.exports = router;