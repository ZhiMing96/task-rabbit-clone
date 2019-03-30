const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const ensureAuthenticated = require('../config/ensureAuthenticated');



//Load Edit Form
router.get('/edit/:id', ensureAuthenticated, function (req, res) {

    const sql = 'SELECT * FROM createdTasks WHERE article_id = $1'
    const params = [req.params.id];
    pool.query(sql, params, (error, result) => {
        var retrievedArticle = result.rows[0];
        console.log(retrievedArticle);
        if (retrievedArticle.author != req.user.user_id) {
            req.flash('danger', 'Not authorised');
            res.redirect('/');
        } else {
            if (error) {
                console.log('err: ', error);
            }
            res.render('edit_article', {
                title: 'Edit Article',
                article: retrievedArticle
            })
        }


    });

});


//Update article POST Route

router.post('/edit/:id', ensureAuthenticated, (req, res) => {

    const sql = 'UPDATE articles SET title = $1, author = $2, body = $3 WHERE article_id = $4'
    const params = [req.body.title, req.body.author, req.body.body, req.params.id];
    pool.query(sql, params, (error, result) => {
        
        
        if (error) {
            console.log('err: ', error);
        }
        req.flash('success', 'Article Updated');
        res.redirect('/');

    });

});



//Add route 
router.get('/add', ensureAuthenticated, function (req, res) {

    res.render('add_article', {
        title: 'Add Article'
    });
});




router.post('/add', (req, res) => {

    req.checkBody('title', 'Title is required').notEmpty();
    req.checkBody('body', 'Body is required').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        res.render('add_article', {
            title: 'Add Article',
            errors: errors
        });

    } else {



        const sql = 'INSERT INTO articles (title, author, body) VALUES ($1, $2, $3)'
        const params = [req.body.title, req.user.user_id, req.body.body];
        pool.query(sql, params, (error, result) => {
            if (error) {
                console.log('err: ', error);
            }
            req.flash('success', 'Article Added');
            console.log('result?', result);
            res.redirect('/');
        });
    }
});

router.delete('/:id', function (req, res) {
    const sql = 'DELETE FROM articles WHERE article_id = $1'
    const params = [req.params.id];
    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        }
        console.log('delete results', result);
        res.send('Success');

    });
});


//Get single article 
router.get('/:id', ensureAuthenticated, function (req, res) {
    const sql = 'SELECT * FROM articles WHERE article_id = $1'
    const params = [req.params.id];
    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
        }


        const sql = 'SELECT users.name FROM users WHERE user_id = $1'
        const params = [result.rows[0].author];
        pool.query(sql, params, (err, data) => {
            if (err) {
                console.log('err: ', err);
            }

            res.render('article', {
                article: result.rows[0],
                author: data.rows[0].name

            });

        });


    });

});


module.exports = router;
