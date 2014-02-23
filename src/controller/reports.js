var firewall = require('../util/firewall'),
    reportDao = require('../dao/report');

module.exports = function (app) {

    function handleError(res) {
        return function (err) {
            console.error(err);
            res.send(500, 'Internal Server Error');
        };
    }

    app.get('/reports', firewall('admin', function (req, res) {
        var locals = {
            user: req.user
        };

        reportDao.getAppointmentsDailyStats().then(function (stats) {
            locals.appointments_daily_stats = stats;
            return reportDao.getWorkersDailyStats();
        }).then(function (stats) {
            locals.workers_daily_stats = stats;
        }).then(function () {
            res.render('reports/index', locals);
        }).catch(handleError(res));
    }));

};
