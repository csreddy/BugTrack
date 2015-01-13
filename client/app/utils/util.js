'use strict';
$(document).ready(function() {
    $('[data-toggle=offcanvas]').click(function() {
        $('.row-offcanvas').toggleClass('active');
    });

    //  $('#description').wysihtml5();

    $("option[value='? undefined:undefined ?']").each(function(item) {
        item.remove();
    });

});