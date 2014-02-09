var when = require('when'),
    bcrypt = require('bcrypt'),
    query = require('../util/query'),
    dao = require('../dao/account');

module.exports = function (app) {

    app.use(function (req, res, next) {
        if (req.session.username) {
            dao.findByUsername(req.session.username).then(function (user) {
                req.user = user;
            }).catch(function (err) {
                console.error(err);
            }).finally(function () {
                next();
            });
        } else {
            next();
        }
    });

    app.get('/signin', function (req, res) {
        res.render('auth/signin');
    });

    app.post('/signin', function (req, res) {
        var username = req.body.username,
            password = req.body.password;

        dao.findByUsername(username).then(function (user) {
            if (!user) return false;
            return when.promise(function (resolve, reject) {
                bcrypt.compare(password, user.password, function (err, matches) {
                    if (err) return reject(err);
                    resolve(matches);
                });
            });
        }).then(function (matches) {
            if (matches) {
                req.session.username = username;
                res.redirect('/');
            } else {
                res.render('auth/signin', {
                    message: 'Wrong password or username'
                });
            }
        }).catch(function (err) {
            console.error(err);
            res.end(err);
        });
    });

    app.get('/signout', function (req, res) {
        req.session = null;
        res.redirect('/');
    });

};
