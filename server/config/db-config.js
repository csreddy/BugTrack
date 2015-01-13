var dev =  {
  database: "bugtrack",
  host: "localhost",    // The database app server host
  port: 8003,           // By default port 8000 is enabled
  user: "admin",       // A user with at least the rest-writer role
  password: "admin", // Probably not your password
  authType: "DIGEST"    // The default auth
}


// Another connection. Change the module.exports below to 
// use it without having to change consuming code.
var test =  {
  database: "Documents",
  host: "localhost",
  port: 8004,
  user: "admin",
  password: "admin",
  authType: "DIGEST"
}

module.exports = {
  connection: dev       // Export the development connection
}