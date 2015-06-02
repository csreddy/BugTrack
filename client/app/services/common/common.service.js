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
        this.commentWindow = {
            compress: {
                'overflow': 'hidden',
                'max-height': '500px',
                'text-overflow': 'ellipsis'
            },
            expand: false,
            wordCount: function(str) {
                if (str) {
		            return str.trim().split(' ').length;                	
                } else{
                	return 0;
                }
            },
            toggle: function(expand, index) {
                if (expand) {
                    // remove style
                    this.compress = {
                        'height': 'auto'
                    };
                    this.expand = !this.expand;
                    angular.element(document.querySelector('a#comment-expand-' + index)).hide();
                    angular.element(document.querySelector('a#comment-compress-' + index)).show();
                    angular.element(document.querySelector('p#comment-' + index)).css(this.compress);
                } else {
                    // apply style
                    this.compress = {
                        'overflow': 'hidden',
                        'max-height': '500px',
                        'text-overflow': 'ellipsis'
                    };
                    this.expand = !this.expand;
                    console.log(angular.element(document.querySelector('p#comment-' + index)));
                    angular.element(document.querySelector('p#comment-' + index)).css(this.compress);
                    angular.element(document.querySelector('a#comment-expand-' + index)).show();
                    angular.element(document.querySelector('a#comment-compress-' + index)).hide();
                }
            }
        };
        this.stackTraceWindow = {
                compress: {
                    'overflow': 'auto',
                    'max-height': '500px'
                },
                expand: true,
                toggle: function(expand) {
                    if (expand) {
                        // remove style
                        this.compress = '';
                        this.expand = !this.expand;
                    } else {
                        // apply style
                        this.compress = {
                            'overflow': 'auto',
                            'max-height': '500px'
                        };
                        this.expand = !this.expand;
                    }
                }
            };

    });