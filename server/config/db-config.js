var dev =  {
  database: "bugtrack",
  modules: "bugtrack-modules",
  host: "localhost",    // The database app server host
  port: 8003,           // By default port 8000 is enabled
  user: "admin",       // A user with at least the rest-writer role
  password: "admin", // Probably not your password
  authType: "DIGEST"    // The default auth
}


// Another connection. Change the module.exports below to 
// use it without having to change consuming code.
var test =  {
  database: "bugtrackTestDB",
  modules: "bugtrackTestServer-modules",
  host: "localhost",
  port: 8004,
  user: "admin",
  password: "admin",
  authType: "DIGEST"
}

var prod =  {
  database: "bugtrack",
  modules: "bugtrack-modules",
  host: "localhost",
  port: 8003,
  user: "admin",
  password: "admin",
  authType: "DIGEST"
}


module.exports = {
  connection: test       // Export the development connection
}