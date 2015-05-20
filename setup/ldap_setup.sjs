// Execute against Security Database
declareUpdate();
var sec = require("/MarkLogic/security.xqy");
  sec.createExternalSecurity(
        "ldapconfig", 
        "LDAP Auth Config for BugTrack", 
        "ldap", 
        300,
        "ldap", 
        "ldap://ldap.marklogic.com", 
        "OU=CORP,DC=marklogic,DC=com", 
        "sAMAccountName",
        "",
	    "",
    	"MD5")
