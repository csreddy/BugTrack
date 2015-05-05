 var admin = require("/MarkLogic/admin.xqy");  
 var elements = ["kind","id", "status","submittedBy", "assignTo", "category", "priority", "severity", "version", "platform", "fixedin", "tofixin", "publishStatus"]
     for (var i=0;i<elements.length; i++){
 var config = admin.getConfiguration(); 
 var dbid = xdmp.database("bugtrack"); 
 var rangespec = admin.databaseRangeElementIndex("string", "", elements[i], "http://marklogic.com/collation/",false ); 
 var config = admin.databaseAddRangeElementIndex(config, dbid, rangespec); 
admin.saveConfiguration(config);
     }
 

 var elements = ["createdAt", "updatedAt", "fixedAt", "shippedAt", "closedAt", 'sentBackToFixAt']
     for (var i=0;i<elements.length; i++){
 var config = admin.getConfiguration(); 
 var dbid = xdmp.database("bugtrack"); 
 var rangespec = admin.databaseRangeElementIndex("dateTime", "", elements[i], "" ,false ); 
 var config = admin.databaseAddRangeElementIndex(config, dbid, rangespec); 
admin.saveConfiguration(config);
     }
 
 
 var elements = ["id"]; 
 for (var i=0;i<elements.length; i++){
 var config = admin.getConfiguration(); 
 var dbid = xdmp.database("bugtrack"); 
 var rangespec = admin.databaseRangeElementIndex("int", "", elements[i], "",false ); 
 var config = admin.databaseAddRangeElementIndex(config, dbid, rangespec); 
admin.saveConfiguration(config);
 }
 

 
 var paths = ["/submittedBy/username", "/submittedBy/name", "/assignTo/username", "/assignTo/name", "/shippedBy/username", "/fixedBy/username", "/closedBy/username", "/priority/level", "/priority/title"];
 for (var i=0;i<paths.length; i++){
 var config = admin.getConfiguration(); 
 var dbid = xdmp.database("bugtrack"); 
 var pathspec = admin.databaseRangePathIndex(dbid, "string", paths[i], "http://marklogic.com/collation/",false, "ignore"); 
 var config = admin.databaseAddRangePathIndex(config, dbid, pathspec); 
 admin.saveConfiguration(config);
 }

  var elements = ["last-modified"]
  for (var i=0;i<elements.length; i++){
 var config = admin.getConfiguration(); 
 var dbid = xdmp.database("bugtrack"); 
 var rangespec = admin.databaseRangeElementIndex("dateTime", "http://marklogic.com/xdmp/property", elements[i], "" ,false ); 
 var config = admin.databaseAddRangeElementIndex(config, dbid, rangespec); 
admin.saveConfiguration(config);
     }