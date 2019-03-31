module.exports = function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('warning', '<i class="fas fa-times"></i> You need to be logged in to view this page.');
        res.redirect('/users/login');
    }
}