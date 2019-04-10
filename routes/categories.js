const express = require("express");
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');

//Add route
router.get("/add", function(req, res) {
  res.render("add_category");
});

router.post("/add", (req, res) => {
  req.checkBody("catName", "Category Name is required").notEmpty();
  let errors = req.validationErrors();
  if (errors) {
    res.render('add_category');
    console.log(errors);

  } else {
    const sql = "INSERT INTO skillCategories (catName) VALUES ($1)";
    const params = [req.body.catName];
    pool.query(sql, params, (error, result) => {
      if (error) {
        console.log("err: ", error);
      }
      console.log("result?", result);
      res.redirect("/");
    });
  }
});

router.get('/', ensureAuthenticated, function (req, res) {
  const sql = 'SELECT * FROM SkillCategories';
  pool.query(sql, (error, result) => {

    if (error) {
      console.log('err: ', error);
    } else {
    res.render('view_categories', {
      categories: result.rows,
      
      })
    }
        
  });
});

router.post('/delete/:id', ensureAuthenticated, function (req, res) {
  const sql =  "DELETE FROM SkillCategories WHERE catId = " + parseInt(req.params.id);
  pool.query(sql, (error, result) => {

    if (error) {
      console.log('err: ', error);
      res.redirect("/categories");
    } else {
      res.redirect('/categories');
      
      
    }
        
  });
});




module.exports = router;
