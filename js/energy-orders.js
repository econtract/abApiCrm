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
            return error;
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
    $('input[type=radio][name="suggestDate"]').on('change', function(e){
        meterSuggestSwitchDate(jQuery(this), 'choose_switch_date');
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
                .removeAttr('disabled')
                .attr('required','required');
        }
        else{
            jQuery('#'+dateFieldId)
                .val("")
                .removeAttr('required')
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
        var filled = requiredFieldsFilledEnergy(inputForm);
        if (filled === false) {
            return false; //don't allow sumbitting the form
        }
        else{
            self.parents('.form-type').find('.next-step-btn-energy a').trigger('click');
            self.parents('.form-type').addClass('order-saved');
        }
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
        enableDisableEnergyFormNextStep($('.form-nextstep a.btn-default'));
    });
    //To display order information summary on the filled forms

    //on chaning simple form values by ignoring hidden fields control the behavior of submit button
    //At this place also save the changed values, to preserve them
    // $("body").on('change', '.energy-order-simple-form', function (e) {
    //     var inputForm = $(this);
    //     //requiredFieldsFilledEnergy(inputForm);
    // });



});

/*** READY FUNCTION ENDS ***/