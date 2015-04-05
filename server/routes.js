/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

    // Task routes
    app.use('/api/tasks', require('./api/task'));
    app.use('/api/tasks/count', require('./api/task'));
    app.use('/api/tasks/new', require('./api/task'));
    app.use('/api/tasks/update', require('./api/task'));
    app.use('/api/tasks/:id(\\d+)', require('./api/task'));
    app.use('/api/tasks/subtasks', require('./api/task'));
    app.use('/api/tasks/:id(\\d+)/subscribe', require('./api/task'));
    app.use('/api/tasks/:id(\\d+)/unsubscribe', require('./api/task'));
    app.use('/api/tasks/insertProceduralTask', require('./api/task'));
    app.use('/api/tasks/insertSubTask', require('./api/task'));
    app.use('/api/tasks/createSubTask', require('./api/task'));
    app.use('/api/tasks/:version/parentAndSubTasks', require('./api/task'));
    

    // Auth route
    app.use('/auth', require('./auth'))
    
    // configure routes
    app.use('/api/configure', require('./api/configure'));
    app.use('/api/configure/update', require('./api/configure'));
    app.use('/api/configure/adduserstogroup', require('./api/configure'));
    app.use('/api/configure/removeusersfromgroup', require('./api/configure'));
    
    // User routes
    app.use('/api/user/', require('./api/user'));
    app.use('/api/user/:username', require('./api/user'));
    app.use('/api/user/savedefaultquery', require('./api/user'));
    app.use('/api/user/create', require('./api/user'));
    
    // Bug routes
    app.use('/api/bug', require('./api/bug'));
    app.use('/api/bug/:id(\\d+)', require('./api/bug'));
    app.use('/api/bug/:id(\\d+)/subscribe', require('./api/bug'));
    app.use('/api/bug/:id(\\d+)/unsubscribe', require('./api/bug'));
    app.use('/api/bug/:id(\\d+)/clones', require('./api/bug'));
    app.use('/api/bug/new', require('./api/bug'));
    app.use('/api/bug/newbugid', require('./api/bug'));
    app.use('/api/bug/update', require('./api/bug'));
    app.use('/api/bug/count', require('./api/bug'));
    app.use('/api/bug/facets', require('./api/bug'));
    app.use('/api/bug/clone', require('./api/bug'));
    
    // Search route
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