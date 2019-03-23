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
  res.render('taskerProfile');
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
  //   console.log(req.body.catName);
  //   console.log(req.body.description);
  //   console.log(req.body.rate);

  req.checkBody("description", "description is required").notEmpty();
  req.checkBody("rate", "rate is required").notEmpty();
  req.checkBody("catName", "Category Name is required").notEmpty();
  var cusId = parseInt(req.user.cusId);
  console.log("customerID = " +cusId);

  //let error = req.validationErrors();

  const paramSkill = [cusId, req.body.description, req.body.rate];
  const sqlAddSkill = "INSERT INTO AddedPersonalSkills(cusId,description,ratePerHour) VALUES($1,$2,$3) RETURNING ssid";
  pool.query(sqlAddSkill, paramSkill, (err,data) => {
    if(err){
      console.log("Error inserting skill" + err);
    } else {
      var skillId = data.rows[0].ssid;

      const paramCatName = [req.body.catName];
      console.log("category name:" + paramCatName);
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

module.exports = router;

/* */
