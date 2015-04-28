//var cpf = require("/MarkLogic/cpf/cpf.xqy");
// var uri;
// var transition;

function cleanString(str){
    try{
        return str.replace(/<p><pre id='description'>/g, '')
            .replace(/<\/pre><\/p>/g, '')
            .replace(/<p>/, '')
            .replace(/<\/p>/, '');
    }catch(e){
        return str;
    }
}

function convert(uri){
    var doc = cts.doc(uri).root.toObject();
    var nb = new NodeBuilder();
    if(doc.id) {
    xdmp.log("Converting xml to json: " + uri)
        nb.startDocument();
        nb.startElement("bt:bug-holder", "http://cerisent.com/bugtrack");
        nb.startElement("bt:bug")
        nb.addElement("bt:bug-number", doc["id"].toString())
        nb.addElement("bt:is-internal", "true")
        nb.addElement("bt:archive", "false")
        nb.addElement("bt:customer-private", "false")
        nb.startElement("bt:environment")
        nb.addElement("bt:env-name", "")
        nb.addElement("bt:version", doc["version"] || '')
        nb.addElement("bt:platform", doc["platform"] || '')
        nb.addElement("bt:memory-size", doc["memory"] || '')
        nb.addElement("bt:number-cpus", doc["processors"] || '')
        nb.endElement(); // environment
        nb.addElement("bt:bug-rfe", doc["kind"] || '')
        nb.addElement("bt:severity", doc["severity"] || '')
        nb.addElement("bt:priority", doc["priority"]["level"] || '')
        nb.startElement("bt:bug-description")
        nb.addElement("bt:general-description", doc["title"] || '')
        nb.addElement("bt:recreate-steps", cleanString(doc["description"]) || '')
        nb.addElement("bt:sample-query", doc["samplequery"] || '')
        nb.addElement("bt:sample-content", doc["sampledata"] || '')
        if(doc["support"]){
            nb.addElement("bt:workaround", doc["support"]["workaround"] || '')
        } else {
            nb.addElement("bt:workaround", '')
        }
        nb.endElement() // bug-description
        nb.startElement("bt:submit-info")
        nb.addElement("bt:submitted-by", doc["submittedBy"]["username"] || '')
        nb.addElement("bt:company", "")
        nb.addElement("bt:timestamp", doc["createdAt"] || '')
        nb.endElement() // submit-info
        nb.addElement("bt:category", doc["category"] || '')
        nb.addElement("bt:status", doc["status"] || '')
        nb.addElement("bt:assigned-to", doc["assignTo"]["username"] || '')
        nb.startElement("bt:subscribers")
        for (var s in doc["subscribers"]) {
            nb.addElement("bt:subscriber", doc["subscribers"][s]["username"] || '')
        }
        nb.endElement() // subscribers
        nb.startElement("bt:task-list")
        if (doc["proceduralTasks"]) {
            // TODO
        } else {
            nb.addElement("bt:include", "")
            nb.addElement("bt:requirement", "")
            nb.addElement("bt:func-spec", "")
            nb.addElement("bt:test-spec", "")
            nb.addElement("bt:test-auto", "")
            nb.addElement("bt:document", "")
        }
        nb.endElement() // task-list
        nb.startElement("bt:relationships")
        nb.startElement("bt:relation")
        if (doc["parent"]) {
            nb.addElement("bt:type", doc["parent"]["type"] || '')
            nb.addElement("bt:to", doc["parent"]["id"] || '')
        } else {
            nb.addElement("bt:type", '')
            nb.addElement("bt:to", '')
        }
        nb.endElement() // relation
        nb.endElement() // relationships
        nb.startElement("bt:attachments")
        if (doc["attachments"]) {
            for (var a in doc["attachments"]) {
                nb.startElement("bt:attachment")
                nb.addAttribute("name", doc["attachments"][a].name || '')
                nb.addAttribute("date", doc["createdAt"] || '')
                nb.addText(doc["attachments"][a].uri || '')
                nb.endElement() // attachment
            }
        }
        nb.endElement() // attachments

        if (doc["support"]) {
            nb.addElement("bt:title", doc["support"]["headline"] || '')
            nb.addElement("bt:support-description", doc["support"]["supportDescription"] || '')
            nb.addElement("bt:support-workaround", doc["support"]["workaround"] || '')
            nb.addElement("bt:support-customer-impact", doc["support"]["customerImpact"] || '')
            nb.addElement("bt:publish", doc["support"]["publish"] || '')
            nb.startElement("bt:support-tickets")
            if (doc["support"]["tickets"]) {
                for (var t in doc["support"]["tickets"]) {
                    nb.addElement("bt:support-ticket", doc["support"]["tickets"][t])
                }
            }
            nb.endElement()// support-tickets
        }
        if (doc["cloneOf"]) {
            nb.addElement("bt:clone-original", doc["cloneOf"].toString() || '')
        }

        nb.addElement("bt:fixed-in-versions", doc["fixedin"] || '')
        nb.addElement("bt:to-be-fixed-in-versions", doc["tofixin"] || '')
        nb.startElement("bt:comment-log")
        for (var c in doc["changeHistory"]) {
            nb.startElement("bt:comment")
            var comment = doc["changeHistory"][c]
            nb.addElement("bt:commenter", comment["updatedBy"]["username"] || '')
            nb.addElement("bt:timestamp", comment["time"] || '')
            nb.addElement("bt:internal-comment", "true")
            if (comment["change"]["status"]) {
                nb.addElement("bt:is-status-change", "true")
                nb.addElement("bt:old-status", comment["change"]["status"]["from"] || '')
                nb.addElement("bt:new-status", comment["change"]["status"]["to"] || '')
            } else {
                nb.addElement("bt:is-status-change", "false")
            }
            if (comment["change"]["tofixin"]) {
                nb.addElement("bt:to-be-fixed-in-version-moved-by", comment["updatedBy"]["username"] || '')
                nb.addElement("bt:old-to-be-fixed-in-version", comment["change"]["tofixin"]["from"] || '')
                nb.addElement("bt:new-to-be-fixed-in-version", comment["change"]["tofixin"]["to"] || '')
            }

            if (comment["change"]["assignTo"]) {
                xdmp.log('inside assignTo')
                nb.addElement("bt:assign-by", comment["updatedBy"]["username"] || '')
                nb.addElement("bt:assigned-to", comment["change"]["assignTo"]["to"]["username"] || '')
            }
            if (comment["comment"]) {
                nb.addElement("bt:comment-text", cleanString(comment["comment"]) || '')
            } else {
                nb.addElement("bt:comment-text", '')
            }
            if (comment["svn"]) {
                nb.startElement("bt:svn")
                nb.addElement("bt:repository", comment["svn"]["repository"] || '')
                nb.addElement("bt:revision", comment["svn"]["revision"] || '')
                nb.startElement("bt:paths")
                for (var p in comment["svn"]["paths"]) {
                    nb.addElement("bt:path", comment["svn"]["paths"][p] || '')
                }
                nb.endElement() // paths
                nb.addElement("bt:affected-bugs", comment["svn"]["affectedBugs"] || '')
                nb.endElement() // svn
            }

            nb.endElement() // comment
        }
        nb.endElement() // comment-log
        nb.endElement() // bug
        nb.endElement(); // bug-holder
        nb.endDocument();
        // xdmp.log(nb.toNode().root)
        return nb.toNode().root;
    }
}

function loadDoc(doc){
    try{
        var id = doc.xpath("/bt:bug-holder/bt:bug/bt:bug-number/text()")
        if(id){
            var docuri = "root/support/bugtracking/bug"+id+".xml"
            str = 'declareUpdate(); xdmp.documentInsert(uri, doc, [xdmp.permission("bugtrack-user", "read"), xdmp.permission("bugtrack-user", "update")])'
            xdmp.eval(str, {doc: doc, uri: docuri}, {database: xdmp.database('bugtrack-staging-db')});
            xdmp.log("loaded "+docuri )
          //  cpf.success(uri, transition, null);
        }
    }catch(e){
        xdmp.log('could not load')
      //  cpf.failure(uri, transition, e, null);
    }
}


loadDoc(convert(uri))