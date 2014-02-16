var when = require('when'),
    query = require('../util/query'),
    accountDao = require('./account');

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
