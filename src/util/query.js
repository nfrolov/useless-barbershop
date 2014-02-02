var pg = require('pg'),
    when = require('when');

module.exports = function (query, params) {
    return when.promise(function (resolve, reject) {
        pg.connect(process.env.DATABASE_URL, function (err, client, done) {
            if (err) return done(), reject(err);
            client.query(query, params, function (err, result) {
                done();
                if (err) return reject(err);
                resolve(result.rows);
            });
        });
    });
};
