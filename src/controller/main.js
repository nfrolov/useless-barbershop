module.exports = function (app) {
    app.get('/', function (req, res) {
        res.render('main/index', {
            user: req.user
        });
    });
};
