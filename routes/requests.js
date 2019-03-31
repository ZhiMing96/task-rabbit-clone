const express = require("express");
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');

module.exports = router;
