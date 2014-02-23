var when = require('when'),
    query = require('../util/query'),
    moment = require('moment');

exports.getAppointmentsDailyStats = function () {
    var selectStatsQuery =
        " SELECT ap.start_time::date AS date, sum(aps.price) AS total_price " +
        "   FROM appointment ap " +
        "   JOIN appointment_service aps USING (appointment_id) " +
        "  GROUP BY 1 " +
        "  ORDER BY date ";

    return query(selectStatsQuery).then(function (rows) {
        return groupByMonth(rows || []);
    });
};

exports.getWorkersDailyStats = function () {
    var selectStatsQuery =
        " WITH stats AS ( " +
        "   SELECT ap.start_time::date AS date, ap.worker_id, sum(aps.price) AS total_price " +
        "     FROM appointment ap " +
        "     JOIN appointment_service aps USING (appointment_id) " +
        "    GROUP BY 1, 2 " +
        "      ) " +
        " SELECT st.date, wo.name AS worker_name, st.total_price " +
        "   FROM stats st " +
        "   JOIN worker wo USING (worker_id) " +
        "  ORDER BY st.date, wo.worker_id ";

    return query(selectStatsQuery).then(function (rows) {
        return groupByMonth(rows || []);
    });
};

function groupByMonth(rows) {
    var i, key, res = {};

    for (i = 0; i < rows.length; ++i) {
        key = moment(rows[i].date).format('YYYY-MM');
        if (undefined === res[key]) res[key] = [];
        res[key].push(rows[i]);
    }

    return res;
}
