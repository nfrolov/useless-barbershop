var when = require('when'),
    bcrypt = require('bcrypt'),
    clientDao = require('../dao/client'),
    firewall = require('../util/firewall');

module.exports = function (app) {

    function createClient(params, id) {
        var client = {};
        params = params || {};

        client.id = id || undefined;
        client.username = params.username || '';
        client.password = params.password || undefined;
        client.name = params.name || '';
        client.phone = params.phone || '';

        return client;
    }

    function validateClient(client, passwordRequired) {
        return when.promise(function (resolve, reject) {
            var errors = [];

            if (0 === client.username.length) {
                errors.push('Username is mandatory');
            }
            if (passwordRequired && (!client.password || 0 === client.password.length)) {
                errors.push('Password is mandatory');
            }
            if (0 === client.name.length) {
                errors.push('Name is mandatory');
            }
            if (0 === client.phone.length) {
                errors.push('Phone is mandatory');
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

    app.get('/clients', firewall(['admin', 'basic'], function (req, res) {
        clientDao.findAll().then(function (clients) {
            res.render('clients/index', {
                clients: clients,
                user: req.user
            });
        });
    }));

    app.get('/clients/new', firewall(['admin', 'basic'], function (req, res) {
        res.render('clients/new', {
            client: createClient(),
            user: req.user
        });
    }));

    app.post('/clients', firewall(['admin', 'basic'], function (req, res) {
        var client = createClient(req.body);

        validateClient(client, true).then(function (errors) {
            if (errors.length) {
                res.render('clients/new', {
                    errors: errors,
                    client: client,
                    user: req.user
                });
            } else {
                return when.promise(function (resolve, reject) {
                    bcrypt.hash(client.password, 8, function (err, hash) {
                        if (err) return reject(err);
                        resolve(hash);
                    });
                }).then(function (hash) {
                    client.password = hash;
                    return clientDao.insert(client);
                }).then(function () {
                    res.redirect('/clients');
                });
            }
        }).catch(handleError(res));
    }));

    app.del('/clients/:id', firewall(['admin', 'basic'], function (req, res) {
        clientDao.delete(req.params.id).then(function () {
            res.redirect('/clients');
        }).catch(handleError(res));
    }));

    app.get('/clients/:id/edit', firewall(['admin', 'basic'], function (req, res) {
        clientDao.find(req.params.id).then(function (client) {
            if (!client) {
                res.send(404, 'Client not found');
            } else {
                client.password = '';
                res.render('clients/edit', {
                    client: client,
                    user: req.user
                });
            }
        }).catch(handleError(this));
    }));


    app.put('/clients/:id', firewall(['admin', 'basic'], function (req, res) {
        var client = createClient(req.body, req.params.id);

        validateClient(client).then(function (errors) {
            if (errors.length) {
                res.render('clients/edit', {
                    errors: errors,
                    client: client,
                    user: req.user
                });
            } else {
                return when.promise(function (resolve, reject) {
                    if (!client.password) return resolve();
                    bcrypt.hash(client.password, 8, function (err, hash) {
                        if (err) return reject(err);
                        resolve(hash);
                    });
                }).then(function (hash) {
                    client.password = hash;
                    return clientDao.update(client);
                }).then(function () {
                    res.redirect('/clients');
                });
            }
        });
    }));

    app.get('/join', function (req, res) {
        res.render('auth/join', {
            client: createClient()
        });
    });

    app.post('/join', function (req, res) {
        var client = createClient(req.body);

        validateClient(client, true).then(function (errors) {
            if (errors.length) {
                res.render('auth/join', {
                    errors: errors,
                    client: client
                });
            } else {
                return when.promise(function (resolve, reject) {
                    bcrypt.hash(client.password, 8, function (err, hash) {
                        if (err) return reject(err);
                        resolve(hash);
                    });
                }).then(function (hash) {
                    client.password = hash;
                    return clientDao.insert(client);
                }).then(function () {
                    req.session.username = client.username;
                    res.redirect('/');
                });
            }
        }).catch(handleError(res));
    });

};
