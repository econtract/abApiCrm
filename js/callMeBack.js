
jQuery(document).ready(function($){

    $('#callMeBackSuccess').hide();

    $( "#callMeLater" ).submit(function( event ) {

        event.preventDefault();

        var values = {};

        // get all the inputs into an array.
        var inputs = $( this ).serializeArray();

        $.each( inputs, function( key, obj ) {
            values[obj.name] = obj.value;
        });

        var data = {
            'action'    : 'callMeBack',
            'userInput' : values
        };

        // We can also pass the url value separately from ajaxurl for front end AJAX implementations
        jQuery.get(call_me_back_object.ajax_url, data, function(response) {

            if(response) {
                $('#callMeBackSuccess').show();
                $(this).siblings('input:text').val('');
            }

        });

    });


});

