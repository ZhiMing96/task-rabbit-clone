
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

//View All Available Listings
router.get('/viewAllAvailable', function (req, res) {
    const sql = 'SELECT taskname, description, duration, manpower, taskdatetime, datecreated FROM createdTasks C WHERE taskId IN (SELECT taskId FROM listings WHERE biddingDeadline > (SELECT NOW())) AND cusId <> $1 AND taskdatetime > (SELECT NOW()) AND taskid not in (SELECT taskid FROM assigned) AND NOT EXISTS (SELECT 1 FROM bids WHERE bids.cusId  = $1 AND taskid = C.taskId)' ;
    const params =  [parseInt(req.user.cusId)];
    pool.query(sql, params ,(error, result) => {
        if (error) {
            console.log('err: ', error);
        } else {
            //console.log("taskid =" + result.rows[0].taskid);
            res.render('view_available_listings', {availableListing: result.rows,})
        }
    });
});

router.get('/createNewBid/:taskId',(req,res) => {
    var param= [req.params.taskId];
    var sql = "SELECT * FROM createdtasks WHERE taskid = $1"; 
    pool.query(sql,param, (err,result)=>{
        if(err){
            console.log("UNABLE TO RETRIEVE Listing" + err);
        } else {
        console.log(result.rows);
        res.render('createNewBid',{listing: result.rows});
        }
    });  
});

router.post('/createNewBid/:taskId',(req,res)=>{
    req.checkBody("bidAmt", "Amount is required").notEmpty();
    let error = req.validationErrors();
    if (error) { console.log(err + " NO BID AMT")}
    var cusId = req.user.cusId;
    var bidAmount = req.body.bidAmt;
    console.log("bid amt =" + bidAmount);
    const listingId = req.params.taskId;
    const sql = "INSERT INTO bids(cusid,taskid,bidprice,winningbid) VALUES ($1,$2,$3,$4)"; 
    const params = [cusId, listingId,bidAmount, null];

    pool.query(sql,params, (err, result)=>{
        if(err){
            console.log("UNABLE TO INSERT NEW BID RECORD " + err);
        } else {
            res.redirect('/taskers/view_my_bids');
        }
    });
})

router.get('/updateBid/:taskid',(req,res)=>{
    const taskId = req.params.taskid ;
    const cusId = req.user.cusId; 
    //console.log(cusId);
    const sql = 'SELECT B.taskId, C.taskName, B.bidPrice, L.biddingDeadline FROM CreatedTasks C join (Listings L join Bids B on (L.taskId = B.taskId)) on (C.taskId = L.taskId) WHERE B.taskId = $1 AND B.cusId = $2';

  const params = [taskId,cusId];

    pool.query(sql,params,(err,result) =>{
        if(err){
            console.log("UNABLE TO Retreive Bid Record " + err);
        } else {
            res.render('updateBid',{bidInfo: result.rows})
        }
    });

    
});

router.post('/updateBid/:taskid',(req,res)=>{
    const taskId = req.params.taskid; 
    const cusId = req.user.cusId;
    const newPrice = req.body.bidAmt;

    const sql = "UPDATE bids SET bidprice = $1 WHERE cusid = $2 AND taskid = $3";
    const param = [newPrice, cusId,taskId];

    pool.query(sql,param,(err,result) => {
        if(err){
            console.log("UNABLE TO UPDATE Bid Record " + err);
        } else {
            res.redirect('/taskers/viewMyBids');
        }
    });
});

router.get('/deleteBid/:taskid',(req,res)=>{
    const taskId = req.params.taskid; 
    const cusId = req.user.cusId;
    const sql = "DELETE FROM bids WHERE taskid = $1 AND cusid = $2";
    const param = [taskId,cusId];
    pool.query(sql, param, (err,result)=>{
        if(err){
            console.log("UNABLE TO DELETE Bid Record " + err);
        } else {
            res.redirect('/taskers/viewMyBids');
        }
    });
});

module.exports = router;