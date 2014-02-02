var when = require('when'),
    query = require('../util/query');

exports.findByUsername = function (username) {
    return query('SELECT * FROM account WHERE username = $1', [username])
        .then(function (users) {
            return users[0];
        });
};
