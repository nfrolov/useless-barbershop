var when = require('when'),
    query = require('../util/query');

module.exports = function (app) {
    app.get('/test/connection', function (req, res) {
        query("select table_name as name from information_schema.tables where table_schema = 'public'")
            .then(function (tables) {
                var sequence = when.resolve();

                tables.forEach(function (table) {
                    sequence = sequence.then(function () {
                        return query("select * from information_schema.columns where table_name = $1", [table.name]);
                    }).then(function (columns) {
                        table.columns = columns;
                        return query("select * from " + table.name);
                    }).then(function (data) {
                        table.data = data;
                    });
                });

                return sequence.then(function () {
                    return tables;
                });
            }).then(function (tables) {
                res.render('test/connection', { tables: tables });
            }).catch(function (err) {
                console.error(err);
                res.end(err);
            });
    });
};
