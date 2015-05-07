xquery version "1.0-ml";
import module namespace json="http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy"; 

declare namespace bt = "http://cerisent.com/bugtrack";
declare namespace em = "URN:ietf:params:email-xml:";
declare namespace rf = "URN:ietf:params:rfc822:";
declare namespace html="http://www.w3.org/1999/xhtml";

declare function local:get-user($username as xs:string){
   fn:doc("config.json")/users[./username eq $username]
};

declare function local:get-email($username as xs:string){
        local:get-user($username)/bt:email/text()
};

declare function local:get-full-name($username as xs:string){
          let $userdoc :=       local:get-user($username)
          return fn:concat($userdoc/bt:first-name/text(), " ", $userdoc/bt:last-name/text())
};

declare function local:is-employee($username as xs:string){
        xs:boolean(     local:get-user($username)/bt:is-employee/text())
};

declare function local:pretty-print-dateTime($dt as xs:dateTime)
as xs:string
{
  let $d := substring(xs:string(xs:date($dt)),1,10)
  let $month :=
    let $m := substring($d,6,2)
    return
      if ($m eq "01") then "January"
      else if ($m eq "02") then "February"
      else if ($m eq "03") then "March"
      else if ($m eq "04") then "April"
      else if ($m eq "05") then "May"
      else if ($m eq "06") then "June"
      else if ($m eq "07") then "July"
      else if ($m eq "08") then "August"
      else if ($m eq "09") then "September"
      else if ($m eq "10") then "October"
      else if ($m eq "11") then "November"
      else if ($m eq "12") then "December"
      else $m
  return
    fn:concat(
      $month,
      " ",
      substring($d,9,2),
      ", ",
      substring($d,1,4),
      "&nbsp;",
      (substring(xs:string(xs:time(xs:dateTime(xs:string($dt)))),1,5)),
      " PT"
    )
};

 declare function local:email-bug-changes ($bug as node(), $scm-comment) {
  let $username := $scm-comment/bt:commenter/text()
  let $number := string($bug/bt:bug-number)
  (: marshall the constant portion of the emails :)
  let $subject := element rf:subject {
    fn:concat("Bug ", $number, " Change Notification")
  }
  let $from :=  element rf:from {
    element em:Address {
      element em:name { "MarkLogic Bug Tracking" },
      element em:adrs { local:get-email($username) }
    }
  }
  let $link := element html:p {
    element html:a {
      attribute href {
        concat("http://bugtrack.marklogic.com/", $number)
      },
      text { "Bug", $number, "has been changed by", local:get-full-name($username)}
    }
  }

  let $title := element html:p {
                text {"Bug Title: "},
                    element html:b {$bug/bt:bug-description/bt:general-description/text()}
          }

  let $formatted-comments :=(
    element html:h4 {local:get-full-name($username), "commented on", local:pretty-print-dateTime($scm-comment/bt:timestamp), ":" },
    element html:blockquote {$scm-comment/bt:comment-text/text()},
    element html:table {
      element html:tr {
        element html:td{
          element html:strong {"Revision: "},
          element html:a {
            attribute href {fn:concat("http://svn.marklogic.com/trac.",fn:tokenize($scm-comment/bt:svn/bt:repository/text(),"/")[last()],"/changeset/",$scm-comment/bt:svn/bt:revision)},
            text {$scm-comment/bt:svn/bt:revision}
          }
        }
      },
      element html:tr {
        element html:td {
          element html:strong {"Modified Files: "},
          element html:ul {
            for $p in $scm-comment/bt:svn/bt:paths/bt:path
              return element html:li {
                element html:a {
                  attribute href {fn:concat("http://svn.marklogic.com/trac.",fn:tokenize($scm-comment/bt:svn/bt:repository/text(),"/")[last()],"/browser/",$p,"?rev=",$scm-comment/bt:svn/bt:revision)},
                  text {$p}
                }
              }
          }
        }
      },
      element html:tr {
        element html:td {
          element html:strong{"Other Bugs Referenced by this Commit: "},
          for $bid in $scm-comment/bt:svn/bt:affected-bugs/bt:bug-id
           order by $bid
            return
              element html:span {
                element html:a {
                  attribute href {fn:concat("http://bugtrack.marklogic.com/",$bid)},
                  text {$bid}
                },
                text {"&nbsp;&nbsp;"}
            }
        }
      }
    }
  )

  (: email the users listed in the bug, except the current user :)
  let $current-userid := $scm-comment/bt:commenter/text()
  let $disabled-userids := //bt:user[contains(bt:password,"disabled")]/bt:account-name/text()
  let $userids := distinct-values((
    $bug/bt:submit-info/bt:submitted-by, $bug/bt:assigned-to, $username,
    (for $s in $bug/bt:subscribers/bt:subscriber return xs:string($s))))
    [not(. = ("", $current-userid))][not (. = $disabled-userids)]


  return
    let $employees := $userids[local:is-employee(.)]
    return
    if (empty($employees) ) then ()
    else xdmp:email(
                element em:Message {
                    $from,
                    $subject,
                    (: assemble the email addresses :)
                    for $id in $userids
                    let $u :=   local:get-user($id)
                    return element rf:to {
                      element em:Address {
                        element em:name { $u/bt:first-name/text(), " ", $u/bt:last-name/text() },
                        element em:adrs { $u/bt:email/text() }
                      }
                    },
                    (: pull text out of the bt:change elements :)
                    element em:content {
                      element html:html {
                        attribute xmlns { "http://www.w3.org/1999/xhtml" },
                        element html:head { element html:title { $subject } },
                        element html:body {
                          $link,
                                  element html:h3 {"Updated via SVN commit"},
                          $title,
                          $formatted-comments
                        }
                      }
                    }
                  }
                )
};

declare function local:find-kind($id as xs:string){
    let $kinds := ("bug", "task", "rfe")
    for $kind in $kinds
    let $uri := fn:concat("/", $kind, "/", $id, "/", $id, ".json")  
   return 
    if(fn:exists(fn:doc($uri))) then
        $kind
      else ()
   
};

declare function local:generate-xml-comment(){
let $repo-path :=  xdmp:get-request-field("repo")
let $user := xdmp:get-request-field("user")
let $msg := xdmp:get-request-field("msg")
let $revision := xdmp:get-request-field("revision")
let $paths := fn:tokenize(xdmp:get-request-field("paths"),",")
let $bug-list := fn:tokenize(xdmp:get-request-field("bug-list"),",")

(:
** stock data for debugging **
let $repo-path :=  "svn/project"
let $user := "sreddy"
let $msg := "bug:4031,32573,65 this is svn test"
let $revision := "100"
let $paths := fn:tokenize("project/test1.txt, project/test2.txt", ",")
let $bug-list := fn:tokenize("4031,32573,65", ",")
let $log := xdmp:log(fn:concat("COMMIT INFO ", "repo-path=",$repo-path, " ","user=", $user, " ", "msg=",$msg, " ", "revision=", $revision, " ", "paths=", $paths, " "    , "bug-list=", $bug-list ))
:)
return
if(xdmp:get-current-user() ne "admin") then  (: bugtrack-scm is the correct user:)
  "bad username and/or password"
else
  for $bn in $bug-list
        let $scm-comment :=
        <bt:comment>
      <bt:commenter>{$user}</bt:commenter>
      <bt:timestamp>{ fn:current-dateTime() }</bt:timestamp>
      <bt:internal-comment>true</bt:internal-comment>
      <bt:comment-text>{$msg}</bt:comment-text>
      <bt:svn>
        <bt:repository>{$repo-path}</bt:repository>
        <bt:revision>{$revision}</bt:revision>
        <bt:paths>{
          for $p in $paths
            return <bt:path>{$p}</bt:path>
        }</bt:paths>
        <bt:affected-bugs>{
          for $b in $bug-list
            return
            if($b ne $bn) then
              <bt:bug-id>{$b}</bt:bug-id>
            else
              ""
        }</bt:affected-bugs>
      </bt:svn>
      <bt:is-status-change>false</bt:is-status-change>
    </bt:comment>
    return $scm-comment
};

declare function local:transform-xml-comments-to-json($xml-comments as node()*){
 let $json :=(let $xml := $xml-comments
          let $custom := 
          let $config := json:config("custom") 
              return 
                (map:put($config, "array-element-names",( "path", "bug-id")), 
                 map:put($config, "element-namespace", "http://cerisent.com/bugtrack"), 
                 map:put($config, "element-namespace-prefix", "bt"), 
                 $config) 
        return json:transform-to-json( $xml , $custom))

for $comment in $xml-comments
let $time := fn:data($comment/bt:timestamp)
let $updatedBy := local:get-user(fn:data($comment/bt:commenter))
let $change := object-node{}
let $files := array-node{}
let $repo := fn:data($comment/bt:svn/bt:repository)
let $rev := fn:data($comment/bt:svn/bt:revision)
let $paths := array-node{fn:data($comment/bt:svn/bt:paths/bt:path)}
let $affected-bugs := array-node{
                        (for $bug in fn:data($comment/bt:svn/bt:affected-bugs/bt:bug-id)
                            return object-node{"kind": (local:find-kind($bug)), "id": $bug}
                        )
                        }
let $svn := object-node{"repository": $repo, "revision": $rev , "paths":  $paths, "affectedBugs": $affected-bugs}
let $msg := fn:data($comment/bt:comment-text)
let $json-comment := object-node{ "time": $time, "updatedBy": $updatedBy, "change": $change, "files": $files,  "svn": $svn, "comment": $msg, "show":fn:true()}
return $json-comment
};

let $xml-comments := local:generate-xml-comment()
let $json-comments := local:transform-xml-comments-to-json( $xml-comments)
let $bug-list :=  fn:tokenize(xdmp:get-request-field("bug-list"),",") 
let $bug-list := (for $bug in $bug-list 
              return 
                object-node{"kind": (local:find-kind($bug)), "id": $bug}  
                )
for $bug at $index in $bug-list
 let $uri := fn:concat("/", $bug/kind, "/", $bug/id, "/", $bug/id, ".json")  
return
    if(fn:doc($uri)/changeHistory[last()]) then
      xdmp:node-insert-after(fn:doc($uri)/changeHistory[last()], $json-comments[$index]) 
   else 
      xdmp:node-replace(fn:doc($uri)/array-node('changeHistory'), array-node{$json-comments[$index]})  




