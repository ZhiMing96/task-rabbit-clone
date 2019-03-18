
const express = require('express');
const path = require('path'); //path is included in nodejs by default
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
//const config = require('./config/database');

/*
var parse = require('pg-connection-string').parse;


const connectionString = parse('postgres://postgres:password@localhost:5432/articlelist')

const pool = new Pool({
  connectionString: connectionString,
})
pool.connect();

pool.query('SELECT NOW()', (err, res) => {
  console.log(err, res)
  pool.end()
})

*/


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'articlelist',
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
app.set('view engine', 'pug');



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

    pool.query('SELECT * FROM articles', (error, result) => {
        if (error) {
            console.log('err: ', error);
        }
        res.render('index', {
            title: 'Articles',
            articles: result.rows

        });
    });
});

//Route files. Anything with the first param will go to second param
let articles = require('./routes/articles');
let users = require('./routes/users');
app.use('/articles', articles);
app.use('/users', users);





//Start server
app.listen('3000', function(){
    console.log('Server started on port 3000...');
});