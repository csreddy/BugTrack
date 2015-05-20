// Execute against Security Database

// create bugtrack-admin role;
declareUpdate();
var sec = require("/MarkLogic/security.xqy");
sec.createRole(
    "bugtrack-admin",
    "bugtrack admin role provides access to bugtrack configurtion settings",
    ["rest-admin", "rest-reader"],
    [],
    null)

// grant exec privilges
declareUpdate();
var sec = require("/MarkLogic/security.xqy");
sec.privilegeSetRoles("http://marklogic.com/xdmp/privileges/xdmp-eval", "execute", "bugtrack-admin")

// create bugtrack-user role;
declareUpdate();
var sec = require("/MarkLogic/security.xqy");
sec.createRole(
    "bugtrack-user",
    "bugtrack user role who can read and create bugs/tasks/rfes",
    ["rest-reader", "rest-writer"],
    [],
    null)