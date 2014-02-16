module.exports = function firewall(role, cb) {
    return function (req, res) {
        if (req.user && role === req.user.role) {
            cb(req, res);
        } else {
            res.status(403).render('auth/denied');
        }
    };
};
