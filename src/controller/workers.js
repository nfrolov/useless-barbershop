var when = require('when'),
    bcrypt = require('bcrypt'),
    workerDao = require('../dao/worker'),
    serviceDao = require('../dao/service'),
    firewall = require('../util/firewall');

module.exports = function (app) {

    function createWorker(params, id) {
        var worker = {};
        params = params || {};

        worker.id = id || undefined;
        worker.username = params.username || '';
        worker.password = params.password || undefined;
        worker.name = params.name || '';
        worker.role = '1' === params.admin ? 'admin' : 'basic';
        worker.abilities = params.abilities || [];

        return worker;
    }

    function validateWorker(worker, passwordRequired) {
        return when.promise(function (resolve, reject) {
            var errors = [];

            if (0 === worker.username.length) {
                errors.push("Username is mandatory");
            }
            if (0 === worker.name.length) {
                errors.push("Name is mandatory");
            }

            if (passwordRequired && (!worker.password || 0 === worker.password.length)) {
                errors.push("Password is mandatory");
            }

            resolve(errors);
        });
    }

    function handleError(res) {
        return function (err) {
            console.error(err);
            res.send(500, 'Internal Server Error');
        };
    }

    app.get('/workers', firewall('admin', function (req, res) {
        workerDao.findAll().then(function (workers) {
            res.render('workers/index', {
                workers: workers,
                user: req.user
            });
        }).catch(handleError(res));
    }));

    app.get('/workers/new', firewall('admin', function (req, res) {
        return serviceDao.findAll().then(function (services) {
            res.render('workers/new', {
                worker: createWorker(),
                services: services,
                user: req.user
            });
        });
    }));

    app.post('/workers', firewall('admin', function (req, res) {
        var worker = createWorker(req.body);

        validateWorker(worker, true).then(function (errors) {
            if (errors.length) {
                res.render('workers/new', {
                    errors: errors,
                    worker: worker,
                    user: req.user
                });
            } else {
                return when.promise(function (resolve, reject) {
                    bcrypt.hash(worker.password, 8, function (err, hash) {
                        if (err) return reject(err);
                        resolve(hash);
                    });
                }).then(function (hash) {
                    worker.password = hash;
                    return workerDao.insert(worker);
                }).then(function () {
                    res.redirect('/workers');
                });
            }
        }).catch(handleError(res));
    }));

    app.del('/workers/:id', firewall('admin', function (req, res) {
        workerDao.delete(req.params.id).then(function () {
            res.redirect('/workers');
        }).catch(handleError(res));
    }));

    app.get('/workers/:id/edit', firewall('admin', function (req, res) {
        workerDao.find(req.params.id).then(function (worker) {
            if (!worker) {
                res.send(404, 'Worker not found');
            } else {
                worker.password = '';
                return serviceDao.findAll().then(function (services) {
                    res.render('workers/edit', {
                        worker: worker,
                        services: services,
                        user: req.user
                    });
                });
            }
        }).catch(handleError(res));
    }));

    app.put('/workers/:id', firewall('admin', function (req, res) {
        var worker = createWorker(req.body, req.params.id);

        validateWorker(worker).then(function (errors) {
            if (errors.length) {
                res.render('workers/edit', {
                    errors: errors,
                    worker: worker,
                    user: req.user
                });
            } else {
                return when.promise(function (resolve, reject) {
                    if (!worker.password) return resolve();
                    bcrypt.hash(worker.password, 8, function (err, hash) {
                        if (err) return reject(err);
                        resolve(hash);
                    });
                }).then(function (hash) {
                    worker.password = hash;
                    return workerDao.update(worker);
                }).then(function () {
                    res.redirect('/workers');
                });
            }
        }).catch(handleError(res));
    }));

};
