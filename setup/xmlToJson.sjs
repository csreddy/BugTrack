declareUpdate();
var json = require("/MarkLogic/json/json.xqy");
var cpf = require("/MarkLogic/cpf/cpf.xqy");
var users = getUsers().root.users.user;
var total=0;
var problematicXML = [];
var success = [];
var failure = [];
var fromDateTime = xdmp.getRequestField('from');
var toDateTime = xdmp.getRequestField('to');
//var uri = xdmp.getRequestField('uri');
var uri;
var msg = "Converted old bugtrack XML documents into new bugtrack JSON documents\n\n\n";
//xdmp.setResponseContentType("text/html");
//var uri;
//var transition;


xdmp.log('------------------------------')
xdmp.log(uri)
xdmp.log('------------------------------')


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
                case 'Requirements Task':
                    return 'Requirements Task';
                    break;
                case 'Functional Spec task for':
                case 'Functional Specification Task':
                    return 'Functional Specification Task';
                    break;
                case 'Test Specification task for':
                case 'Test Specification Task':
                    return 'Test Specification Task';
                    break;
                case 'Test Automation task for':
                case 'Test Automation Task':
                    return 'Test Automation Task';
                    break;
                case 'Documentation task for':
                case 'Documentation Task':
                    return 'Documentation Task';
                    break;
                case 'Sub-task of':
                case 'Sub-task':
                    return "Sub-task"
                    break;
                default:
                    xdmp.log(bug['bug-number'] + ' did not match any criteria for parent type: ' + bug.relationships.relation.type);
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
    var str;
    var _uri;
    if(parentType === 'Task'){
       // xdmp.log('Parent Task')
      //  parent = xdmp.eval("cts.doc('/task/'+parentId + '/' + parentId + '.json')", {parentId: relation.id}, {database: xdmp.database('bugtrack')}).next().value.root//.toObject()
       // parent.subTasks.push(subtaskId);

       _uri =  "/task/" + relation.id + "/" + relation.id + ".json"
        str = 'declareUpdate();var parent=cts.doc(uri).root; xdmp.nodeInsertChild(parent.subTasks, new NodeBuilder().addNumber(subtaskId).toNode())'
        xdmp.eval(str,  {uri:_uri, subtaskId:subtaskId}, {database: xdmp.database('bugtrack')})

       // str = 'xdmp.documentInsert("/task/" + newTask.id + "/" + newTask.id + ".json", newTask, null, ["tasks", newTask.submittedBy.username])'
       // xdmp.eval(str, {newTask: parent}, {database: xdmp.database('bugtrack'), transactionMode: 'update-auto-commit'});
    }
    if(parentType === 'RFE'){
     //   parent = xdmp.eval("cts.doc('/rfe/'+parentId + '/' + parentId + '.json')", {parentId: relation.id}, {database: xdmp.database('bugtrack')}).next().value.root//.toObject();
        _uri = "/rfe/" + relation.id + "/" + relation.id + ".json"
        var taskType;
        switch(relation.type){
            case 'Requirements Task':
            case 'Functional Specification Task':
            case 'Test Specification Task':
            case 'Test Automation Task':
            case 'Documentation Task':
                taskType = relation.type;
                str = 'declareUpdate();var parent=cts.doc(uri).root; xdmp.nodeInsertChild(parent.proceduralTasks[taskType], new NodeBuilder().addNumber(subtaskId).toNode())'
                xdmp.log(str)
                xdmp.eval(str,  {uri:_uri, taskType: taskType, subtaskId:subtaskId}, {database: xdmp.database('bugtrack')})
                break;
            case 'Sub-task':
                str = 'declareUpdate();var parent=cts.doc(uri).root; xdmp.nodeInsertChild(parent.subTasks, new NodeBuilder().addNumber(subtaskId).toNode())'
                xdmp.eval(str,  {uri:_uri, subtaskId:subtaskId}, {database: xdmp.database('bugtrack')})
                break;
            default:
                xdmp.log('did not match any criteria for relation: '+ relation.type)
                break;
        }
        // xdmp.log(JSON.stringify(parent, null, 2))
        //  loadDoc(parent);
        //xdmp.log('relation:' +JSON.stringify(relation, null, 2))

        // var _uri = "/rfe/" + parent.id + "/" + parent.id + ".json"
        // str = 'declareUpdate(); xdmp.documentInsert("/rfe/" + newRfe.id + "/" + newRfe.id + ".json", newRfe, null, ["rfes", newRfe.submittedBy.username]);'
        //xdmp.eval(str, {newRfe: parent, uri:_uri}, {database: xdmp.database('bugtrack'),  transactionMode: 'update-auto-commit'});
    }

}

// transforms xml bug/task/rfe to json
function convertXMLToJSON(uri) {
    var xml = cts.doc(uri).root;
    var config = json.config("custom");
    config["array-element-names"] = xdmp.arrayValues(["comment", "subscriber", "attachment", "path", "support-ticket"]);
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
        xdmp.log('TASK')
        str = 'declareUpdate(); xdmp.documentInsert("/task/" + newTask.id + "/" + newTask.id + ".json", newTask, null, ["tasks", newTask.submittedBy.username])'
        xdmp.eval(str, {newTask: doc}, {database: xdmp.database('bugtrack')});
        xdmp.log("loaded /task/" +doc.id + '/' + doc.id+ '.json' )
        total++;
    }
    // for RFE
    if(doc.kind.toString() === 'RFE'){
        // current bugtrack does not have a straignfwd way for creating RFE, you create a task first and then set it as RFE
        // when this script converts the rfe into json it leaves a copy of task json created earlier
        // so this will remove the task json from db
        try{
            str = 'declareUpdate(); xdmp.documentDelete("/task/" + task.id + "/" + task.id + ".json")';
            xdmp.eval(str, {task: doc}, {database: xdmp.database('bugtrack')});
            xdmp.log("deleted /task/" +doc.id + '/' + doc.id+ '.json' )
        }catch(e){
            // xdmp.log(e.toString());
        }

        str = 'declareUpdate(); xdmp.documentInsert("/rfe/" + newRfe.id + "/" + newRfe.id + ".json", newRfe, null, ["rfes", newRfe.submittedBy.username]);'
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
        try{
            if((bug.attachments.attachment instanceof Array)){
                xdmp.log('attachments')
                if (bug.attachments.attachment.length > 0) {
                    for(var att=0; att<bug.attachments.attachment.length; att++){
                        newbug.attachments.push({
                            name: bug.attachments.attachment[att].name,
                            uri: bug.attachments.attachment[att]._value
                        })
                    }
                }
            }
        }catch(e){
            // nothing
        }



        if (bug.relationships) {
            newbug.relationships = [{
                    type: bug.relationships.relation.type || '',
                    to: bug.relationships.relation.to || ''
                }] || []
        }

        newbug.clones = [];
        var docExists = xdmp.eval('var uri="/bug/" + id + "/" + id + ".json"; xdmp.log(uri);fn.exists(cts.doc(uri))', {id: newbug.id}, {database: xdmp.database('bugtrack')}).next().value
        xdmp.log(docExists)
        if(docExists){
            newbug.clones = xdmp.eval('cts.doc("/bug/" + id + "/" + id + ".json")', {id: newbug.id}, {database: xdmp.database('bugtrack')}).next().value.root.clones;
        }
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
        newbug.tags = [newbug.category, newbug.submittedBy.username] // TODO
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
                change.comment = "<p><pre id='description'>" + htmlEncode(comment['comment-text']) + "</pre></p>" || ''
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
    xdmp.log('------1---------')
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

    var newtask = {}
    newtask.id = parseInt(bug['bug-number']);
    newtask.kind = bug['bug-rfe'];
    if (newtask.kind.toString() === 'Task' || newtask.kind.toString() === 'RFE') {
        newtask.createdAt = bug["submit-info"].timestamp || '';
        newtask.status = capitalize(bug.status) || ''
        newtask.title = bug['bug-description']['general-description'] || ''
        newtask.category = bug.category || ''
        newtask.severity = capitalize(bug.severity) || ''
        switch (newtask.severity) {
            case 'Catastrophic':
                newtask.severity = "P1 - " + newtask.severity
                break;
            case 'Critical':
                newtask.severity = "P2 - " + newtask.severity
                break;
            case 'Major':
                newtask.severity = "P3 - " + newtask.severity
                break;
            case 'Minor':
                newtask.severity = "P4 - " + newtask.severity
                break;
            case 'Aesthetic':
                newtask.severity = "P5 - " + newtask.severity
                break;
            case 'Performance':
                // do nothing
                break;
        }
        xdmp.log('------2---------')
        newtask.priority = parseInt(bug.priority) || {}
        switch (newtask.priority) {
            case 1:
                newtask.priority = {'level': "1", 'title': 'Drop everything and fix'}
                break;
            case 2:
                newtask.priority = {'level': "2", 'title': 'A customer is waiting for this'}
                break;
            case 3:
                newtask.priority = {'level': "3", 'title': 'Very important'}
                break;
            case 4:
                newtask.priority = {'level': "4", 'title': 'Important'}
                break;
            case 5:
                newtask.priority = {'level': "5", 'title': 'Fix if time permits'}
                break;
            case 6:
                newtask.priority = {'level': "6", "title": "Probably won't fix but worth remembering"}
                break;
            case 7:
                newtask.priority = {'level': "7", 'title': 'Do not fix'}
                break;
        }
        if(newtask.kind === 'Task'){
            newtask.days =  "";
            newtask.period =  {
                startDate: "",
                endDate: ""
            };
        }
        xdmp.log('------3---------')
        try {
            newtask.submittedBy = getUserInfo(submittedBy) || {}
        } catch (e) {
            throw new Error("submitter:" + e.toString());
        }
        //  newbug.assignTo = {username: bug["assigned-to"]} | ''   // not working

        newtask.assignTo = getUserInfo(assignedTo) || {}

        newtask.description = "<p><pre id='description'>" + htmlEncode(bug['bug-description']['recreate-steps']) + "</pre></p>" || ''
        newtask.samplequery = bug['bug-description']['sample-query'] || ''
        newtask.sampledata = bug['bug-description']['sample-content'] || ''
        // no stacktrace
        newtask.version = bug.environment.version || ''
        newtask.tofixin = bug['to-be-fixed-in-versions'] || ''
        newtask.fixedin = bug['fixed-in-versions'] || ''
        newtask.platform = bug.environment.platform || 'all'
        newtask.memory = bug.environment['memory-size'] || ''
        newtask.processors = bug.environment['number-cpus'] || ''
        newtask.note = bug.environment.note || ''
        newtask.subscribers = [newtask.submittedBy]
        if (newtask.submittedBy.username.toString() !== newtask.assignTo.username.toString() && newtask.assignTo.username.toString() !== 'nobody') {
            newtask.subscribers.push(newtask.assignTo)
        }

        for (var s = 0; s < subscribers.length; s++) {
            if (subscribers[s] && !isPresent(newtask.subscribers, subscribers[s])) {
                newtask.subscribers.push(getUserInfo(subscribers[s]))
            }

        }

        newtask.attachments = []
        try{
            if((bug.attachments.attachment instanceof Array)){
                xdmp.log('attachments')
                if (bug.attachments.attachment.length > 0) {
                    for(var att=0; att<bug.attachments.attachment.length; att++){
                        newtask.attachments.push({
                            name: bug.attachments.attachment[att].name,
                            uri: bug.attachments.attachment[att]._value
                        })
                    }
                }
            }
        }catch(e){
            // nothing
        }


        try{
            if(bug.relationships.relation.to){
                newtask.parent = {
                    type: parentType(bug),
                    id: parentId(bug),
                    taskOrRfe: isTaskOrRfe(bug)
                }
            }
        } catch(e){
            xdmp.log('no parent')
        }
        xdmp.log('------4---------')

        newtask.includeInTaskList = includeInTaskList(bug);
        newtask.proceduralTasks = {
            "Requirements Task":[],
            "Functional Specification Task":[],
            "Test Specification Task":[],
            "Test Automation Task":[],
            "Documentation Task":[]}
        newtask.subTasks  = [];

        var docExists = xdmp.eval('var uri="/" + kind + "/" + id + "/" + id + ".json"; xdmp.log(uri);fn.exists(cts.doc(uri))', {kind: newtask.kind.toLowerCase(), id: newtask.id}, {database: xdmp.database('bugtrack')}).next().value
        xdmp.log(docExists)
        if(docExists){
            var  _doc = xdmp.eval('cts.doc("/" + kind + "/" + id + "/" + id + ".json")', {kind: newtask.kind.toLowerCase(), id: newtask.id}, {database: xdmp.database('bugtrack')}).next().value.root
            newtask.subTasks = _doc.subTasks;
            newtask.proceduralTasks = _doc.proceduralTasks;
        }


        newtask.tags = [newtask.category, newtask.submittedBy.username] // TODO
        newtask.changeHistory = [];
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
                change.comment = "<p><pre id='description'>" + htmlEncode(comment['comment-text']) + "</pre></p>" || ''
                change.show = true;
            }

            newtask.changeHistory.push(change)

        }
    }

    //xdmp.log(JSON.stringify(newtask, null, 2));
    return newtask;
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


function bulkTransform(){
    var uris = [];
    var uriCount = fn.count(cts.uriMatch("root/support/bugtracking/bug*.xml"));
    for (var id=1; id<=uriCount; id++){
        uris.push("root/support/bugtracking/bug"+ id +".xml");
    }
    for (var i=0; i< uris.length; i++){
        if(fn.exists(cts.doc(uris[i]))){
            xdmp.log('Bulk Transform: '+ uri)
            try{
                var json = convertXMLToJSON2(uris[i]);
                var newdoc = convert(json);
                loadDoc(newdoc);
                if(newdoc.cloneOf){
                    updateCloneParent(newdoc.cloneOf, newdoc.id);
                }
                if(newdoc.parent){
                    if(newdoc.parent.id){
                        updateSubTaskParent(newdoc.parent, newdoc.id)
                    }
                }
                // cpf.success(uri, transition, null);
            }catch(e){
                xdmp.log('----------catch-----')
                problematicXML.push(uris[i]);
                xdmp.log(e.toString())
                //  cpf.failure(uri, transition, e, null);
            }
        }
    }
}

function batchTransform(uris){
    for (var i=0; i< uris.length; i++){
        if(fn.exists(cts.doc(uris[i]))){
            xdmp.log('Batch Transform: '+ uris[i])
            try{
                // check if doc already exists in new db
                var isJsonDocExists = xdmp.eval("")


                var json = convertXMLToJSON2(uris[i]);
                var newdoc = convert(json);
                loadDoc(newdoc);
                if(newdoc.cloneOf){
                    updateCloneParent(newdoc.cloneOf, newdoc.id);
                }
                if(newdoc.parent){
                    if(newdoc.parent.id){
                        updateSubTaskParent(newdoc.parent, newdoc.id)
                    }
                }
                success.push(uris[i])
                //  cpf.success(uri, transition, null);
            }catch(e){
                xdmp.log('----------catch-----')
                problematicXML.push(uris[i]);
                xdmp.log(e.toString());
                failure.push(uris[i]);
                // cpf.failure(uri, transition, e, null);
            }
        }
    }
}

function singleTransform(uri){
    if(fn.exists(cts.doc(uri)) && uri !== 'root/support/bugtracking/users.xml'){
        xdmp.log('Converting '+ uri)
        try{
            var json = convertXMLToJSON2(uri);
            var newdoc = convert(json);
            loadDoc(newdoc);
            // update  parent if the current bug is a clone
            if(newdoc.cloneOf){
                updateCloneParent(newdoc.cloneOf, newdoc.id);
            }

            // update parent if the current bug/task/rfe is the subtask of another task/rfe
            if(newdoc.parent){
                if(newdoc.parent.id){
                    updateSubTaskParent(newdoc.parent, newdoc.id)
                }
            }
            "Transformed: " + uri
            //  cpf.success(uri, transition, null);
        }catch(e){
            xdmp.log('----------catch-----')
            problematicXML.push(uri);
            xdmp.log(e.toString())
            // cpf.failure(uri, transition, e, null);
            xdmp.log('------------------------------------------------------------------------------')
            msg+="Could not transform uri " + uri
        }
    }
}


function currentTimeMinusNSecs(n){
    var currentTime =  fn.currentDateTime()   // new Date("2015-04-22T15:24:04.170932-07:00")
    var year = fn.yearFromDateTime(currentTime)
    var month = fn.monthFromDateTime(currentTime)
    if(month < 10) month = "0"+month
    var day = fn.dayFromDateTime(currentTime)
    if(day < 10) day = "0"+day
    var min =  parseInt(fn.minutesFromDateTime(currentTime)) ;
    var hour = fn.hoursFromDateTime(currentTime) ;
    var seconds = fn.secondsFromDateTime(currentTime)

    // seconds
    seconds = seconds - n
    if(seconds < 0){
        seconds = 60 + seconds
        min = min-1;
    }

    if(seconds > -1 && seconds < 10) seconds = "0"+seconds

// minute
    if(min > -1  && min < 10  ) min = "0"+min
    if(min == -1) {
        min = "59"
        hour = hour - 1
        if(hour == -1) hour = "00" // set it to 00 instead of reducing the date by  1
        //if(hour == -1) hour = "11"
    }

// hour
    if(hour < 10) hour = "0"+hour


//var tz = fn.timezoneFromDateTime(currentTime)
    var str = fn.concat(year,"-", month,"-", day, "T", hour, ":", min, ":",seconds, "-07:00")

    return str
}

function sortUris(docuris){
    var ids = []
    var sortedUris = []
    for(var i in docuris){
        var _id = docuris[i].toString().replace(/root\/support\/bugtracking\/bug/, '').replace(/.xml/, '')
        if(!isNaN(_id)){
            ids.push(parseInt(_id))
        }
    }
    ids.sort(function(a, b){return a-b});
    for(var id in ids){
        sortedUris.push("root/support/bugtracking/bug"+ids[id]+".xml")
    }
    return sortedUris
}

function getModifiedDocUris(from, to){
    try{
        if(!from){
            throw new Error('Need "from" date')
        }
        var _from = xs.dateTime(from); //new Date(from)
        var _to = (to == 'undefined') ? xs.dateTime(to) : fn.currentDateTime();

        var query = cts.andQuery([
            cts.elementRangeQuery("prop:last-modified", ">", _from ),
            cts.elementRangeQuery("prop:last-modified", "<=",  _to)
        ])
        var uris =   cts.uriMatch("root/support/bugtracking/bug*.xml", ["properties"], query).toArray();
        return sortUris(uris)
    }catch(e){
        return e.toString()
    }
}


if(fromDateTime || toDateTime){
    try{
        if(fromDateTime){ xs.dateTime(fromDateTime)}
        if(toDateTime){ xs.dateTime(toDateTime)}
        var modifiedDocs = getModifiedDocUris(fromDateTime, toDateTime)
        batchTransform(modifiedDocs);
        msg+="Transformed  : \n Success:\n"+ success.join('\n') + '\n\n Failed:\n'+failure.join('\n')+'\n'
    }catch(e){
         msg+="Date format is wrong. Ex: 2015-04-27T11:10:00"
    }
}

if(uri){
    singleTransform(uri);
    msg+="\n*****************\n Transformed uri:" + uri + '\n';
}



msg;




//'\nLoaded '+total + ' documents\n Problematic xmls: '+problematicXML +'\n count: '+problematicXML.length;

