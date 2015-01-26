function getUserInfo(username){
  try{
  var users = fn.doc("root/support/bugtracking/users.xml").next().value.root;
  var user = users.xpath("/*:users/*:user/*:account-name[.= '"+ username +"']/..").next().value
  return {
              username:username,
              email:user.xpath("*:email/text()"),
              name:user.xpath("*:first-name/text()") + ' ' + user.xpath("*:last-name/text()")
            }
    } catch(e){
      e.toString()
    }  
    }

function capitalize(s)
{
   s = s.toString();
  return s[0].toUpperCase() + s.slice(1);
}

var total = [];
var json =  require("/MarkLogic/json/json.xqy");
var users = fn.doc("root/support/bugtracking/users.xml").next().value.root
var uris = cts.uriMatch("root/support/bugtracking/bug*.xml", ["limit=1000"])
     for (uri of uris){
       try{
      var xml =  fn.doc(uri).next().value.root 
      var doc =  json.transformToJson(xml, json.config("custom") )
       var bug = doc.root["bug-holder"].bug
       var newbug = {}
        newbug.id = parseInt(bug['bug-number'])
        newbug.kind = bug['bug-rfe']
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
          
         var submittedBy = bug['submit-info']['submitted-by']
        var user = fn.doc("root/support/bugtracking/users.xml").next().value.root;
try{ 
      var submitter = user.xpath("/*:users/*:user/*:account-name[.= '"+ submittedBy +"']/..").next().value
         newbug.submittedBy = getUserInfo(submittedBy) || {}
           } catch(e){
            throw new Error("submitter:"+e.toString());
           }       
      //  newbug.assignTo = {username: bug["assigned-to"]} | ''   // not working
        var assignedTo = xml.xpath("/*:bug-holder/*:bug/*:assigned-to/text()")
         var assignee = user.xpath("/*:users/*:user/*:account-name[.= '"+ assignedTo +"']/..").next().value
             newbug.assignTo = getUserInfo(assignedTo) || {}
              
               newbug.description = "<p><pre>"+bug['bug-description']['recreate-steps'].toString().replace('<http:', 'http:')+"</pre></p>"  || '' 
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
        newbug.subscribers = []
          for (var sub of xml.xpath("/*:bug-holder/*:bug/*:subscribers/*:subscriber")){
            if(sub.xpath("./text()").toString()){
               newbug.subscribers.push(getUserInfo(sub.xpath("./text()")))
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
                   updatedBy: getUserInfo(comment.xpath("*:commenter/text()")),
                  change: {}
                }
                    if(comment.xpath("*:old-status/text()").toString()){
                       change.change.status = {
                            from: capitalize(comment.xpath("*:old-status/text()")).toString() || '' , 
                            to: capitalize(comment.xpath("*:new-status/text()")) 
                            }
                       }
                // xdmp.log("======="+comment.xpath("*:new-to-be-fixed-in-version/text()").toString())
                 if(comment.xpath("*:new-to-be-fixed-in-version/text()").toString()){
                       change.change.tofixin = {
                            from:comment.xpath("*:old-to-be-fixed-in-version/text()") || '' , 
                            to: comment.xpath("*:new-to-be-fixed-in-version/text()") 
                            }
                       }
                 if(comment.xpath("*:assign-by/text()").toString()){  
                       change.change.assignTo = {
                        from: getUserInfo(comment.xpath("*:assign-by/text()")) || '' ,    
                         to: getUserInfo(comment.xpath("*:assigned-to/text()")) 
                            }
                       }
                 if(comment.xpath("*:svn/*:revision/text()").toString().length > 0){
                       change.svn = {
                         repository: comment.xpath("*:svn/*:repository/text()"),
                         revision: comment.xpath("*:svn/*:revision/text()"),
                         paths: comment.xpath("*:svn/*:paths/*:path/text()")
                       }
                       }
                 
                 
                 if(comment.xpath("*:old-category/text()").toString()){
                       change.change.category = {
                         to: comment.xpath("*:old-category/text()"),    
                         to: comment.xpath("*:new-category/text()") 
                            }
                       }
                 if(comment.xpath("*:old-severity/text()").toString()){
                       change.change.severity = {
                         to: comment.xpath("*:old-severity/text()"),    
                         to: comment.xpath("*:new-severity/text()") 
                            }
                       }
                    
                    if(comment.xpath("*:comment-text/text()").toString()){
                      change.comment = comment.xpath("*:comment-text/text()")
                    }
                 
                 newbug.changeHistory.push(change)
               }
   var str = 'declareUpdate(); xdmp.documentInsert("/bug/" + newBug.id + "/" + newBug.id + ".json", newBug, null, ["bugs", newBug.submittedBy.username])'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
   xdmp.eval(str, {newBug: newbug}, {database: xdmp.database('bugtrack')});
    total.push(newbug.id)
    "total bugs loaded: "+ total.length + "\n" + "elapsed time: "+xdmp.elapsedTime() 
      } catch(e){
        newbug.id + ' : ' + e.toString()
      }      
}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     