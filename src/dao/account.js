var when = require('when'),
    query = require('../util/query');

exports.findByUsername = function (username) {
    var queryString = '' +
        '    SELECT a.username, a.password, ' +
        '           c.name AS client_name, ' +
        '           w.name AS worker_name, w.role AS worker_role ' +
        '      FROM account a ' +
        ' LEFT JOIN client c ON c.username = a.username ' +
        ' LEFT JOIN worker w ON w.username = a.username ' +
        '     WHERE a.username = $1 ';
    return query(queryString, [username])
        .then(function (users) {
            var user = users[0];
            return user && {
                username: user.username,
                password: user.password,
                name: user.client_name || user.worker_name,
                role: user.worker_role || 'client'
            };
        });
};
