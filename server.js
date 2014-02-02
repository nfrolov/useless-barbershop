var app = require('./src/app'),
    port = process.env.PORT || 5000;

app.listen(port, function () {
    console.info('listening on port %d', port);
});
