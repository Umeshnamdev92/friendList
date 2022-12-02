'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

server.get('new', cache.applyDefaultCache, function (req, res, next) {
    var new_Data = server.forms.getForm('Certificate');
    res.render('GiftCertificate', {
        drx : new_Data
    });
    next();
});
module.exports = server.exports();