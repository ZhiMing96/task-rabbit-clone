const express = require("express");
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');


router.get("/", function(req, res) {
  res.render("calendar");
});

router.post("/", (req, res) => {

    var time = new Date(convertToSeconds(req.body.time) * 1000).toISOString().substr(11, 8);
    var finalDateTime = req.body.date + 'T' + time; 
 

});

function convertToSeconds(timeInput){
    var units = timeInput.split(":");
    var hours = parseInt(units[0]);
    var units1 = units[1].split(" ");
    var minutes = parseInt(units1[0]);
    var totalSeconds = 0;
    if (hours > 12 || minutes > 59) {  
        return -1;
    } else if (timeInput.includes("AM") && hours == 12) { 
        totalSeconds = (minutes * 60);
    } else if (timeInput.includes("AM")) {
        totalSeconds = (hours * 3600) + (minutes * 60);
    } else if (timeInput.includes("PM")){
        totalSeconds = ((12+hours) * 3600) + (minutes * 60);

    }
        else {
        return -1;
    }
    return totalSeconds;
    
  }

module.exports = router;
