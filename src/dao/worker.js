var when = require('when'),
    query = require('../util/query'),
    accountDao = require('./account');

exports.findAll = function () {
    var selectQuery =
        ' SELECT worker_id AS id, username, name, role ' +
        '   FROM worker ' +
        '  ORDER BY name ';
    return query(selectQuery).then(function (workers) {
        return workers || [];
    });
};

exports.find = function (id) {
    var selectQuery =
        ' SELECT w.worker_id AS id, w.name, w.role, ' +
        '        a.username, a.password, ' +
        '        ARRAY( SELECT wa.service_id ' +
        '                 FROM worker_ability wa ' +
        '                WHERE wa.worker_id = w.worker_id ) AS abilities ' +
        '   FROM worker w ' +
        '   JOIN account a ON (a.username = w.username) ' +
        '  WHERE worker_id = $1 ';
    var params = [id];

    return query(selectQuery, params).then(function (workers) {
        var worker = workers && workers[0];
        if (worker) {
            worker.abilities = worker.abilities.map(function (service_id) {
                return +service_id;
            });
        }
        return worker;
    });
};

exports.findByAbilities = function (abilities) {
    var selectQuery =
        ' SELECT w.worker_id AS id, w.name ' +
        '   FROM worker w ' +
        '  WHERE $1 <@ ARRAY( SELECT wa.service_id ' +
        '                       FROM worker_ability wa ' +
        '                      WHERE wa.worker_id = w.worker_id ) ';
    var params = [abilities];
    return query(selectQuery, params).then(function (rows) {
        return rows || [];
    });
};

function saveAbilities(worker_id, abilities) {
    var clearQuery =
        ' DELETE FROM worker_ability ' +
        '  WHERE worker_id = $1 ';
    var insertQuery =
        ' INSERT INTO worker_ability (worker_id, service_id) ' +
        ' VALUES ($1, $2) ';

    var sequence = query(clearQuery, [worker_id]);

    abilities.forEach(function (service_id) {
        sequence = sequence.then(function () {
            return query(insertQuery, [worker_id, service_id]);
        });
    });

    return sequence;
}

exports.insert = function (entity) {
    return accountDao.insert(entity).then(function () {
        var insertQuery =
            '    INSERT INTO worker (username, name, role) ' +
            '    VALUES ($1, $2, $3) ' +
            ' RETURNING worker_id ';
        var params = [entity.username, entity.name, entity.role];
        return query(insertQuery, params);
    }).then(function (rows) {
        entity.id = rows[0].worker_id;
        return saveAbilities(entity.id, entity.abilities);
    }).then(function () {
        return entity;
    });
};

exports.update = function (entity) {
    var updateQuery =
        '    UPDATE worker ' +
        '       SET name = $1, role = $2 ' +
        '     WHERE worker_id = $3 ' +
        ' RETURNING username ';
    var params = [entity.name, entity.role, entity.id];

    return query(updateQuery, params).then(function (rows) {
        var currentUsername = rows[0].username;
        if (currentUsername !== entity.username || entity.password) {
            return accountDao.update(currentUsername, entity);
        }
    }).then(function () {
        return saveAbilities(entity.id, entity.abilities);
    }).then(function () {
        return entity;
    });
};

exports.delete = function (id) {
    var deleteQuery =
        '    DELETE FROM worker ' +
        '     WHERE worker_id = $1 ' +
        ' RETURNING username ';
    var params = [id];

    return query(deleteQuery, [id]).then(function (rows) {
        return rows[0].username;
    }).then(function (username) {
        return accountDao.delete(username);
    });
};
