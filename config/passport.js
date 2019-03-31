const passport = require('passport');
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local').Strategy;




const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cs2102project',
    password: 'password',
    port: 5432,
});
pool.connect();

module.exports = function(passport){
    //Local Strategy 
    passport.use(new LocalStrategy(function(username, password,done){
        findUser(username, (err, user) => {
            if (err) {
                return done(err);
            }

            //user not found
            if (!user) {
                console.error('User not found');
                return done(null, false);
            }

            bcrypt.compare(password, user.passwordHash, (err, isValid) => {
                if (err) {
                    return done(err);
                }
                if (!isValid) {
                    return done(null, false);

                }
                return done(null, user);
            })

        })

    }));
}


function findUser(username, callback) {

    const sql = 'SELECT * FROM customers WHERE username = $1'
    const params = [username];
    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
            return callback(null);
        }

        if (result.rows.length == 0) {
            console.error("User does not exist");
            return callback(null);
        } else if (result.rows.length == 1) {
            return callback(null, {
                name: result.rows[0].name,
                passwordHash: result.rows[0].password,
                username: result.rows[0].username,
                cusId: result.rows[0].cusid,
                enabled: result.rows[0].enabled,
                gender: result.rows[0].gender,
                email: result.rows[0].email,
           

            })
        } else {
            console.error("More than one user");
            return callback(null);
        }


    });
}

passport.serializeUser(function (user, cb) {
    cb(null, user.username);
})

passport.deserializeUser(function (username, cb) {
    findUser(username, cb);
})


function initPassport() {
    passport.use(new LocalStrategy(
        (username, password, done) => {
            findUser(username, (err, user) => {
                if (err) {
                    return done(err);
                }

                //user not found
                if (!user) {
                    console.error('User not found');
                    return done(null, false);
                }

                bcrypt.compare(password, user.passwordHash, (err, isValid) => {
                    if (err) {
                        return done(err);
                    }
                    if (!isValid) {
                        return done(null, false);

                    }
                    return done(null, user);
                })

            })
        }

    ));
    passport.findUser = findUser;
}




