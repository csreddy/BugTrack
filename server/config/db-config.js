var dev =  {
  host: "localhost",    // The database app server host
  port: 8003,           // By default port 8000 is enabled
  user: "rest-writer",       // A user with at least the rest-writer role
  password: "x", // Probably not your password
  authType: "DIGEST"    // The default auth
}

// Another connection. Change the module.exports below to 
// use it without having to change consuming code.
var test =  {
  host: "acceptance.example.com",
  port: 9116,
  user: "app-writer",
  password: "********",
  authType: "DIGEST"
}

module.exports = {
  connection: dev       // Export the development connection
}