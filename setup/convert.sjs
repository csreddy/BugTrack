var json = require("/MarkLogic/json/json.xqy");
var users = getUsers().root.users.user;
var total=0;
var problematicXML = [];

// capitalises the first letter in a string
function capitalize(s) {
    try {
        s = s.toString();
        return s[0].toUpperCase() + s.slice(1);
    } catch (e) {
        return ''
    }
}

// encodes offenisive strings with html encoding
function htmlEncode(html) {
    return html.toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// flattens a given nested array
function flatten(arrayOfArrays) {
    var flattened;
    if (arrayOfArrays[0].length === 1) {
        flattened = arrayOfArrays[0]
    } else {
        flattened = arrayOfArrays.reduce(function (a, b) {
            return a.concat(b);
        });
    }
    return flattened
}

// returns boolean whether the given bug/task is flagged to be included in task list or not
function includeInTaskList(json) {
    var bool = false;
    try {
        bool = JSON.parse(json['task-list'].include);
        return bool
    } catch (e) {
        return bool;
    }
}

// transforms users xml bug/task/rfe to json
function getUsers() {
    var xml = cts.doc("root/support/bugtracking/users.xml").root;
    var config = json.config("custom");
    config["array-element-names"] = "user";
    config["element-namespace"] = "http://cerisent.com/bugtrack";
    config["element-namespace-prefix"] = "bt";
    return json.transformToJson(xml, config)
}

// get user info based on given username
function getUserInfo(username) {
    var fullInfo;
    var user;
   // xdmp.log('username: '+ username);
    try{
      fullInfo =  JSON.parse(users.xpath("//account-name[. = '" + username + "']/.."));
        user =  {
            username: fullInfo['account-name'] || '',
            name: fullInfo['first-name'] + ' ' + fullInfo['last-name'] || '',
            email: fullInfo['email'] || ''
        };
   }catch(e) {
        user = {
            usermame: '',
            name: '',
            email: ''
        };
    }
    return user;
}

// check if user is present in the list
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


// return parent type
function parentType(bug){
    try{
      //  xdmp.log(bug.relationships.relation.type)
        if(bug.relationships.relation){
            //   return parseInt(bug.relationships.relation.type);
            switch(bug.relationships.relation.type){
                case 'Requirements task for':
                   return 'Requirements Task';
                    break;
                case 'Functional Spec task for':
                    return 'Functional Specification Task';
                    break;
                case 'Test Specification task for':
                    return 'Test Specification Task';
                    break;
                case 'Test Automation task for':
                    return 'Test Automation Task';
                    break;
                case 'Documentation task for':
                    return 'Documentation Task';
                    break;
                case 'Sub-task of':
                   return "Sub-task"
                default:
                    xdmp.log('did not match any criteria in parent type');
                    return '';
            }
        }
    } catch(e){
        xdmp.log(e.toString())
        return ''
    }
}

// return the parent id
function parentId(bug){
    try{
        if(bug.relationships.relation){
            return bug.relationships.relation.to;
        }
    } catch(e){
        return '';
    }
}
// return parent type of the subtask
function isTaskOrRfe(bug){
    var taskOrRfe = '';
    var parentId = bug.relationships.relation.to;
    try{
       // var parent = xdmp.eval("cts.doc('/bug/'+parentId + '/' + parentId + '.json')", {parentId: parentId}, {database: xdmp.database('bugtrack')}).next().value.root.toObject();
       // taskOrRfe = parent['bug-rfe']
        taskOrRfe = cts.doc("root/support/bugtracking/bug"+parentId+".xml").root.xpath("/bt:bug-holder/bt:bug/bt:bug-rfe/text()").toString();
        return fn.lowerCase(taskOrRfe);
    } catch(e){
        return taskOrRfe;
    }
}

// return whether task is included in tasklist or not
function includeInTaskList(bug){
    var bool =  false;
    try{
        bool = JSON.parse(bug['task-list'].include)
        return bool
    } catch(e){
        return bool;
    }
}

function updateCloneParent(parentId, cloneId){
    var parent = xdmp.eval("cts.doc('/bug/'+parentId + '/' + parentId + '.json')", {parentId: parentId}, {database: xdmp.database('bugtrack')}).next().value.root.toObject()
    parent.clones.push(cloneId);
    loadDoc(parent);
}

function updateSubTaskParent(relation, subtaskId){
    var parentType = cts.doc("root/support/bugtracking/bug"+relation.id+".xml").root.xpath("/bt:bug-holder/bt:bug/bt:bug-rfe/text()").toString();
    var parent;
    if(parentType === 'Task'){
            parent = xdmp.eval("cts.doc('/task/'+parentId + '/' + parentId + '.json')", {parentId: relation.id}, {database: xdmp.database('bugtrack')}).next().value.root.toObject()
            parent.subTasks.push(subtaskId);
            loadDoc(parent);
        }
    if(parentType === 'RFE'){
        parent = xdmp.eval("cts.doc('/rfe/'+parentId + '/' + parentId + '.json')", {parentId: relation.id}, {database: xdmp.database('bugtrack')}).next().value.root.toObject();
            switch(relation.type){
                case 'Requirements Task':
                    parent.proceduralTasks['Requirements Task'].push(subtaskId);
                    break;
                case 'Functional Specification Task':
                    parent.proceduralTasks['Functional Specification Task'].push(subtaskId);
                    break;
                case 'Test Specification Task':
                    parent.proceduralTasks['Test Specification Task'].push(subtaskId);
                    break;
                case 'Test Automation Task':
                    parent.proceduralTasks['Test Automation Task'].push(subtaskId);
                    break;
                case 'Documentation Task':
                    parent.proceduralTasks['Documentation Task'].push(subtaskId);
                    break;
                case 'Sub-task':
                    parent.subTasks.push(subtaskId)
                    break;
                default:
                    xdmp.log('did not match any criteria for relation: '+ relation.type)
            }
            loadDoc(parent);
    }

}

// transforms xml bug/task/rfe to json
function convertXMLToJSON(uri) {
    var xml = cts.doc(uri).root;
    var config = json.config("custom");
    config["array-element-names"] = ["comment"];
    config["element-namespace"] = "http://cerisent.com/bugtrack";
    config["element-namespace-prefix"] = "bt";
    return json.transformToJson(xml, config);
}

function convertXMLToJSON2(uri) {
    var str = 'xquery version "1.0-ml"; \
    import module namespace json="http://marklogic.com/xdmp/json" \
     at "/MarkLogic/json/json.xqy"; \
        declare variable $uri as xs:string external; \
        let $xml := fn:doc($uri) \
        let $custom := \
        let $config := json:config("custom") \
            return \
                (map:put($config, "array-element-names",("comment", "subscriber", "attachment", "path", "support-ticket")), \
                 map:put($config, "element-namespace", "http://cerisent.com/bugtrack"), \
                 map:put($config, "element-namespace-prefix", "bt"), \
                 $config) \
        return json:transform-to-json( $xml , $custom)';
    return xdmp.xqueryEval(str, {uri: uri}).next().value;
}

function loadDoc(doc){
    var str = null;
    //print("===="+ JSON.stringify(doc))
    if(doc.kind.toString() === 'Bug'){
        str = 'declareUpdate(); xdmp.documentInsert("/bug/" + newBug.id + "/" + newBug.id + ".json", newBug, null, ["bugs", newBug.submittedBy.username])'
        xdmp.eval(str, {newBug: doc}, {database: xdmp.database('bugtrack')});
        xdmp.log("loaded /bug/" +doc.id + '/' + doc.id+ '.json' )
        total++;
    }

    // for Task
    if(doc.kind.toString() === 'Task'){
        str = 'declareUpdate(); xdmp.documentInsert("/task/" + newTask.id + "/" + newTask.id + ".json", newTask, null, ["tasks", newTask.submittedBy.username])'
        xdmp.eval(str, {newTask: doc}, {database: xdmp.database('bugtrack')});
        xdmp.log("loaded /task/" +doc.id + '/' + doc.id+ '.json' )
        total++;
    }
   // for RFE
    if(doc.kind.toString() === 'RFE'){
        str = 'declareUpdate(); xdmp.documentInsert("/rfe/" + newRfe.id + "/" + newRfe.id + ".json", newRfe, null, ["rfes", newRfe.submittedBy.username])'
        xdmp.eval(str, {newRfe: doc}, {database: xdmp.database('bugtrack')});
        xdmp.log("loaded /rfe/" +doc.id + '/' + doc.id+ '.json' )
        total++;
    }


    return "total docs loaded: "+ total + "\n" + "elapsed time: "+xdmp.elapsedTime()
}

// formats given bug json to new format
function convertBug(doc) {
    var bug = doc.root["bug-holder"].bug.toObject();
    var submittedBy = bug['submit-info']['submitted-by'];

    if(submittedBy === ''){
        submittedBy = bug['github-data']['github-created-by'];
    }
    var submitter = getUserInfo(submittedBy);
    var assignedTo = bug['assigned-to'];
    var assignee = getUserInfo(assignedTo);
    var subscribers = [];

    if(bug.subscribers){
        if(bug.subscribers.subscriber){
          subscribers = flatten([bug.subscribers.subscriber])
        }
    }

    var newbug = {}
    newbug.id = parseInt(bug['bug-number']);
    newbug.kind = bug['bug-rfe'];
    if (newbug.kind.toString() === 'Bug') {
        newbug.createdAt = bug["submit-info"].timestamp || '';
        newbug.status = capitalize(bug.status) || ''
        newbug.title = bug['bug-description']['general-description'] || ''
        newbug.category = bug.category || ''
        newbug.severity = capitalize(bug.severity) || ''
        switch (newbug.severity) {
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
        switch (newbug.priority) {
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


        try {
            newbug.submittedBy = getUserInfo(submittedBy) || {}
        } catch (e) {
            throw new Error("submitter:" + e.toString());
        }
        //  newbug.assignTo = {username: bug["assigned-to"]} | ''   // not working

        newbug.assignTo = getUserInfo(assignedTo) || {}

        newbug.description = "<p><pre id='description'>" + htmlEncode(bug['bug-description']['recreate-steps']) + "</pre></p>" || ''
        newbug.samplequery = bug['bug-description']['sample-query'] || ''
        newbug.sampledata = bug['bug-description']['sample-content'] || ''
        // no stacktrace
        newbug.version = bug.environment.version || ''
        newbug.tofixin = bug['to-be-fixed-in-versions'] || ''
        newbug.fixedin = bug['fixed-in-versions'] || ''
        newbug.platform = bug.environment.platform || 'all'
        newbug.memory = bug.environment['memory-size'] || ''
        newbug.processors = bug.environment['number-cpus'] || ''
        newbug.note = bug.environment.note || ''
        newbug.subscribers = [newbug.submittedBy]
        if (newbug.submittedBy.username.toString() !== newbug.assignTo.username.toString() && newbug.assignTo.username.toString() !== 'nobody') {
            newbug.subscribers.push(newbug.assignTo)
        }

          for (var s=0; s<subscribers.length; s++){
              if(subscribers[s] && !isPresent(newbug.subscribers, subscribers[s])){
                  newbug.subscribers.push(getUserInfo(subscribers[s]))
              }

          }

        newbug.attachments = []
        if((typeof bug.attachments) == 'Array'){
            if (bug.attachments.attachment.length > 0) {
                for (var att of bug.attachments.attachment)
                {
                    newbug.attachments.push({
                        name: att.name,
                        uri: att._value
                    })
                }
            }
        }


        if (bug.relationships) {
            newbug.relationships = [{
                    type: bug.relationships.relation.type || '',
                    to: bug.relationships.relation.to || ''
                }] || []
        }

        newbug.clones = [];
        newbug.cloneOf = parseInt(bug['clone-original']) || '';

        var tkts = [];
        if((typeof bug['support-tickets']) === "string"){
            tkts = [];
        }

        if(bug['support-tickets']) {
            if(bug['support-tickets']['support-ticket']){
                tkts = bug['support-tickets']['support-ticket'];
            }

        }
        newbug.support = {
            headline: bug['title'] || '', // need to verify this
            supportDescription: bug['support-description'] || '',
            workaround: bug['support-workaround'] || '',
            publishStatus: bug['publish'] || '',
            tickets: tkts,
            customerImpact: bug['support-customer-impact'] || 'N/A'
        }

        newbug.changeHistory = [];
        var comments = bug['comment-log'].comment || [];
        var changeCount = comments.length;
        for(var c=0; c<changeCount; c++){
            var comment = comments[c];
          //  xdmp.log(comment);
            var change = {
                time: comment.timestamp,
                updatedBy: getUserInfo(comment.commenter),
                change: {},
                files: [],
                show: false
            };
            if (comment['old-status']) {
                change.change.status = {
                    from: capitalize(comment['old-status']) || '',
                    to: capitalize(comment['new-status']) || ''
                }
                change.show = true;
            }

            if (comment['new-to-be-fixed-in-version']) {
                change.change.tofixin = {
                    from: comment['old-to-be-fixed-in-version'] || '',
                    to: comment['new-to-be-fixed-in-version'] || ''
                }
                change.show = true;
            }

            if (comment['assign-by']) {
                change.change.assignTo = {
                    from: getUserInfo(comment['assign-by']) || getUserInfo(comment.commenter),
                    to: getUserInfo(comment['assigned-to'])
                }
                change.show = true;
            }


            if (comment.svn) {
                change.svn = {
                    repository: comment.svn.repository,
                    revision: comment.svn.revision,
                    paths: comment.svn.paths.path,
                    affectedBugs: comment.svn['affected-bugs']
                }
                change.show = true;
            }


            if (comment['old-category']) {
                change.change.category = {
                    to: comment['old-category'] || '',
                    to: comment['new-category'] || ''
                }
                change.show = true;
            }

            if (comment['old-severity']) {
                change.change.severity = {
                    to: comment['old-severity'] || '',
                    to: comment['new-severity'] || ''
                }
                change.show = true;
            }

            if (comment['comment-text']) {
                change.comment = comment['comment-text'] || '';
                change.show = true;
            }

            newbug.changeHistory.push(change)
        }

    }
    newbug['github-data'] = bug['github-data']; // need to revisit this after everything is done

   // JSON.stringify(newbug, null, 2);
    return newbug
}


function convertTask(doc) {
    var bug = doc.root["bug-holder"].bug.toObject();
    var submittedBy = bug['submit-info']['submitted-by'];
    if (submittedBy === '') {
        submittedBy = bug['github-data']['github-created-by'];
    }
    var submitter = getUserInfo(submittedBy);
    var assignedTo = bug['assigned-to'];
    var assignee = getUserInfo(assignedTo);
    var subscribers = [];

    if (bug.subscribers) {
        if (bug.subscribers.subscriber) {
            subscribers = flatten([bug.subscribers.subscriber])
        }
    }

    var newbug = {}
    newbug.id = parseInt(bug['bug-number']);
    newbug.kind = bug['bug-rfe'];
    if (newbug.kind.toString() === 'Task' || newbug.kind.toString() === 'RFE') {
        newbug.createdAt = bug["submit-info"].timestamp || '';
        newbug.status = capitalize(bug.status) || ''
        newbug.title = bug['bug-description']['general-description'] || ''
        newbug.category = bug.category || ''
        newbug.severity = capitalize(bug.severity) || ''
        switch (newbug.severity) {
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
        //  xdmp.log('------------------1')
        newbug.priority = parseInt(bug.priority) || {}
        switch (newbug.priority) {
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
       if(newbug.kind === 'Task'){
           newbug.days =  "";
           newbug.period =  {
               startDate: "",
               endDate: ""
           };
       }

        try {
            newbug.submittedBy = getUserInfo(submittedBy) || {}
        } catch (e) {
            throw new Error("submitter:" + e.toString());
        }
        //  newbug.assignTo = {username: bug["assigned-to"]} | ''   // not working

        newbug.assignTo = getUserInfo(assignedTo) || {}

        newbug.description = "<p><pre id='description'>" + htmlEncode(bug['bug-description']['recreate-steps']) + "</pre></p>" || ''
        newbug.samplequery = bug['bug-description']['sample-query'] || ''
        newbug.sampledata = bug['bug-description']['sample-content'] || ''
        // no stacktrace
        newbug.version = bug.environment.version || ''
        newbug.tofixin = bug['to-be-fixed-in-versions'] || ''
        newbug.fixedin = bug['fixed-in-versions'] || ''
        newbug.platform = bug.environment.platform || 'all'
        newbug.memory = bug.environment['memory-size'] || ''
        newbug.processors = bug.environment['number-cpus'] || ''
        newbug.note = bug.environment.note || ''
        newbug.subscribers = [newbug.submittedBy]
        if (newbug.submittedBy.username.toString() !== newbug.assignTo.username.toString() && newbug.assignTo.username.toString() !== 'nobody') {
            newbug.subscribers.push(newbug.assignTo)
        }

        for (var s = 0; s < subscribers.length; s++) {
            if (subscribers[s] && !isPresent(newbug.subscribers, subscribers[s])) {
                newbug.subscribers.push(getUserInfo(subscribers[s]))
            }

        }

        newbug.attachments = []
        if ((typeof bug.attachments) == 'Array') {
            if (bug.attachments.attachment.length > 0) {
                for (var att of
                bug.attachments.attachment
            )
                {
                    newbug.attachments.push({
                        name: att.name,
                        uri: att._value
                    })
                }
            }
        }

        try{
           if(bug.relationships.relation.to){
               newbug.parent = {
                   type: parentType(bug),
                   id: parentId(bug),
                   taskOrRfe: isTaskOrRfe(bug)
               }
           }
        } catch(e){
            xdmp.log('no parent')
        }


        newbug.includeInTaskList = includeInTaskList(bug) //JSON.parse(bug['task-list'].include) || false;
        newbug.proceduralTasks = {
            "Requirements Task":[],
            "Functional Specification Task":[],
            "Test Specification Task":[],
            "Test Automation Task":[],
            "Documentation Task":[]}
        newbug.subTasks  = [];
        newbug.changeHistory = [];
        var comments = bug['comment-log'].comment || [];
        var changeCount = comments.length;
        for(var c=0; c<changeCount; c++){
            var comment = comments[c];
            //  xdmp.log(comment);
            var change = {
                time: comment.timestamp,
                updatedBy: getUserInfo(comment.commenter),
                change: {},
                files: [],
                show: false
            };
            if (comment['old-status']) {
                change.change.status = {
                    from: capitalize(comment['old-status']) || '',
                    to: capitalize(comment['new-status']) || ''
                }
                change.show = true;
            }

            if (comment['new-to-be-fixed-in-version']) {
                change.change.tofixin = {
                    from: comment['old-to-be-fixed-in-version'] || '',
                    to: comment['new-to-be-fixed-in-version'] || ''
                }
                change.show = true;
            }

            if (comment['assign-by']) {
                change.change.assignTo = {
                    from: getUserInfo(comment['assign-by']) || getUserInfo(comment.commenter),
                    to: getUserInfo(comment['assigned-to'])
                }
                change.show = true;
            }


            if (comment.svn) {
                change.svn = {
                    repository: comment.svn.repository,
                    revision: comment.svn.revision,
                    paths: comment.svn.paths.path,
                    affectedBugs: comment.svn['affected-bugs']
                }
                change.show = true;
            }


            if (comment['old-category']) {
                change.change.category = {
                    to: comment['old-category'] || '',
                    to: comment['new-category'] || ''
                }
                change.show = true;
            }

            if (comment['old-severity']) {
                change.change.severity = {
                    to: comment['old-severity'] || '',
                    to: comment['new-severity'] || ''
                }
                change.show = true;
            }

            if (comment['comment-text']) {
                change.comment = comment['comment-text'] || '';
                change.show = true;
            }

            newbug.changeHistory.push(change)
        }
    }
    //xdmp.log(JSON.stringify(newbug, null, 2));
    return newbug;
}



function convert(doc){
    var kind = doc.root["bug-holder"].bug.toObject()['bug-rfe'];
    switch(kind){
        case 'Bug':
           return convertBug(doc);
        break;
        case 'Task':
            return convertTask(doc);
            break;
        case 'RFE':
            return convertTask(doc);
            break;
        default:
            throw new Error('Invalid kind')
    }
}

var uris = [];
for (var id=1; id<=33000; id++){
   uris.push("root/support/bugtracking/bug"+ id +".xml");
}


for (var i=0; i< uris.length; i++){
    if(fn.exists(cts.doc(uris[i]))){
        try{
            var json = convertXMLToJSON2(uris[i]);
            var newdoc = convert(json);
            loadDoc(newdoc);
            if(newdoc.cloneOf){
                updateCloneParent(newdoc.cloneOf, newdoc.id);
            }
           try{
               if(newdoc.parent.id){
                   updateSubTaskParent(newdoc.parent, newdoc.id)
               }
           } catch(e){
              // xdmp.log(e.toString())
           }

        }catch(e){
            problematicXML.push(uris[i]);
            xdmp.log(e.toString())
        }
    }

}

'\nLoaded '+total + ' documents\n Problematic xmls: '+problematicXML +'\n count: '+problematicXML.length;
