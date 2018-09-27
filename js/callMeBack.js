
jQuery(document).ready(function($){

    $('#callMeBackSuccess').hide();

    // $( "#callMeLater" ).submit(function( event ) {
    $('#callMeLater').validator().on('submit', function (event) {

        var _self = $(this);

        if (!event.isDefaultPrevented()) {
            event.preventDefault();

            var mailForm = _self.parents('.mailForm');
            var thankYouPanel = mailForm.siblings('.mailThankYou');

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
            jQuery.get(callmeback_obj.ajax_url, data, function(response) {

                if(response == 'done') {
                    //$('#callMeBackSuccess').show();
                    mailForm.addClass('hide');
                    thankYouPanel.addClass('show');

                    $(this).siblings('input:text').val('');
                    $('#CallBack').find('.error-recaptcha').empty();
                } else if(response == 'cmrerror') {
                    $('#CallBack').find('.error-recaptcha').append('<span>'+main_js.error_recaptcha_problem+'</span>');
                    grecaptcha.reset(callUsBack);
                    //showRecaptcha('callUsBackRecaptcha');
                } else {
                    $('#CallBack').find('.error-recaptcha').append('<span>'+main_js.error_recaptcha+'</span>');
                    grecaptcha.reset(callUsBack);
                }

            });
        }


    });


});

