var express = require('express'),
    pg = require('pg'),
    app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

// FIXME rewrite!
app.get('/test/connection', function (req, res) {
    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        if (err) return console.error('failed to connect to database', err);
        client.query("select table_name as name from information_schema.tables where table_schema = 'public'", function (err, result) {
            var tables, table_count;

            if (err) return console.error('failed to fetch table listing', err);

            tables = result.rows;
            table_count = 0;

            tables.forEach(function (table) {
                client.query("select * from information_schema.columns where table_name = $1", [table.name], function (err, result) {
                    if (err) return console.error('failed to fetch table columns', err);
                    table.columns = result.rows;
                    client.query("select * from " + table.name, function (err, result) {
                        if (err) return console.error('failed to fetch table contents', err);
                        table.data = result.rows;
                        if (++table_count == tables.length) {
                            done();
                            res.render('test/connection', { tables: tables });
                        }
                    });
                });
            });
        });
    });
});

app.listen(process.env.PORT || 5000);
