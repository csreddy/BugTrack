function getUserInfo(users, username){
  try{
  //var users = fn.doc("root/support/bugtracking/users.xml").next().value.root;
  var user = users.xpath("/bt:users/bt:user/bt:account-name[.= '"+ username +"']/..").next().value  
      print(typeof username)
      var userInfo = {
              username:username.toString(),
              email:user.xpath("bt:email/text()").toString(),
              name:user.xpath("bt:first-name/text()") + ' ' + user.xpath("bt:last-name/text()").toString()   
            }
    //  print(JSON.stringify(userInfo))
          return userInfo
    } catch(e){
      e.toString()
    }  
    }

function capitalize(s)
{
   s = s.toString();
  return s[0].toUpperCase() + s.slice(1);
}

function htmlEncode(html){
  return html.toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function flatten(arrayOfArrays){
 var flattened;
    if(arrayOfArrays[0].length ===1){
    flattened = arrayOfArrays[0]
  } else{
  flattened = arrayOfArrays.reduce(function(a, b) {
  return a.concat(b);
}); 
  } 
  return flattened
}

function isPresent(array, username) {
  //print(JSON.stringify(array))
            var index = false;
            for (var i = 0; i < array.length; i++) {
                if (array[i].username === username) {
                    index = true;
                }
            }
            return index;
        }

function convertBug(doc){
//  try{
       var bug = doc.root["bug-holder"].bug
      
       var submittedBy = bug['submit-info']['submitted-by']
       var users = fn.doc("root/support/bugtracking/users.xml").next().value.root;
     var submitter = users.xpath("/*:users/*:user/*:account-name[.= '"+ submittedBy +"']/..").next().value
      var assignedTo = xml.xpath("/*:bug-holder/*:bug/*:assigned-to/text()")
         var assignee = users.xpath("/*:users/*:user/*:account-name[.= '"+ assignedTo +"']/..").next().value
         var subscribers = xml.xpath("/*:bug-holder/*:bug/*:subscribers/*:subscriber")     
     var newbug = {}   
    newbug.id = parseInt(bug['bug-number'])
        newbug.kind = bug['bug-rfe']
          if(newbug.kind.toString() === 'Bug'){
            newbug.createdAt = bug["submit-info"].timestamp || ''
        newbug.status = capitalize(bug.status) || ''
        newbug.title = bug['bug-description']['general-description'] || ''
        newbug.category = bug.category || ''
        newbug.severity = capitalize(bug.severity) || ''
          switch (newbug.severity){
            case 'Catastrophic':
              newbug.severity = "P1 - " + newbug.severity
              break;
            case 'Critical':
              newbug.severity = "P2 - " + newbug.severity
              break;
            case 'Major':
              newbug.severity = "P3 - " + newbug.severity
              break;
            case 'Minor':
              newbug.severity = "P4 - " + newbug.severity
              break;
            case 'Aesthetic':
              newbug.severity = "P5 - " + newbug.severity
              break;
            case 'Performance':
              // do nothing
              break;   
          }
          
        newbug.priority = parseInt(bug.priority) || {}
          switch (newbug.priority){
            case 1:
              newbug.priority = {'level': "1", 'title': 'Drop everything and fix'}
              break;
            case 2:
              newbug.priority = {'level': "2", 'title': 'A customer is waiting for this'}
              break;      
            case 3:
              newbug.priority = {'level': "3", 'title': 'Very important'}
              break;
            case 4:
              newbug.priority = {'level': "4", 'title': 'Important'}
              break;  
            case 5:
              newbug.priority = {'level': "5", 'title': 'Fix if time permits'}
              break;
            case 6:
              newbug.priority = {'level': "6", "title": "Probably won't fix but worth remembering"}
              break;
            case 7:
              newbug.priority = {'level': "7", 'title': 'Do not fix'}
              break;      
          }
          
        
       try{ 
         newbug.submittedBy = getUserInfo(users, submittedBy) || {}
           } catch(e){
            throw new Error("submitter:"+e.toString());
           }       
      //  newbug.assignTo = {username: bug["assigned-to"]} | ''   // not working
        
             newbug.assignTo = getUserInfo(users,assignedTo) || {}
              
               newbug.description = "<p><pre id='description'>"+htmlEncode(bug['bug-description']['recreate-steps'])+"</pre></p>"  || '' 
        newbug.samplequery = bug['bug-description']['sample-query'] || ''
        newbug.sampledata = bug['bug-description']['sample-content'] || ''
       // no stacktrace  
        newbug.version = bug.environment.version || ''
        newbug.tofixin = bug['to-be-fixed-in-versions'] || ''
        newbug.fixedin = bug['fixed-in-versions'] || ''  
        newbug.platform = bug.environment.platform || 'all'
        newbug.memory = bug.environment['memory-size'] || ''
        newbug.processors =  bug.environment['number-cpus'] || ''
        newbug.note = bug.environment.note || ''
        newbug.subscribers = [newbug.submittedBy] 
            if(newbug.submittedBy.username.toString() !== newbug.assignTo.username.toString() && newbug.assignTo.username.toString() !== 'nobody'){
             newbug.subscribers.push(newbug.assignTo)
          } 
              for (var sub of subscribers){
             //   print('++++++++'+JSON.stringify(newbug.subscribers))
           // print(sub.xpath("./text()").toString())
           // print(isPresent(newbug.subscribers, sub.xpath("./text()").toString()))
            if(sub.xpath("./text()").toString() && !isPresent(newbug.subscribers, sub.xpath("./text()").toString())){
               newbug.subscribers.push(getUserInfo(users, sub.xpath("./text()")))
               }
          }
             
          
          
        newbug.attachments = []   
//          xdmp.log("-------------"+fn.count(xml.xpath("/*:bug-holder/*:bug/*:attachments/*")))
          if(fn.count(xml.xpath("/*:bug-holder/*:bug/*:attachments/*")) > 0){
             for(var att of  xml.xpath("/*:bug-holder/*:bug/*:attachments")){
            newbug.attachments.push({
              name: att.xpath("*:attachment/@name"),
              uri: att.xpath("*:attachment/text()")
            })
          }
             }
          
if(bug.relationships){
     newbug.relationships = [{
          type: bug.relationships.relation.type || '', 
          to: bug.relationships.relation.to || ''
          }]  || [] 
   }
      
       newbug.clones = []  
       newbug.supportDescription = bug['support-description'] || ''
       newbug.workaround = bug["support-workaround"] || ''   
       newbug.publishStatus = bug.publish || ''
       newbug.customerImpact = bug["support-customer-impact"] || ''
       newbug.tickets = bug['support-tickets'] || ''
       newbug.changeHistory = []   
           var comments = xml.xpath("//*:comment-log/*:comment")
           var changeCount = fn.count(comments)      
               for (var comment of comments){
                var change = {
                   time: comment.xpath("*:timestamp/text()"),
                   updatedBy: getUserInfo(users, comment.xpath("*:commenter/text()")),
                  change: {},
                  files:[],
                  show: false
                }
                    if(comment.xpath("*:old-status/text()").toString()){
                       change.change.status = {
                            from: capitalize(comment.xpath("*:old-status/text()")).toString() || '' , 
                            to: capitalize(comment.xpath("*:new-status/text()")) 
                            }
                         change.show = true;
                       }
                // xdmp.log("======="+comment.xpath("*:new-to-be-fixed-in-version/text()").toString())
                 if(comment.xpath("*:new-to-be-fixed-in-version/text()").toString()){
                       change.change.tofixin = {
                            from:comment.xpath("*:old-to-be-fixed-in-version/text()") || '' , 
                            to: comment.xpath("*:new-to-be-fixed-in-version/text()") 
                            }
                          change.show = true;
                       }
                 if(comment.xpath("*:assign-by/text()").toString()){  
                       change.change.assignTo = {
                        from: getUserInfo(comment.xpath("*:assign-by/text()")) || '' ,    
                         to: getUserInfo(comment.xpath("*:assigned-to/text()")) 
                            }
                          change.show = true;
                       }
                 if(comment.xpath("*:svn/*:revision/text()").toString().length > 0){
                       change.svn = {
                         repository: comment.xpath("*:svn/*:repository/text()"),
                         revision: comment.xpath("*:svn/*:revision/text()"),
                         paths: comment.xpath("*:svn/*:paths/*:path/text()").toArray()
                       }
                          change.show = true;
                       }
                 
                 
                 if(comment.xpath("*:old-category/text()").toString()){
                       change.change.category = {
                         to: comment.xpath("*:old-category/text()"),    
                         to: comment.xpath("*:new-category/text()") 
                            }
                          change.show = true;
                       }
                 if(comment.xpath("*:old-severity/text()").toString()){
                       change.change.severity = {
                         to: comment.xpath("*:old-severity/text()"),    
                         to: comment.xpath("*:new-severity/text()") 
                            }
                          change.show = true;
                       }
                    
                    if(comment.xpath("*:comment-text/text()").toString()){
                      change.comment = comment.xpath("*:comment-text/text()")
                      change.show = true;
                    }
                 
                 newbug.changeHistory.push(change)
               } 
            
             }
     return newbug
 /*     } catch(e){
        newbug.id + ' : ' + e.toString()
      }  
*/
}

function loadConvertedDoc(doc){
var str = null;
  //print("===="+ JSON.stringify(doc))
  if(doc.kind.toString() === 'Bug'){
     str = 'declareUpdate(); xdmp.documentInsert("/bug/" + newBug.id + "/" + newBug.id + ".json", newBug, null, ["bugs", newBug.submittedBy.username])'
     xdmp.eval(str, {newBug: doc}, {database: xdmp.database('bugtrack')});
     xdmp.log("loaded /bug/" +doc.id + '/' + doc.id+ '.json' )  
     total++;
   }

  /* TODO: for Task
  if(doc.kind.toString() === 'Task'){
    str = 'declareUpdate(); xdmp.documentInsert("/task/" + newTask.id + "/" + newTask.id + ".json", newTask, null, ["tasks", newTask.submittedBy.username])'
     xdmp.eval(str, {newTask: doc}, {database: xdmp.database('bugtrack')});
     xdmp.log("loaded /task/" +doc.id + '/' + doc.id+ '.json' )  
     total++;
  }
*/
   
   return "total docs loaded: "+ total + "\n" + "elapsed time: "+xdmp.elapsedTime() 
}


var total = 0;
var json =  require("/MarkLogic/json/json.xqy");
var users = fn.doc("root/support/bugtracking/users.xml").next().value.root
var uris = cts.uriMatch("root/support/bugtracking/bug32190.xml")
     for (uri of uris){
       var xml = fn.doc(uri).next().value.root 
       var doc =  json.transformToJson(xml, json.config("custom") )
       var kind = doc.root["bug-holder"].bug['bug-rfe']
       var convertedDoc;
       if(kind.toString() === 'Bug'){
       loadConvertedDoc(convertBug(doc))
       }
       if(kind.toString() === 'Task'){
         print('Task')
        }
       
}
