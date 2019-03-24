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
  //Retrieve all tasks and send along with render
  var cusId = parseInt(req.user.cusId)
  const param1 = [cusId];
  //console.log(cusId);
  const sql1 = "SELECT * FROM customers WHERE cusid = $1"
  pool.query(sql1,param1, (err, result1) => {
    if(err){
      console.log("ERROR RETRIEVING Customer");
    } else {
      res.render('taskerProfile',{cusInfo: result1.rows});
    }

  });
  
});

router.get("/taskerSettings", (req, res) => {
  //var cusNum = parseInt(req.user.cusId);
  var cusDetails = [];
  var skills = [];
  
  var paramCus = [parseInt(req.user.cusId)]
  var sqlCus = "SELECT * FROM customers WHERE cusid = $1";

  pool.query(sqlCus,paramCus, (err,data) =>{
    if(err) {
      throw err;
    } else {
      cusDetails = data.rows;
      //console.log(cusDetails);
      //res.render('taskerSettings', {});

      var paramSkill = [parseInt(req.user.cusId)]
      var sqlSkill = 
      "SELECT s.ssid, s.description, c.catname FROM addedpersonalskills s INNER JOIN belongs b ON s.ssid = b.ssid INNER JOIN skillcategories c ON b.catid = c.catid WHERE cusid=$1";

      pool.query(sqlSkill,paramSkill, (err,data) =>{
        if(err) {
          throw err;
        } else {
          skills = data.rows;
          //console.log(skills);
          res.render('taskerSettings',{allSkills: skills, cusInfo: cusDetails});
        }
      });
    }
  });

});

router.get("/viewRequests", (req, res) => {
  const user = req.user.cusId;
  

  const sql = "SELECT * FROM requests r INNER JOIN createdtasks t ON r.taskid = t.taskid WHERE accepted = false AND r.cusid = $1";
  const param =[user];

  pool.query(sql,param,(err,result)=>{
    if(err) {
      throw err;
    } else if (result.rows.length != 0) {
      res.render('pendingRequests', {requests: result.rows});
    } else {
      console.log("THERE ARE NO PENDING REQUESTS!");
      res.redirect('/taskers')
    }

  });
});

router.get("/acceptRequest/:taskid", (req, res) => {
  const user = req.user.cusId;
  const taskId = req.params.taskid;
  const sql = "UPDATE requests SET accepted = true WHERE taskid = $1 AND cusid = $2";
  const param=[taskId, user];

  pool.query(sql,param, (err,result)=>{
    if(err) {
      console.log("ERROR UPDATING REQUEST TO ACCEPT" + err);
    } else {
      const sqlAssign = "INSERT INTO assigned(taskid,cusid,completed) VALUES ($1,$2,false)";
      const paramAssign = [taskId,user];
      pool.query(sqlAssign,paramAssign, (err,result)=>{
        if(err) {
          console.log("ERROR ASSIGNING TASK" + err);
        } else {
          res.redirect('/taskers/viewMyPendingTasks');
        }
      });
    }   
  });
  
});
router.get("/rejectRequest/:taskid", (req, res) => {
  var taskId = req.params.taskid;
  var user = req.user.cusId;

  const sql = "DELETE FROM requests WHERE cusid = $1 AND taskid =$2"
  const param = [user,taskId];

  pool.query(sql,param,(err,data)=>{
    if(err) {
      console.log("ERROR DELETING REQUEST " + err);
    } else {
      res.redirect('/taskers/viewRequests');
    }
  });




});

router.get("/addSkill", (req, res) => {

  const sql ="SELECT * FROM skillcategories";
  pool.query(sql, (err,data) =>{
    if(err) {
      console.log("error in sql query");
    } else {
      res.render("addSkill", {data: data.rows});
    }
  });
});

router.post("/addSkill", (req, res) => {

  req.checkBody("description", "description is required").notEmpty();
  req.checkBody("rate", "rate is required").notEmpty();
  req.checkBody("catName", "Category Name is required").notEmpty();
  var cusId = parseInt(req.user.cusId);

  let error = req.validationErrors();
  if(error){
    console.log("PARAMETERS ERROR!");
  }

  const paramSkill = [cusId, req.body.description, req.body.rate];
  const sqlAddSkill = "INSERT INTO AddedPersonalSkills(cusId,description,ratePerHour) VALUES($1,$2,$3) RETURNING ssid";
  pool.query(sqlAddSkill, paramSkill, (err,data) => {
    if(err){
      console.log("Error inserting skill" + err);
    } else {
      var skillId = data.rows[0].ssid;

      const paramCatName = [req.body.catName];
      // console.log("category name:" + paramCatName);
      var sqlCat = "SELECT * FROM skillcategories WHERE catname = $1";
  
      pool.query(sqlCat,paramCatName, (err,result) =>{
        if(err){
          console.log("ERROR RETRIEVING CATEGORY ID" + err);
        } else {
          var paramBelongs = [result.rows[0].catid, skillId];
          var sqlBelongs = "INSERT INTO belongs(catid,ssid) VALUES ($1,$2)";
          pool.query(sqlBelongs,paramBelongs);
          res.redirect("/taskers/taskerSettings");
          }
        });
      }
    });
    
  });

router.get("/updateSkill/:ssid", (req, res) => {
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

router.post("/updateSkill/:ssid", (req, res) => {
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

router.get("/deleteSkill/:ssid", (req, res) => {
  //var cusId = parseInt(req.user.cusId);
  var ssId = parseInt(req.params.ssid);
 // console.log(ssId);
  //console.log(cusId);

  sqlDeleteSkill = "DELETE FROM addedpersonalskills WHERE ssid = " + ssId; 
  sqlDeleteCat = "DELETE FROM belongs WHERE ssid = " + ssId; 

  pool.query(sqlDeleteCat,(err,result)=> {
    if(err){
      console.log("Unable to delete Category record" + err);
    } else { 
      pool.query(sqlDeleteSkill);
      res.redirect("/taskers/taskerSettings");
    }
  });
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

//View all My bids placed
router.get('/viewMyBids', ensureAuthenticated, function (req, res) {
  const sql = 'SELECT B.taskId, C.taskName, B.bidPrice, L.biddingDeadline FROM CreatedTasks C join (Listings L join Bids B on (L.taskId = B.taskId)) on (C.taskId = L.taskId AND B.cusId = $1)'
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

//When viewing tasker reviews before choosing tasker for task
router.get("/taskerProfileAndReviews/:taskerId", async (req, res) => {
  
  const params = [req.params.taskerId]; 
  const sql = "SELECT CU.name, (SELECT avg(rating) FROM Reviews WHERE cusId=$1) AS taskerRating, "+
  "C.catName as catName, RV.rating, RV.description FROM Reviews RV join Requires R on RV.taskId=R.taskId"+
  " join SkillCategories C on R.catId=C.catId join Customers CU on RV.cusId=CU.cusId WHERE RV.cusId=$1"

  var result = await pool.query(sql, params);
  console.log(result);

  res.render("viewTaskerProfileAndReviews", {
    reviews: result.rows

  });

});

//Get taskers by category
router.get("/taskersByCategory/:catId", async (req, res) => {
  
  const params = [req.params.catId]; 
  const sql = "with countCatTasks as (select a.cusid, count(r.catid) as num from assigned a join requires r on a.taskid=r.taskid where a.completed=true group by a.cusid, r.catid)"+ 
  " SELECT T.name, (SELECT avg(rating) FROM Reviews WHERE cusId=T.cusId) AS taskerRating, c.num, S.ratePerHour, S.description "+
  "FROM Customers T join AddedPersonalSkills S on T.cusId=S.cusId join Belongs B on S.ssid=B.ssId left join countCatTasks c on c.cusid=T.cusid WHERE B.catid=$1 order by ratePerHour desc;"
  var result = await pool.query(sql, params);
  console.log(result);

  const sql2 = "SELECT catname from skillcategories where catid=$1;"
  var result2 = await pool.query(sql2, params);
  res.render("taskersByCategory", {
    taskers: result.rows,
    catName: result2.rows[0].catname
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
