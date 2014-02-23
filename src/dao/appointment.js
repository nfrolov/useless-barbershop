var when = require('when'),
    query = require('../util/query');

exports.findAvailableTimesFor = function (worker_id) {
    var selectQuery =
        ' SELECT start_time ' +
        '   FROM time_available ' +
        '  WHERE worker_id = $1 ' +
        '  ORDER BY start_time ';
    var params = [worker_id];

    return query(selectQuery, params).then(function (rows) {
        return rows || [];
    });
};

exports.find = function (id) {
    var selectQuery =
        ' SELECT a.appointment_id AS id, a.client_id, ' +
        '        a.worker_id, w.name AS worker_name, ' +
        '        a.client_name, a.client_phone, a.note, ' +
        '        a.start_time, a.end_time ' +
        '   FROM appointment a ' +
        '   JOIN worker w ON (w.worker_id = a.worker_id) ' +
        '  WHERE a.appointment_id = $1 ';
    var selectServicesQuery =
        ' SELECT aps.service_id, s.name, aps.price ' +
        '   FROM appointment_service aps ' +
        '   JOIN service s ON s.service_id = aps.service_id ' +
        '  WHERE aps.appointment_id = $1 ';

    return query(selectQuery, [id]).then(function (rows) {
        var appointment = rows && rows[0];
        if (appointment) {
            return query(selectServicesQuery, [appointment.id]).then(function (services) {
                appointment.services = services || [];
                return appointment;
            });
        }
        return appointment;
    });
};

exports.findAll = function () {
    var selectQuery =
        " SELECT a.appointment_id AS id, a.client_id, " +
        "        a.worker_id, w.name AS worker_name, " +
        "        a.client_name, a.client_phone, a.note, " +
        "        a.start_time, a.end_time, " +
        "        a.start_time < current_date AS is_past, " +
        "        a.start_time = current_date AS is_today " +
        "   FROM appointment a " +
        "   JOIN worker w ON (w.worker_id = a.worker_id) " +
        "  ORDER BY a.start_time ";

    return query(selectQuery).then(function (rows) {
        return rows || [];
    });
};

exports.findByWorker = function (worker_id) {
    var selectQuery =
        " SELECT a.appointment_id AS id, a.client_id, " +
        "        a.worker_id, w.name AS worker_name, " +
        "        a.client_name, a.client_phone, a.note, " +
        "        a.start_time, a.end_time, " +
        "        a.start_time < current_date AS is_past, " +
        "        a.start_time = current_date AS is_today " +
        "   FROM appointment a " +
        "   JOIN worker w ON (w.worker_id = a.worker_id) " +
        "  WHERE a.worker_id = $1 " +
        "  ORDER BY a.start_time ";
    var params = [worker_id];

    return query(selectQuery, params).then(function (rows) {
        return rows || [];
    });
};

exports.findByClient = function (client_id) {
    var selectQuery =
        " SELECT a.appointment_id AS id, a.client_id, " +
        "        a.worker_id, w.name AS worker_name, " +
        "        a.client_name, a.client_phone, a.note, " +
        "        a.start_time, a.end_time, " +
        "        a.start_time < current_date AS is_past, " +
        "        a.start_time = current_date AS is_today " +
        "   FROM appointment a " +
        "   JOIN worker w ON (w.worker_id = a.worker_id) " +
        "  WHERE a.client_id = $1 " +
        "  ORDER BY a.start_time ";
    var params = [client_id];

    return query(selectQuery, params).then(function (rows) {
        return rows || [];
    });
};

function saveServices(appointment_id, services) {
    var insertQuery =
        ' INSERT INTO appointment_service ' +
        '        (appointment_id, service_id, price) ' +
        ' VALUES ($1, $2, ( SELECT price FROM service WHERE service_id = $2 )) ';

    var sequence = when.resolve();

    services.forEach(function (service_id) {
        sequence = sequence.then(function () {
            return query(insertQuery, [appointment_id, service_id]);
        });
    });

    return sequence;
}

exports.insert = function (entity) {
    var insertQuery =
        '    INSERT INTO appointment ' +
        '           (worker_id, client_id, client_name, client_phone, start_time, end_time, note) ' +
        '    VALUES ($1, $2, $3, $4, $5, $5::timestamp + interval \'30\' minute, $6) ' +
        ' RETURNING appointment_id ';
    var params = [
        entity.worker_id, entity.client_id, entity.client_name,
        entity.client_phone, entity.start_time, entity.note
    ];

    return query(insertQuery, params).then(function (rows) {
        entity.id = rows[0].appointment_id;
        return saveServices(entity.id, entity.services);
    }).then(function () {
        return entity;
    });
};

exports.delete = function (id) {
    var deleteQuery =
        ' DELETE FROM appointment ' +
        '  WHERE appointment_id = $1 ';
    var params = [id];

    return query(deleteQuery, params);
};
