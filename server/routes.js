/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

    // Insert routes below
    app.use('/api/configure', require('./api/configure'));
    app.use('/api/configure/update', require('./api/configure'));
    app.use('/api/user/', require('./api/user'));
    app.use('/api/user/:username', require('./api/user'));
    app.use('/api/user/savedefaultquery', require('./api/user'));
    app.use('/api/user/create', require('./api/user'));
    app.use('/api/bug', require('./api/bug'));
    app.use('/api/bug/:id(\\d+)', require('./api/bug'));
    app.use('/api/bug/new', require('./api/bug'));
    app.use('/api/bug/count', require('./api/bug'));
    app.use('/api/bug/facets', require('./api/bug'));
    app.use('/api/search', require('./api/search'));

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
        .get(errors[404]);

    // All other routes should redirect to the index.html
    app.route('/*')
        .get(function(req, res) {
            res.sendfile(app.get('appPath') + '/index.html');
        });
};