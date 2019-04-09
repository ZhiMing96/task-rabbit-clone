
const express = require('express');
const path = require('path'); //path is included in nodejs by default
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');



const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cs2102project',
    password: 'password',
    port: 5432,
});


pool.connect();



//Init app
const app = express();

//Set Public Folder
app.use(express.static(path.join(__dirname,'public')));
//Body Parser Middleware 
app.use(bodyParser.urlencoded({ extended: false }));

//Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
}));

//Load view engine 
app.set('views', path.join(__dirname, 'views') );
app.set('view engine', 'ejs');



//Express messages middleware
app.use(require('connect-flash')());
app.use(function(req,res,next){
    res.locals.messages = require('express-messages')(req,res);
    next();
});

//Express Validator Middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value){
        var namespace = param.split('.'),
        root = namespace.shift(),
        formParam = root;

        while (namespace.length){
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg : msg,
            value : value
        };
    }
}));

//passport middleware 

app.use(passport.initialize());
app.use(passport.session());
//passport config
require('./config/passport')(passport);

//setting global variable for user -  check if logged in or not
app.get('*', function(req,res,next){
    res.locals.user = req.user || null;
    next();
});


//Home route

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/home');
    } else {
        res.render('index');
    }
});

//Route files. Anything with the first param will go to second param
let home = require('./routes/home');
let articles = require('./routes/articles');
let users = require('./routes/users');
let taskRequesters = require('./routes/taskRequesters');
let taskers = require('./routes/taskers');
let requests = require('./routes/requests');
let listings  = require('./routes/listings');
let categories  = require('./routes/categories');
let calendar  = require('./routes/calendar');
let email  = require('./routes/email');
app.use('/home', home);
app.use('/articles', articles);
app.use('/users', users);

app.use('/taskRequesters', taskRequesters);
app.use('/taskers', taskers);
app.use('/requests', requests);
app.use('/listings', listings);
app.use('/categories', categories);
app.use('/calendar', calendar);
app.use('/email', email);

app.use(function(req, res, next){
  res.status(404);
  res.render('include/404');
});





//Start server
app.listen('3000', function(){
    console.log('Server started on port 3000...');
});