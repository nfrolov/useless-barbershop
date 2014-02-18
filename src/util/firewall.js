module.exports = function firewall(roles, cb) {
    if ('string' === typeof roles) {
        roles = [roles];
    }
    return function (req, res) {
        if (req.user && -1 !== roles.indexOf(req.user.role)) {
            cb(req, res);
        } else {
            res.status(403).render('auth/denied');
        }
    };
};
