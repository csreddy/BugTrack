'use strict';
$(document).ready(function() {
    $('[data-toggle=offcanvas]').click(function() {
        $('.row-offcanvas').toggleClass('active');
    });

    $("option[value='? undefined:undefined ?']").each(function(item) {
        item.remove();
    });

    $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });

});
