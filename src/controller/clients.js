var when = require('when'),
    clientDao = require('../dao/client');

module.exports = function (app) {

    function createClient(params, id) {
        var client = {};
        params = params || {};

        client.id = id || undefined;
        client.username = params.username || '';
        client.password = params.password || '';
        client.name = params.name || '';
        client.phone = params.phone || '';

        return client;
    }

    function validateClient(client) {
        return when.promise(function (resolve, reject) {
            var errors = [];

            if (0 === client.username.length) {
                errors.push('Username is mandatory');
            }
            if (0 === client.password.length) {
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

    app.get('/join', function (req, res) {
        res.render('auth/join', {
            client: createClient()
        });
    });

    app.post('/join', function (req, res) {
        var client = createClient(req.body);

        validateClient(client).then(function (errors) {
            if (errors.length) {
                res.render('auth/join', {
                    errors: errors,
                    client: client
                });
            } else {
                return clientDao.insert(client).then(function () {
                    req.session.username = client.username;
                    res.redirect('/');
                });
            }
        }).catch(handleError(res));
    });

};
