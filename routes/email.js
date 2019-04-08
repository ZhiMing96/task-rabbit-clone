const express = require("express");
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');

router.get('/', function (req, res) {
    const tempTable = "with assigned_ct as (select A.cusid, A.taskid as weeklyNumTask from assigned A join createdtasks C on A.taskid = C.taskid where A.completed = true and (DATE_PART('day', now()::timestamp - taskstartdatetime::timestamp) >= 0 and  DATE_PART('day', now()::timestamp - taskstartdatetime::timestamp) <= 7))"
    const sql = "select T.cusid, count(weeklyNumTask) as weeklyNumTask, count(A.taskid) as totalnumTask, coalesce(avg(rating),0) as avgRating from ((taskers T left outer join assigned_ct AC on T.cusid = AC.cusid) left join assigned A on T.cusid = A.cusid) left outer join Reviews R on T.cusid = R.cusid group by T.cusid order by weeklyNumTask asc, totalnumTask desc, avgRating desc limit 3"
  
    pool.query(tempTable + sql, (error, result) => {
    
      if (error) {
        console.log('err: ', error);
      }
  
      res.render('admin_view_top3', {
        result: result.rows,
        
      });
  
    });
  });


  router.post('/', function (req, res) {
    
      res.render('email_sent');
  
    
  });




module.exports = router;
