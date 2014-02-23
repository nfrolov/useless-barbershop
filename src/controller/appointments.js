var when = require('when'),
    firewall = require('../util/firewall'),
    serviceDao = require('../dao/service'),
    workerDao = require('../dao/worker'),
    appointmentDao = require('../dao/appointment'),
    clientDao = require('../dao/client');

module.exports = function (app) {

    function createAppointment(params) {
        var ap = {};
        params = params || {};

        ap.id = undefined;
        ap.services = (params.services || []).map(function (id) { return +id; });
        ap.worker_id = +params.worker_id || 0;
        ap.client_id = null;
        ap.client_name = params.client_name || '';
        ap.client_phone = params.client_phone || '';
        ap.start_time = params.start_time || null;
        ap.end_time = null;
        ap.note = params.note || null;

        return ap;
    }

    function handleError(res) {
        return function (err) {
            console.error(err);
            res.send(500, 'Internal Server Error');
        };
    }

    app.get('/appointments', firewall(['admin', 'basic'], function (req, res) {
        appointmentDao.findAll().then(function (appointments) {
            res.render('appointments/index', {
                appointments: appointments,
                user: req.user
            });
        }).catch(handleError(res));
    }));

    app.get('/workers/:id/appointments', firewall(['admin', 'basic'], function (req, res) {
        var worker_id = req.params.id;

        appointmentDao.findByWorker(worker_id).then(function (appointments) {
            res.render('appointments/index', {
                appointments: appointments,
                user: req.user
            });
        }).catch(handleError(res));
    }));

    app.delete('/appointments/:id', function (req, res) {
        var appointment_id = req.params.id;

        appointmentDao.find(appointment_id).then(function (appointment) {
            if (null === appointment.client_id) {
                return true;
            }
            if (req.user) {
                if ('admin' === req.user.role || 'basic' === req.user.role) {
                    return true;
                }
                return clientDao.findByUsername(req.user.username).then(function (client) {
                    return client && client.id == appointment.client_id;
                });
            }
            return false;
        }).then(function (granted) {
            if (granted) {
                appointmentDao.delete(appointment_id).then(function () {
                    res.redirect('/appointments');
                });
            } else {
                res.status(403).render('auth/denied');
            }
        }).catch(handleError(res));
    });

    app.get('/schedule-appointment', function (req, res) {
        serviceDao.findAll().then(function (services) {
            res.render('appointments/schedule-1', {
                step: 1,
                appointment: createAppointment(),
                services: services,
                user: req.user
            });
        }).catch(handleError(res));
    });

    app.post('/schedule-appointment', function (req, res) {
        var step = +req.body.step || 1;
        var appointment = createAppointment(req.body);
        var locals = {
            appointment: appointment,
            user: req.user
        };

        when(step, function (step) {
            switch (step) {
            case 1:
                if (!appointment.services.length) {
                    locals.errors = ['Please select one or more services'];
                    return step;
                }
                return step + 1;
            case 2:
                if (!appointment.worker_id) {
                    locals.errors = ['Please select a staff member'];
                    return step;
                }
                return step + 1;
            case 3:
                if (!appointment.start_time) {
                    locals.errors = ['Please select a time'];
                    return step;
                }
                return when.resolve().then(function () {
                    if (req.user && 'client' === req.user.role) {
                        return clientDao.findByUsername(req.user.username);
                    }
                }).then(function (client) {
                    if (client) {
                        appointment.client_name = client.name;
                        appointment.client_phone = client.phone;
                    }
                    return step + 1;
                });
            case 4:
                var errors = locals.errors = [];
                if (0 === appointment.client_name.length) {
                    errors.push('Name is mandatory');
                }
                if (0 === appointment.client_phone.length) {
                    errors.push('Phone is mandatory');
                }
                if (errors.length) {
                    return step;
                }
                return step + 1;
            case 5:
                return when.resolve().then(function () {
                    if (req.user && 'client' == req.user.role) {
                        return clientDao.findByUsername(req.user.username);
                    }
                }).then(function (client) {
                    if (client) {
                        appointment.client_id = client.id;
                    }
                    return appointmentDao.insert(appointment);
                }).then(function () {
                    res.redirect('/appointments/' + appointment.id);
                });
            }
        }).then(function (step) {
            if (1 === step || 5 === step) {
                return serviceDao.findAll().then(function (services) {
                    locals.services = services;
                    return step;
                });
            }
            return step;
        }).then(function (step) {
            if (2 === step) {
                return workerDao.findByAbilities(appointment.services).then(function (workers) {
                    locals.workers = workers;
                    return step;
                });
            }
            return step;
        }).then(function (step) {
            if (3 === step) {
                return appointmentDao.findAvailableTimesFor(appointment.worker_id).then(function (times) {
                    locals.times = times.map(function (time) {
                        return {
                            name: time.start_time.toString(),
                            value: time.start_time.toISOString()
                        };
                    });
                    return step;
                });
            }
            return step;
        }).then(function (step) {
            if (5 === step) {
                return workerDao.find(appointment.worker_id).then(function (worker) {
                    locals.worker = worker;
                    return step;
                });
            }
            return step;
        }).then(function (step) {
            if (step) {
                var view = 'appointments/schedule-' + step;
                locals.step = step;
                res.render(view, locals);
            }
        }).catch(handleError(res));
    });

    app.get('/appointments/:id', function (req, res) {
        appointmentDao.find(req.params.id).then(function (appointment) {
            if (!appointment) {
                res.send(404, 'Appointment not found');
                return;
            }
            return when.resolve().then(function () {
                if (null === appointment.client_id) {
                    return true;
                }
                if (req.user) {
                    if ('admin' === req.user.role || 'basic' === req.user.role) {
                        return true;
                    }
                    return clientDao.findByUsername(req.user.username).then(function (client) {
                        return client && client.id == appointment.client_id;
                    });
                }
                return false;
            }).then(function (granted) {
                if (granted) {
                    res.render('appointments/view', {
                        appointment: appointment,
                        user: req.user
                    });
                } else {
                    res.status(403).render('auth/denied');
                }
            });
        }).catch(handleError(res));
    });

};
