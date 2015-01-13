var express = require('express');
var flash = require('connect-flash');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
    res.locals.errors = req.flash();
    console.log(res.locals.errors);
    res.render('login', {
        errors: res.locals.errors
    });
    // res.sendfile('views/login.html', {
    //     errors: res.locals.errors
    // });
    //    res.send('<a href="/#/new">Users page</a>');
});
module.exports = router;