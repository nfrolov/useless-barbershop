var express = require('express'),
    app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

require('./controller/test')(app);

module.exports = app;
