'use strict';

angular.module('common.services', [])
    .service('Common', function() {
        this.linkifyBugId = function(string) {
            var matched = string.match(/(bug:)(\s*\S*\s*\d+)/gi); // match all ids listed as bug:122,23,34 etc
            _.forEach(matched, function(str) {
                var _str = str.replace(/(\d+)/g, "<a href='/goto/$1'><span class='badge'>$1</span></a>").replace(/bug:/, ''); // replace all numbers with hyperlinks
                string = string.replace(str, _str);
            });
            return string;
        };
    });