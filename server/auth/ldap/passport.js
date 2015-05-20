var passport = require('passport'),
    LdapStrategy = require('passport-ldapauth');

 var OPTS = {
  server: {
    url: 'ldap://ldap.marklogic.com',
    bindDn: 'CN=All-Employees,OU=Groups,OU=CORP,DC=marklogic,DC=com',
    bindCredentials: 'secret',
    searchBase: 'OU=CORP,DC=marklogic,DC=com',
    searchFilter: '(uid={{username}})'
  }

};

 exports.setup = function() {
 	console.log('ldap setup');
 	passport.use(new LdapStrategy(OPTS, function(req, user, done) {
 		console.log('req ===', req);
 		console.log('user', user);

 		done(null, user);
 	}));
 };   