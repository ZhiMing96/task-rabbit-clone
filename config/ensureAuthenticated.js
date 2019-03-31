module.exports = function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('warning', 'You need to be logged in to view this page.');
        res.redirect('/users/login');
    }
}