const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const ensureAuthenticated = require("../config/ensureAuthenticated");

//View All Available Listings
router.get("/viewAllAvailable", ensureAuthenticated, function (req, res) {
  const sql =
    "SELECT s.catname, l.taskid,taskname, description, taskstartdatetime, taskenddatetime, datecreated, username, deadline FROM CreatedTasks C INNER JOIN Customers C1 on C.cusId = C1.cusId INNER JOIN listings l ON c.taskid = l.taskid INNER JOIN requires r ON r.taskid = C.taskid INNER JOIN skillcategories s ON s.catid = r.catid WHERE C.deadline > (SELECT NOW()) AND C.cusId <> $1 AND C.taskstartdatetime >(SELECT NOW()) AND C.taskid not in (SELECT taskid FROM assigned) AND NOT EXISTS (SELECT 1 FROM bids WHERE bids.cusId  = $1 AND bids.taskid = C.taskId) ORDER BY catname ASC;";

  const params = [parseInt(req.user.cusId)];

  pool.query(sql, params, (error, result) => {
    if (error) {
      console.log("err: ", error);
    } else {
      res.render("view_available_listings", { availableListing: result.rows });
    }
  });
});

router.get("/createNewBid/:taskId", ensureAuthenticated, (req, res) => {
  var param = [req.params.taskId];
  var sql =
    "SELECT * FROM createdtasks c INNER JOIN listings l ON c.taskid = l.taskid WHERE l.taskid = $1";
  pool.query(sql, param, (err, result) => {
    if (err) {
      console.log("UNABLE TO RETRIEVE Listing" + err);
    } else {
      if (result.rows.length == 0) {
        console.log("Task is not registered as a listing!");
        req.flash("danger", "Unable to Perform Operation!");
        res.redirect("/taskers/");
      } else {
        res.render("createNewBid", { listing: result.rows });
      }
    }
  });
});

router.post("/createNewBid/:taskId", ensureAuthenticated, (req, res) => {
  req.checkBody("bidAmt", "Amount is required").notEmpty();
  let error = req.validationErrors();
  if (error) {
    console.log(err + " NO BID AMT");
  }
  var cusId = req.user.cusId;
  var bidAmount = req.body.bidAmt;
  console.log("bid amt =" + bidAmount);
  const listingId = req.params.taskId;
  const sql =
    "INSERT INTO bids(cusid,taskid,bidprice,winningbid) VALUES ($1,$2,$3,$4)";
  const params = [cusId, listingId, bidAmount, false];

  pool.query(sql, params, (err, result) => {
    if (err) {
      if (err.message == "INVALID BID AMOUNT") {
        req.flash(
          "danger",
          "Unable to submit bid as price is above startingBid"
        );
        res.redirect("/listings/createNewBid/" + req.params.taskId);
        return;
      } else {
        console.log("UNABLE TO INSERT NEW BID RECORD " + err);
        req.flash(
          "danger",
          "An Error has Occured: Unable to insert new bid! Did you bid above the starting price?"
        );
        res.redirect("listings/createNewBid/" + listingId);
      }
    } else {
      res.redirect("/taskers/viewMyBids");
    }
  });
});

router.get("/updateBid/:taskid", ensureAuthenticated, (req, res) => {
  const taskId = req.params.taskid;
  const cusId = req.user.cusId;
  //console.log(cusId);
  const sql =
    "SELECT l.startingbid, B.taskId, C.taskName, B.bidPrice, C.deadline FROM CreatedTasks C join Bids B on C.taskId = B.taskId INNER JOIN listings l on B.taskid = l.taskid WHERE B.taskId = $1 AND B.cusId = $2";

  const params = [taskId, cusId];

  pool.query(sql, params, (err, result) => {
    if (err) {
      console.log("UNABLE TO Retreive Bid Record " + err);
    } else {
      res.render("updateBid", { bidInfo: result.rows });
    }
  });
});

router.post("/updateBid/:taskid", ensureAuthenticated, (req, res) => {
  const taskId = req.params.taskid;
  const cusId = req.user.cusId;
  const newPrice = req.body.bidAmt;

  const sql = "UPDATE bids SET bidprice = $1 WHERE cusid = $2 AND taskid = $3";
  const param = [newPrice, cusId, taskId];

  pool.query(sql, param, (err, result) => {
    if (err) {
      console.log("UNABLE TO UPDATE Bid Record " + err);
      req.flash(
        "danger",
        "An Error has Occured: Unable to insert new bid! Did you bid above the starting price?"
      );
      res.redirect("listings/updateBid/" + taskId);
    } else {
      res.redirect("/taskers/viewMyBids");
    }
  });
});

router.get("/deleteBid/:taskid", ensureAuthenticated, (req, res) => {
  const taskId = req.params.taskid;
  const cusId = req.user.cusId;
  const sql = "DELETE FROM bids WHERE taskid = $1 AND cusid = $2";
  const param = [taskId, cusId];
  pool.query(sql, param, (err, result) => {
    if (err) {
      console.log("UNABLE TO DELETE Bid Record " + err);
    } else {
      res.redirect("/taskers/viewMyBids");
    }
  });
});

module.exports = router;
