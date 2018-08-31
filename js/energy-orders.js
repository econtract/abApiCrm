function requiredFieldsFilledEnergy(inputForm) {
    var filled = true;
    //check all required fields if they are filled submit the form
    inputForm.find(':input[required]:not(:radio):not(:checkbox):not(:disabled):not([type=hidden]), ' +
        ':input[required]:radio:checked:not(:disabled), :input[required]:checkbox:checked:not(:disabled), select[required]:not(:disabled), ' +
        'select[required]:not(".hidden")').each(function () {
        var reqField = jQuery(this);
        var isSelectOpt = false;
        if (reqField.prop("tagName").toLowerCase() == 'select') {
            if (typeof reqField.attr('disabled') == 'undefined') {
                reqField = reqField.find('option').filter(':selected');
                isSelectOpt = true;
            } else {
                return true;//don't consider disabled select
            }
        }

        //if some field don't have name ignore it, and is not a select option
        if (_.isEmpty(reqField.attr('name')) && !isSelectOpt) {
            return true;
        }

        if (_.isEmpty(reqField.val())) {
            filled = false;
        }
    });

    if (filled === true) {
        inputForm.find('input[type=submit]').removeClass('disabled');
        inputForm.find('.next-step-btn-energy a').removeClass('disabled');
    } else {
        inputForm.find('.next-step-btn-energy a').addClass('disabled');
        inputForm.find('input[type=submit]').addClass('disabled');
    }
    return filled;
}

// Assist to next page BELOW FUNCTION
function allEnergyFormsAnyRequiredFieldHasError() {

    var error = false,
        $ = jQuery;
    $('body').find('form').each(function () {
        var inputForm = $(this);
        if (requiredFieldsFilledEnergy(inputForm) === false) {
            error = true;
        }
    });

    return error;
}

// Enable button for next page
function enableDisableEnergyFormNextStep(targetStep) {
    var $ = jQuery;

    var error = allEnergyFormsAnyRequiredFieldHasError();

    if (error === true) {
        if (!targetStep.hasClass("disabled")) {
            targetStep.addClass("disabled");
        }
    }
    else if (error === false) {
        targetStep.removeClass("disabled");
    }
    else {
        if (!targetStep.hasClass("disabled")) {
            targetStep.addClass("disabled");
        }
    }
}

var partialFormSubmitEnergy = null;

function submitValidFormValuesEnergy(form) {
    var $ = jQuery;
    var formElements = form.serializeArray().concat($('#orderCommon').serializeArray());
    var hasActionElement = false;

    var formCleanElements = formElements.filter(function(elem) {
        //console.log("9999999**", $('[name='+elem.name+']').parents('.has-feedback'));
        if(elem.name == 'action') {
            hasActionElement = true;
        }
        if(!_.isEmpty(elem.value)) {
            if(!$('[name="'+elem.name+'"]').parents('.has-feedback').hasClass('has-error')) {
                return elem;
            }
        }
    });

    if(hasActionElement === false) {
        formElements.push({name: 'action', value: 'saveSimpleOrderEnergy'});
    }

    //ensure that action variable is set if not so set that as well.

    partialFormSubmitEnergy = $.ajax({
        type: 'POST',
        url: site_obj.ajax_url,
        data: formElements,
        beforeSend : function() {
            if(partialFormSubmitEnergy != null) {
                partialFormSubmitEnergy.abort();//if request already in process aboart that
            }
        },
        success: function (response) {
            //nothing to do at the moment...
        },
        dataType: 'json',
        async:true
    });
}

function submitValidValuesWrapperEnergy(inputForm, activeLinkHash) {
    submitValidFormValuesEnergy(inputForm);
    var filled = requiredFieldsFilledEnergy(inputForm);
    if (filled === true) {
        inputForm.find('input[type=submit]').removeClass('disabled');
        inputForm.find('.next-step-btn a').removeClass('disabled');
    } else {
        inputForm.find('.next-step-btn a').addClass('disabled');
        inputForm.find('input[type=submit]').addClass('disabled');
    }
    //console.log("URL String***", window.location.search, location.search);
    //console.log("***", window.location.search);
    //saving cookie for one hour so user can be resumed from same form which he was filling
    if(triggerSectionEdit() === false) {//if section edit not requested
        wpCookies.set(activeLinkHash, inputForm.attr('id'), 600);//preserving the last edit form for 10 minutes
    }
}

function fillEnergyFormDynamicData(targetContainer) {
    //Modify container to fill dynamic filled information
    //if the filled area contains a form get its data
    var filledHtml = '';
    //loop through form data to generate HTML
    var appendedFor = {};
    var $ = jQuery;
    targetContainer.find('form :input:not(:checkbox):not(:button):not(:radio):not([type=hidden]):not(:disabled):not(".hidden"), ' +
        'form input:radio:checked, form input:checkbox:not(:disabled):checked, form select:not(".hidden"):not(:disabled)').each(
        function (index) {
            var input = $(this);
            var label = $("label[for='" + input.attr('id') + "']").text();
            var value = input.val();

            if(input.hasClass('hidden')) {
                return true;//move on skip this step
            }

            if(typeof input.attr('type') == 'undefined' || input.attr('type') == 'select') {
                value = input.find(':selected').text();
            }

            if((value == 1 || value == 0) && input.attr('type').toString() != 'text' && input.attr('type').toString() != 'number') {
                if(value == 1) {
                    value = main_js.yes;
                } else {
                    value = main_js.no;
                }
            }

            //check if its a fancyRadio option
            if(input.parents('.fancy-radio').length > 0) {
                var actualText = input.parent().find('.actualText');
                if(actualText.length > 0){
                    value = actualText.text() || actualText.val();
                }
                else{
                    value = input.parent().text();
                }

                label = input.parents('.fancy-radio').parents('li, div.radio-group').find('label.radio-group').text();//only get text of label which is without class :)

            }

            if(input.attr('datatype') == 'json' && _.isEmpty(input.attr('disabled'))) {
                label = main_js.options;
                value = input.siblings('label').find('.description').text();
            }

            if((typeof appendedFor[input.attr('name')] == 'undefined' || appendedFor[input.attr('name')] == false || input.attr('datatype') == 'json')
                && !_.isEmpty(label)) {
                filledHtml += '<tr>' +
                    '<td>' + label + '</td>' +
                    '<td><strong>' + value + '</strong></td>' +
                    '</tr>';
                appendedFor[input.attr('name')] = true;
            }
        }
    );

    targetContainer.find('.filled-content table tbody').html(filledHtml);
}


/***
 *  READY FUNCTION STARTS
***/

jQuery(document).ready(function ($) {
    var activeLink = location.pathname;
    var activeLinkHash = activeLink.split('/').join('-')+'-energy-last-active-form-id';

    /*
    * ENERGY ORDER STEP 4 STARTS
    */
    //control CHECK YOUR ORDER form button
    $("#followUpForm").on("change", function () {
        var inputForm = $(this).parents('form');
        var filled = requiredFieldsFilledEnergy(inputForm);
        if (filled === true) {
            $('.btn.btn-default.disabled').removeClass("disabled");
        }
    });
    /*
    * ENERGY ORDER STEP 4 ENDS
    */

    /*
    * ENERGY ORDER GENERIC STARTS
    */

    // Click on EDIT DATA on any section on energy order step 2,3
    $('body').on('click', '.form-type a.edit-data-energy', function (event) {
        var _self = $(this);
        event.preventDefault();
        _self
            .parents('.form-type')
            .removeClass('filled')
            .removeClass('order-saved')
            .addClass('active');
    });
    //Edit Data ends

    //Step 2 - Electricity section
    $('input[type=radio][name="suggested_date_option"]').on('change', function(e){
        meterSuggestSwitchDate(jQuery(this), 'user_choice_electricity_switch_date');
    });

    //Step 2 - Gas Connection section
    $('input[type=radio][name="suggestDateGas"]').on('change', function(e){
        meterSuggestSwitchDate(jQuery(this), 'choose_switch_date_gas');
    });

    //Step 2 - Used in - Electricity Section, Gas Connection Section
    function meterSuggestSwitchDate($this, dateFieldId){
        var radioValue = $this.val(),
            // subContainer = $this.parents('.form-type'),
            inputForm = $this.parents('form');
        if(radioValue ===  '3'){
            jQuery('#'+dateFieldId)
                .removeAttr('disabled');
        }
        else{
            jQuery('#'+dateFieldId)
                .val("")
                .attr('disabled','disabled');
        }

        inputForm.validator('update');
        requiredFieldsFilledEnergy(inputForm);
    }

    // Step 2 - Gas Connection Section Radio buttons show/hide
    $('.has-content-energy').on('change', function(e){
        $this = jQuery(this);
        var inputForm = $this.parents('form');
        showGasContentsOnCheck($this);
        inputForm.validator('update');
        var filled = requiredFieldsFilledEnergy(inputForm);
        if (filled === true)
        {
            $('.btn.btn-default.disabled').removeClass("disabled");
        }
        else{
            $('.btn.btn-default').addClass('disabled');
        }
    });
    /*show/hide content on check*/
    function showGasContentsOnCheck( key ){
        var id = jQuery(key).attr('id');
        var className = jQuery(key).attr('name');
        jQuery('.'+className).addClass('hide');

        if(jQuery('#sameForGasNo' ).is(':checked')){
            jQuery('.sameForGasNo_content').find('input').removeAttr('disabled').removeAttr('checked');
            jQuery('.sameForGasNo_content').removeClass('hide');

        }
        else if(jQuery('#sameForGasYes' ).is(':checked')){
            jQuery('.sameForGasNo_content').addClass('hide');
            jQuery('.sameForGasNo_content').find('input').attr('disabled','disabled').removeAttr('checked');
        }
        else{
            jQuery('.sameForGasNo_content').find('input').attr('disabled', 'disabled');
            jQuery('.sameForGasNo_content').addClass('hide');
        }
    }

    /*show content on check*/
    function showContentsOnCheck( key ){
        var id = jQuery(key).attr('id');
        var className = jQuery(key).attr('name');
        jQuery('.'+className).addClass('hide');
        jQuery('.'+className).find('input').attr('disabled', 'disabled');
        jQuery('.'+className).find('input[type="text"]').val('');


        if(jQuery('#' + id ).is(':checked')){
            jQuery('.' + id+ '_content').removeClass('hide');
            jQuery('.' + id+ '_content').find('input').removeAttr('disabled');
        }
        else{
            jQuery('.' + id+ '_content').addClass('hide');
            jQuery('.' + id+ '_content').find('input').attr('disabled', 'disabled');
        }

        var inputForm = jQuery('#' + id ).parents('form');
        inputForm.validator('update');
        var filled = requiredFieldsFilledEnergy(inputForm);
        if (filled === true)
        {
            $('.btn.btn-default.disabled').removeClass("disabled");
        }
        else{
            $('.btn.btn-default').addClass('disabled');
        }
    }

    /*hide content on check*/
    function hideContentsOnCheck( key ){
        var id = jQuery(key).attr('id');
        if(jQuery('#' + id ).is(':checked')){
            jQuery('.' + id+ '_content').addClass('hide');
            jQuery('.' + id+ '_content').find('input').attr('disabled', 'disabled');
        }
        else{
            jQuery('.' + id+ '_content').removeClass('hide');
            jQuery('.' + id+ '_content').find('input').removeAttr('disabled');
        }

        var inputForm = jQuery('#' + id ).parents('form');
        inputForm.validator('update');

        var filled = requiredFieldsFilledEnergy(inputForm);
        if (filled === true)
        {
            $('.btn.btn-default.disabled').removeClass("disabled");
        }
        else{
            $('.btn.btn-default').addClass('disabled');
        }
    }

    showContentsOnCheck($('.has-content:checked'));
    $('.has-content').on('change', function(e){

        showContentsOnCheck(jQuery(this));
    });

    hideContentsOnCheck('.has-content-inverse');
    $('.has-content-inverse').on('change', function(e){
        hideContentsOnCheck(jQuery(this));
    });

    /*
    * ENERGY ORDER GENERIC STARTS
    */

    //hide next button if there is only one form in order steps
    if($('.OrderFormWrap').find('form').length == 1) {
        $('.next-step-btn-energy').hide();
    }

    //Order steps, for the forms that are without array called as simple forms,
    //this means that the input variables are not this way e.g. form_input[], or form_input['order'][] etc
    $("body").on('submit', '.energy-order-simple-form', function (e) {
        e.preventDefault();
        var self = $(this);
        var inputForm = $(this);
        var formInputs = $(inputForm).serialize() + '&action=saveSimpleOrderEnergy&' + $('#orderCommon').serialize();

        var filled = requiredFieldsFilled(inputForm);

        if (filled === false) {
            return false; //don't allow sumbitting the form
        }

        var data = formInputs;

        $.ajax({
            type: 'POST',
            url: site_obj.ajax_url,
            data: data,
            beforeSend : function() {
                if(partialFormSubmitEnergy != null) {
                    partialFormSubmitEnergy.abort();//if request already in process aboart that
                }
            },
            success: function (response) {
                //var jsonRes = JSON.parse(response);
                var jsonRes = response;
                if (jsonRes.success == true || jsonRes.success.toString() == "no-update") {
                    //In case of mobile form trigger next button to open the next form
                    self.parents('.form-type').find('.next-step-btn-energy a').trigger('click');
                    self.parents('.form-type').addClass('order-saved');
                } else {
                    $.each(jsonRes.errors, function(key, val) {
                        self.append('<div class="alert alert-danger alert-dismissable">' +
                            '<a href="#" class="close" data-dismiss="alert">×</a>' +
                            val + '</div>');
                    });
                    hideAlertMessages();
                }
            },
            dataType: 'json',
            async:true
        });
    });

    $('body').on('click', '.next-step-btn-energy a', function (event) {
        event.preventDefault();
        var _self = $(this);
        var mainContainer = _self.parents('.formTypeWrapper');
        var subContainer = _self.parents('.form-type');
        var current_index= parseInt(subContainer.index()) + 1;
        var total_indexes = parseInt(mainContainer.find('.form-type').length);

        subContainer
            .removeClass('active')
            .addClass('filled');

       fillEnergyFormDynamicData(subContainer);

        if(current_index !== total_indexes){

            var current_form = mainContainer
                .find('.form-type')
                .eq(current_index);

            current_form.removeClass('disabled filled');
            current_form.addClass('active');
        }

        //check all forms if everything required is filled enable delivery step
        enableDisableEnergyFormNextStep($('.form-nextstep-energy a.btn'));
    });

    $('.form-nextstep-energy a.btn').on('mouseover', function(e) {
        enableDisableEnergyFormNextStep($(this));
    });
    //To display order information summary on the filled forms

    //on chaning simple form values by ignoring hidden fields control the behavior of submit button
    //At this place also save the changed values, to preserve them
    $("body").on('change', '.energy-order-simple-form', function (e) {
        var inputForm = $(this);
        submitValidValuesWrapperEnergy(inputForm, activeLinkHash);
    });

    $("body").on('change', '.energy-order-simple-form-nonajax', function (e) {
        var inputForm = $(this);
        submitValidValuesWrapperEnergy(inputForm, activeLinkHash);
    });

    $("body").on('click', '.energy-order-simple-form', function (e) {//changing last active form on click
        var inputForm = $(this);
        //saving cookie for one hour so user can be resumed from same form which he was filling
        if(triggerSectionEdit() === false) {//if section edit not requested
            wpCookies.set(activeLinkHash, inputForm.attr('id'), 600);//preserving the last edit form for 10 minutes
        }
    });

    //getting cookie values to activate any previously focused form
    var savedCookieFormId = wpCookies.get(activeLinkHash);
    if(savedCookieFormId) {
        //check if there are multiple forms in that case active and inactive will be applicable as if there is only one form it'll always be active :)
        if(jQuery('form:not(.hidden)').length >= 2) {
            $('#'+savedCookieFormId).parents('.form-type').removeClass('filled').addClass('active');
        }
    }

    //trigger save options button automatically on clicking confirm button
    $("body").on('click', '#energy-order-connection-btn', function(e) {
        e.preventDefault();//stop click to follow href
        var currAttr = $(this);
        $('#energy-order-payment-info-btn').trigger('click');

        //now we are going to 3rd step that is delivery till now all the forms should be filled that's why now expire the last edit form cookie
        wpCookies.set(activeLinkHash, '', 0);

        //now when the data is saved it's time to initiate redirect to the next page
        setTimeout(function() {
            window.location = currAttr.attr('href');
        }, 5);
    });
});

/*** READY FUNCTION ENDS ***/