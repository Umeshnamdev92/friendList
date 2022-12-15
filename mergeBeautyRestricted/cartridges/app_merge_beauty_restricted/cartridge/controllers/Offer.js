var server = require('server');
//function to show offers on page which is navigating(redirect) through Recommendation page promotion banner.
server.get('Show', function (req, res, next) {
    res.render('offerisml');
    next();
});

module.exports =  server.exports()