var when = require('when'),
    serviceDao = require('../dao/service'),
    firewall = require('../util/firewall');

module.exports = function (app) {

    function createService(params, id) {
        var service = {};
        params = params || {};

        service.id = id || undefined;
        service.name = params.name || '';
        service.price = params.price || '';

        return service;
    }

    function validateService(service) {
        var errors = [];

        if (0 === service.name.length) {
            errors.push("Name is mandatory");
        }
        if (0 === service.price.length) {
            errors.push("Price is mandatory");
        } else if (false === /^[0-9]+([.][0-9]+)?$/.test(service.price)) {
            errors.push("Price has wrong format");
        }

        return errors;
    }

    function handleError(res) {
        return function (err) {
            console.error(err);
            res.send(500, 'Internal Server Error');
        };
    }

    app.get('/services', firewall('admin', function (req, res) {
        serviceDao.findAll().then(function (services) {
            res.render('services/index', {
                services: services,
                user: req.user
            });
        }).catch(handleError(res));
    }));

    app.get('/services/new', firewall('admin', function (req, res) {
        res.render('services/new', {
            service: createService(),
            user: req.user
        });
    }));

    app.post('/services', firewall('admin', function (req, res) {
        var service = createService(req.body),
            errors = validateService(service);

        if (errors.length) {
            res.render('services/new', {
                errors: errors,
                service: service,
                user: req.user
            });
        } else {
            serviceDao.save(service).then(function () {
                res.redirect('/services');
            }).catch(handleError(res));
        }
    }));

    app.del('/services/:id', firewall('admin', function (req, res) {
        serviceDao.delete(req.params.id).then(function () {
            res.redirect('/services');
        }).catch(handleError(res));
    }));

    app.get('/services/:id/edit', firewall('admin', function (req, res) {
        serviceDao.find(req.params.id).then(function (service) {
            if (!service) {
                res.send(404, 'Service not found');
            } else {
                res.render('services/edit', {
                    service: service,
                    user: req.user
                });
            }
        }).catch(handleError(res));
    }));

    app.put('/services/:id', firewall('admin', function (req, res) {
        var service = createService(req.body, req.params.id),
            errors = validateService(service);

        if (errors.length) {
            res.render('services/edit', {
                errors: errors,
                service: service,
                user: req.user
            });
        } else {
            serviceDao.save(service).then(function () {
                res.redirect('/services');
            }).catch(handleError(res));
        }
    }));

};
