var when = require('when'),
    query = require('../util/query');

exports.findAll = function () {
    var selectQuery = '' +
        ' SELECT service_id AS id, name, price ' +
        '   FROM service ' +
        '  ORDER BY name ';
    return query(selectQuery).then(function (services) {
        return services || [];
    });
};

exports.find = function (id) {
    var selectQuery = '' +
        ' SELECT service_id AS id, name, price ' +
        '   FROM service ' +
        '  WHERE service_id = $1 ';
    return query(selectQuery, [id]).then(function (services) {
        return services && services[0];
    });
};

exports.save = function (entity) {
    var updateQuery = '' +
        ' UPDATE service ' +
        '    SET name = $1, price = $2 ' +
        '  WHERE service_id = $3 ';
    var insertQuery = '' +
        '    INSERT INTO service (name, price) ' +
        '    VALUES ($1, $2) ' +
        ' RETURNING service_id ';
    var params = [entity.name, entity.price];

    if (entity.id) {
        params.push(entity.id);
        return query(updateQuery, params).then(function () {
            return entity;
        });
    } else {
        return query(insertQuery, params).then(function (rows) {
            entity.id = rows[0].service_id;
            return entity;
        });
    }
};

exports.delete = function (id) {
    var deleteQuery = ' DELETE FROM service WHERE service_id = $1 ';
    return query(deleteQuery, [id]);
};
