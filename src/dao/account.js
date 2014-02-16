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

exports.insert = function (entity) {
    var insertQuery =
        ' INSERT INTO account ' +
        ' VALUES ($1, $2) ';
    var params = [entity.username, entity.password];

    return query(insertQuery, params).then(function () {
        return entity;
    });
};

exports.update = function (username, entity) {
    var updateQuery, params;

    if (entity.password) {
        updateQuery =
            ' UPDATE account ' +
            '    SET username = $1, password = $2 ' +
            '  WHERE username = $3 ';
        params = [entity.username, entity.password, username];
    } else {
        updateQuery =
            ' UPDATE account ' +
            '    SET username = $1 ' +
            '  WHERE username = $2 ';
        params = [entity.username, username];
    }

    return query(updateQuery, params).then(function () {
        return entity;
    });
};

exports.delete = function (username) {
    var deleteQuery = ' DELETE FROM account WHERE username = $1 ';
    return query(deleteQuery, [username]);
};
