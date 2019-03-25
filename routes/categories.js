const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const passport = require("passport");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cs2102project",
  password: "password",
  port: 5432
});
pool.connect();

//Add route
router.get("/add", function(req, res) {
  res.render("add_category");
});

router.post("/add", (req, res) => {
  req.checkBody("catId", "Id is required").notEmpty();
  req.checkBody("catName", "Category Name is required").notEmpty();
  let errors = req.validationErrors();
  if (errors) {
    res.render('add_category');
    console.log(errors);

  } else {
    const sql = "INSERT INTO skillCategories (catId, catName) VALUES ($1, $2)";
    const params = [req.body.catId, req.body.catName];
    pool.query(sql, params, (error, result) => {
      if (error) {
        console.log("err: ", error);
      }
      //req.flash('success', 'Article Added');
      console.log("result?", result);
      res.redirect("/");
    });
  }
});

module.exports = router;
