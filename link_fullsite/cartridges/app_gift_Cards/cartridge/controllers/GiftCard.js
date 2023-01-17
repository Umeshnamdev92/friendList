'use strict';
const server = require('server');

server.get('gifts',function(req, res, next) {
    res.render('customizeGifts');
    next();
})

module.exports = server.exports();
