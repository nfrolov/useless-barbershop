var when = require('when'),
    query = require('../util/query'),
    accountDao = require('./account');

exports.findAll = function () {
    var selectQuery =
        ' SELECT client_id AS id, username, name, phone ' +
        '   FROM client ' +
        '  ORDER BY name ';

    return query(selectQuery).then(function (rows) {
        return rows || [];
    });
};

exports.find = function (id) {
    var selectQuery =
        ' SELECT client_id AS id, username, name, phone ' +
        '   FROM client ' +
        '  WHERE client_id = $1 ';
    var params = [id];

    return query(selectQuery, params).then(function (rows) {
        return rows && rows[0];
    });
};

exports.findByUsername = function (username) {
    var selectQuery =
        ' SELECT client_id AS id, username, name, phone ' +
        '   FROM client ' +
        '  WHERE username  = $1 ';
    var params = [username];

    return query(selectQuery, params).then(function (rows) {
        return rows && rows[0];
    });
};

exports.insert = function (entity) {
    return accountDao.insert(entity).then(function () {
        var insertQuery =
            '    INSERT INTO client (username, name, phone) ' +
            '    VALUES ($1, $2, $3) ' +
            ' RETURNING client_id ';
        var params = [entity.username, entity.name, entity.phone];
        return query(insertQuery, params);
    }).then(function (rows) {
        entity.id = rows[0].client_id;
        return entity;
    });
};

exports.update = function (entity) {
    var updateQuery =
        '    UPDATE client ' +
        '       SET name = $1, phone = $2 ' +
        '     WHERE client_id = $3 ' +
        ' RETURNING username ';
    var params = [entity.name, entity.phone, entity.id];

    return query(updateQuery, params).then(function (rows) {
        var currentUsername = rows[0].username;
        if (currentUsername !== entity.username || entity.password) {
            return accountDao.update(currentUsername, entity);
        }
    }).then(function () {
        return entity;
    });
};

exports.delete = function (id) {
    var deleteQuery =
        '    DELETE FROM client ' +
        '     WHERE client_id = $1 ' +
        ' RETURNING username ';
    var params = [id];

    return query(deleteQuery, [id]).then(function (rows) {
        return rows[0].username;
    }).then(function (username) {
        return accountDao.delete(username);
    });
};
