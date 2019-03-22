const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const passport = require("passport");
const bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cs2102project",
  password: "password",
  port: 5432
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

router.get("/viewListings", (req, res) => {
  res.send("Retrieve all Listings that has not expired  ");
  /* const sqlViewListings =
    "SELECT C.description, C.manpower, C.taskDateTime, C.dateCreated, T.username 
    FROM CreatedTasks C, TaskRequesters T
    WHERE taskDateTime > (SELECT NOW())
    AND C.cusId = T.cusId
    VALUES ($1, $2, $3, $4, $5)"; */
});

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

router.get("/addSkillset", (req, res) => {
  res.render("addSkill", {
    data: [
      { catName: "Plumbing" },
      { catName: "Housework" },
      { catName: "Fixing" },
      { catName: "Moving" }
    ]
  });
});

router.post("/addSkillset", (req, res) => {
  //   console.log(req.body.catName);
  //   console.log(req.body.description);
  //   console.log(req.body.rate);

  req.checkBody("description", "description is required").notEmpty();
  req.checkBody("rate", "rate is required").notEmpty();
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

  //const paramSkill = [req.body.description, req.body.rate, req.body.cusName];
  //res.redirect("/skillsets");

  /*
  var taskerId = 
  var description = 
  var rate = 

  const sqlAddSkill = 
  "INSERT INTO AddedPersonalSkills(cusId,description,ratePerHour)
    VALUES((select cusId from taskers where cusId = $1),$2,$3)""
   
    const paramSkill = [req.body.cusId, req.body.description, req.body.rate]; 
    
    pool.query(sqlAddSkill, params, (error, result) => {
      if (error) {
        console.log("err: ", error);
      })

    const paramCat = [req.body.catId, req.body.cusId]
    const sqlSetCat = 
    "INSERT INTO Belongs(catId, ssId) VALUES ($1,$2)"

    client.query(sqlSelectCat, paramCat,(err,res) => {
        
        if (shouldAbort(err)) return

        client.query('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })

    })

"; */
});

router.put("/updateSkillset", (req, res) => {
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

router.delete("/deleteSkillset", (req, res) => {
  res.send("Execute Delete SQL Statementm then redirect to /viewSkillsets");

  /*
  var taskerId = 

  const sqlDeleteSkill = 
  ”DELETE FROM AddedPersonalSkills
    WHERE ssid = taskerId“
  */
});

//View All My completed Tasks
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


});

//View all My pending Tasks
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


});

//View all My pending Tasks
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

/* */
