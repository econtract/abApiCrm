
jQuery(document).ready(function($){

    $('#callMeBackSuccess').hide();

    // $( "#callMeLater" ).submit(function( event ) {
    $('#callMeLater, #remindMeLaterForm').validator().on('submit', function (event) {

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

    $('#remindMeLaterForm').validator().on('submit', function (event) {
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
            var captchaData = {
                'action'    : 'validateCaptcha',
                'userInput' : values
            };
            var data = {
                'action'    : 'saveSimpleOrder',
                'userInput' : values
            };
            // We can also pass the url value separately from ajaxurl for front end AJAX implementations
            jQuery.get(callmeback_obj.ajax_url, captchaData, function(response){
                if(response == 'done'){
                    jQuery.post(callmeback_obj.ajax_url, data, function(response){
                        /*console.log('server side');
                        console.log(response);*/
                        mailForm.addClass('hide');
                        thankYouPanel.addClass('show');
                        $(this).siblings('input:text').val('');
                        $('#remindMeLaterForm').find('.error-recaptcha').empty();
                    });
                } else {
                    $('#remindMeLaterForm').find('.error-recaptcha').append('<span>'+main_js.error_recaptcha+'</span>');
                    grecaptcha.reset(reminderCallBackLater);
                }
            });
        }
    });
});

