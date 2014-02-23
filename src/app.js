var express = require('express'),
    app = express();

app.locals.moment = require('moment');

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.cookieParser(process.env.COOKIE_SECRET));
app.use(express.cookieSession());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(__dirname + '/../public'));

require('./controller/auth')(app);
require('./controller/main')(app);
require('./controller/clients')(app);
require('./controller/services')(app);
require('./controller/workers')(app);
require('./controller/appointments')(app);
require('./controller/reports')(app);
require('./controller/test')(app);

module.exports = app;
