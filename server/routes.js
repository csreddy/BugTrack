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
    app.use('/api/tasks/:id(\\d+)/toggleTaskListInclusion', require('./api/task'));
    app.use('/api/tasks/insertProceduralTask', require('./api/task'));
    app.use('/api/tasks/insertSubTask', require('./api/task'));
    app.use('/api/tasks/createSubTask', require('./api/task'));
    app.use('/api/tasks/:version/parentAndSubTasks', require('./api/task'));

     // RFE routes
    app.use('/api/rfes', require('./api/rfe'));
    app.use('/api/rfes/count', require('./api/rfe'));
    app.use('/api/rfes/new', require('./api/rfe'));
    app.use('/api/rfes/update', require('./api/rfe'));
    app.use('/api/rfes/:id(\\d+)', require('./api/rfe'));
    app.use('/api/rfes/subtasks', require('./api/rfe'));
    app.use('/api/rfes/:id(\\d+)/subscribe', require('./api/rfe'));
    app.use('/api/rfes/:id(\\d+)/unsubscribe', require('./api/rfe'));
    app.use('/api/rfes/:version/parentAndSubTasks', require('./api/rfe'));
    app.use('/api/rfes/insertProceduralTask', require('./api/rfe'));
    app.use('/api/rfes/insertSubTask', require('./api/rfe'));
    

    // Auth route
    app.use('/auth', require('./auth'))
    
    // configure routes
    app.use('/api/configure', require('./api/configure'));
    app.use('/api/configure/update', require('./api/configure'));
    app.use('/api/configure/adduserstogroup', require('./api/configure'));
    app.use('/api/configure/removeusersfromgroup', require('./api/configure'));
    
    // User routes
    app.use('/api/users/', require('./api/user'));
    app.use('/api/users/:username', require('./api/user'));
    app.use('/api/users/savedefaultquery', require('./api/user'));
    app.use('/api/users/saveQuery', require('./api/user'));
    app.use('/api/users/deleteQuery', require('./api/user'));
    app.use('/api/users/create', require('./api/user'));
    
    // Bug routes
    app.use('/api/bugs', require('./api/bug'));
    app.use('/api/bugs/:id(\\d+)', require('./api/bug'));
    app.use('/api/bugs/:id(\\d+)/subscribe', require('./api/bug'));
    app.use('/api/bugs/:id(\\d+)/unsubscribe', require('./api/bug'));
    app.use('/api/bugs/:id(\\d+)/clones', require('./api/bug'));
    app.use('/api/bugs/new', require('./api/bug'));
    app.use('/api/bugs/newbugid', require('./api/bug'));
    app.use('/api/bugs/update', require('./api/bug'));
    app.use('/api/bugs/count', require('./api/bug'));
    app.use('/api/bugs/facets', require('./api/bug'));
    app.use('/api/bugs/clone', require('./api/bug'));
    
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