var disableEnergyNextStep = false;
var sectionEditTriggered = false;

var stepTwoMoveDate;
if(orders_obj_energy.move_date != '' && orders_obj_energy.move_date != '01/01/1970'){
    stepTwoMoveDate = orders_obj_energy.move_date;
}
else{
    stepTwoMoveDate = '';
}

function requiredFieldsFilledEnergy(inputForm) {
    var filled = true;
    if ((inputForm.attr('id') == "mc4wp-form-1") || inputForm.hasClass('mc4wp-form') || inputForm.data('name') == "Newsletter Subscription"){
        return true;
    }
    if(inputForm.attr('id') == 'remindMeLaterForm'){
        return true;
    }

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
            // console.log("Missing...", reqField);
        }
        // console.log(reqField);
    });

    if(inputForm.hasClass('radio-checkbox-energy')){
        var allElements = inputForm.find(':input[required]:radio:not(:disabled), :input[required]:checkbox:not(:disabled)');
        allElements.each(function(){
            if(jQuery(':'+jQuery(this).attr('type')+'[name='+jQuery(this).attr('name')+']:checked').length == 0)
            {
                filled = false;
            }
        });
    }

    inputForm.find('.requiredRadioGroup').each(function(){
        if(!jQuery(this).find('input:checked').length>0){
            if(!jQuery(this).parents('li').hasClass('hide')){
                filled = false;
            }
        }
    });

    var moveDate = inputForm.find('#move_date');
    if(moveDate.length>0){
        var fill = customValidateDateField(moveDate);
        if(!fill){
            filled =  false;
        }
    }
    var elswitchDate = inputForm.find('.energy-order3-switchDate1');
    if(elswitchDate.length>0 && elswitchDate.is(':not(:disabled)')){
        var fill = customValidateDateField(elswitchDate);
        if(!fill){
            filled =  false;
        }
    }
    var gasswitchDate = inputForm.find('.energy-order3-switchDate2');
    if(gasswitchDate.length>0 && gasswitchDate.is(':not(:disabled)')){
        var fill = customValidateDateField(gasswitchDate);
        if(!fill){
            filled =  false;
        }
    }

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
        url: orders_obj_energy.ajax_url,
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
    if(triggerSectionEditEnergy() === false) {//if section edit not requested
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

            if(input.hasClass('hidden') || input.hasClass('skip')) {
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
                if(actualText.length > 0 && !actualText.hasClass('skip')){
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

function triggerSectionEditEnergy() {
    if(sectionEditTriggered === true) {
        return true;
    }

    var url = window.location.href;
    var urlArr = url.split('#');
    if(urlArr.length === 2) {
        var editSection = urlArr[1];
        var targetEditLink = jQuery('#'+editSection).find('a.edit-data-energy');
        if(targetEditLink) {
            sectionEditTriggered = true;
            targetEditLink.trigger('click');
            return true;
        }
    }

    return false;
}

/***
 *  READY FUNCTION STARTS
***/

jQuery(document).ready(function ($) {
    var activeLink = location.pathname;
    var activeLinkHash = activeLink.split('/').join('-')+'-energy-last-active-form-id-'+window.location.search;

    /*
    * ENERGY ORDER STEP 4 STARTS
    */
    //control CHECK YOUR ORDER form button
    var followUpForm = $('#followUpForm');
    if(followUpForm.length > 0){
        var followUpCheckedEl = followUpForm.find('input[name=like_to_follow_up]:checked');
        if(followUpCheckedEl.length>0){
            followUpCheckedEl.parent().addClass('active');
        }
        followUpForm.on("change", function () {
            var inputForm = $(this).parents('form');
            var filled = requiredFieldsFilledEnergy(inputForm);
            if (filled === true) {
                $('.btn.btn-default.disabled').removeClass("disabled");
            }
        });
    }

    /*
    * ENERGY ORDER STEP 4 ENDS
    */

    /*
    * ENERGY ORDER GENERIC STARTS
    */

    //On page refresh display summary data if already filled and summary already shown
    setTimeout(function(){
        if(jQuery('.form-type.filled').length>0){
            jQuery('.form-type.filled').each(function(e){
                fillEnergyFormDynamicData(jQuery(this));
            });
        }
    }, 500);


    // Click on EDIT DATA on any section on energy order step 2,3
    $('body').on('click', '.form-type a.edit-data-energy', function (event) {
        var _self = $(this);
        if(!_self.hasClass('clickable')){
            event.preventDefault();

            _self
                .parents('.form-type')
                .removeClass('filled')
                .removeClass('order-saved')
                .addClass('active');
        }

    });
    //Edit Data ends

    //Step 3 - Electricity section
    $('input[type=radio][name="suggested_date_option"]').on('change', function(e){
        meterSuggestSwitchDate(jQuery(this), 'user_choice_electricity_switch_date', jQuery('#anb_suggested_electricity_switch_date'), jQuery('#annual_meter_reading_electricity_switch_date'));
    });

    //Step 3 - Gas Connection section
    $('input[type=radio][name="suggested_gas_date_option"]').on('change', function(e){
        meterSuggestSwitchDate(jQuery(this), 'user_choice_gas_switch_date', jQuery('#anb_suggested_gas_switch_date'), jQuery('#annual_meter_reading_gas_switch_date'));
    });

    //Step 3 - Used in - Electricity Section, Gas Connection Section
    function meterSuggestSwitchDate($this, dateFieldId, $hiddenSuggestedDate, $hiddenAnnualDate){
        var radioValue = $this.val(),
            inputForm = $this.parents('form');
        if(radioValue ===  '3'){
            jQuery('#'+dateFieldId)
                .removeAttr('disabled');
            $hiddenAnnualDate.val('');
            $hiddenSuggestedDate.val('');
        }
        else{
            if(radioValue === '1'){
                $hiddenAnnualDate.val('');
                $hiddenSuggestedDate.val($this.parent().find('.actualText').text());
            }
            else if(radioValue === '2'){
                $hiddenSuggestedDate.val('');
                $hiddenAnnualDate.val($this.parent().find('.actualText').text());

            }

            jQuery('#'+dateFieldId)
                .val("")
                .attr('disabled','disabled');
            jQuery('#'+dateFieldId)
                .parents('.form-group.has-feedback')
                .removeClass('has-error has-danger has-success');
        }

        inputForm.validator('update');
    }

    /*step 2 - show content on check*/
    function showContentsOnCheck( key ){
        var id = jQuery(key).attr('id');
        var className = jQuery(key).attr('name');
        jQuery('.'+className).addClass('hide');
        jQuery('.'+className).find('input:not([type=hidden])').attr('disabled', 'disabled');


        if(jQuery('#' + id ).is(':checked')){
            jQuery('.' + id+ '_content').removeClass('hide');
            jQuery('.' + id+ '_content').find('input:not([type=hidden])').removeAttr('disabled');
            //jQuery('.' + id+ '_content').find('input:not([type=hidden])').attr('required', 'required');
        }
        else{
            jQuery('.' + id+ '_content').addClass('hide');
            jQuery('.' + id+ '_content').find('input:not([type=hidden])').attr('disabled', 'disabled');
            //jQuery('.' + id+ '_content').find('input:not([type=hidden])').removeAttr('required');
        }

        var inputForm = jQuery('#' + id ).parents('form');
        inputForm.validator('update');

    }

    /*step 2 - hide content on check*/
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

    }
    /* steo 2 */
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

        var filled = requiredFieldsFilledEnergy(inputForm);

        if (filled === false) {
            return false; //don't allow sumbitting the form
        }

        var data = formInputs;

        $.ajax({
            type: 'POST',
            url: orders_obj_energy.ajax_url,
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
                    disableEnergyNextStep = false;
                    self.parents('.form-type').find('.next-step-btn-energy a').trigger('click');
                    self.parents('.form-type').addClass('order-saved');
                } else {
                    $.each(jsonRes.errors, function(key, val) {
                        disableEnergyNextStep = true;
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

    $('.form-nextstep-energy').on('mouseover', function(e) {
        enableDisableEnergyFormNextStep($(this).find('a.btn'));
    });

    //To display order information summary on the filled forms

    //on chaning simple form values by ignoring hidden fields control the behavior of submit button
    //At this place also save the changed values, to preserve them
    $("body").on('change', '.energy-order-simple-form', function (e) {
        var inputForm = $(this);
        submitValidValuesWrapperEnergy(inputForm, activeLinkHash);
        enableDisableEnergyFormNextStep($('.form-nextstep-energy a.btn'));
    });

    $("body").on('change', '.energy-order-simple-form-nonajax', function (e) {
        var inputForm = $(this);
        submitValidValuesWrapperEnergy(inputForm, activeLinkHash);
    });

    $("body").on('click', '.energy-order-simple-form', function (e) {//changing last active form on click
        var inputForm = $(this);
        //saving cookie for one hour so user can be resumed from same form which he was filling
        if(triggerSectionEditEnergy() === false) {//if section edit not requested
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

    //trigger save options button automatically on clicking follow up button
    $("body").on('click', '#energy-order-followup-btn', function(e) {
        e.preventDefault();//stop click to follow href
        var currAttr = $(this);
        $('#energy-order-gas-conn-btn').trigger('click');

        //now we are going to 3rd step that is delivery till now all the forms should be filled that's why now expire the last edit form cookie
        wpCookies.set(activeLinkHash, '', 0);

        //now when the data is saved it's time to initiate redirect to the next page
        setTimeout(function() {
            if(!disableEnergyNextStep) {
                window.location = currAttr.attr('href');
            } else {
                $('#energy-order-followup-btn').addClass('disabled');
            }
        }, 200);
    });

    //control account number field based on payment info selection, copied from order.js, no difference
    $("input[name=payment_method]").on('change', function () {
        var selectedField = $(this);
        var selectedVal = selectedField.val();

        if (parseInt(selectedVal) === 2) {
            $('#iban').parents('li').removeClass('hidden');
            $('#iban').removeAttr('disabled');
            $('#iban').attr('required', true);

        }
        else if (parseInt(selectedVal) === 1) {
            if ($('#iban').hasClass('with-vir')) {
                $('#iban').parents('li').removeClass('hidden');
                $('#iban').removeAttr('disabled');
                $('#iban').attr('required', true);
            } else {
                $('#iban').parents('li').addClass('hidden');
                $('#iban').attr('disabled', true);
                $('#iban').removeAttr('required');
            }
        }
        else {
            $('#iban').parents('li').addClass('hidden');
            $('#iban').attr('disabled', true);
        }
        selectedField.parents('form').validator('update');
    });


    //autocomplete
    //on September 14, 2018 - the funcationlity has been implemented to fetch data directly from Toolbox API.
    $('.typeahead_energy.complex-typeahead').typeahead({//only apply to complex typeaheads the zipcode one is same across whole site.
        name: 'id',
        display: 'name',
        delay: 300,//will ensure that the request goes after 300 ms delay so that there are no multipe ajax calls while user is typing
        source: function (query, process) {
            var zipCode;// aquiring zip code to be sent to toolbox api
            var current = $(document.activeElement);
            if($(current).attr('id') == "installation_address"){
                zipCode = parseInt($('#location').val());
            }
            else if($(current).attr('id') == "installation_address_invoice"){
                zipCode = parseInt($('#location_invoice').val());
            }
            var ajaxUrl = orders_obj_energy.toolkit_api_url + 'streets?postcode=' + zipCode + '&toolbox_key=' + orders_obj_energy.toolkit_api_key; // url changed to get cities data direct from toolbox api
            return $.get(ajaxUrl, function (data) {
                try { // if data is json object
                    var jsonData = JSON.parse(data);
                }
                catch (error){ // if data is already json
                    var jsonData = data;
                }

                var prepareData = [];
                for (var prop in jsonData) {
                    var propVal = jsonData[prop][current.attr('query_key')];
                    var queryKeyExist = false;
                    if (!_.isEmpty(jsonData[prop][current.attr('query_name_key1')])) {
                        queryKeyExist = true;
                        propVal += " - " + jsonData[prop][current.attr('query_name_key1')];
                    }

                    if (!_.isEmpty(jsonData[prop][current.attr('query_name_key2')])) {
                        queryKeyExist = true;
                        propVal += " (" + jsonData[prop][current.attr('query_name_key2')] + ")";
                    }

                    if (!queryKeyExist) {
                        propVal += " - " + jsonData[prop]['name'];
                    }

                    prepareData.push({
                        id: jsonData[prop][current.attr('query_key')],
                        name: jsonData[prop][current.attr('query_key')],
                        value: propVal
                    });
                }
                return process(prepareData);
            });
        },
        displayText: function(item) {
            return item.value;
        },
        afterSelect: function(selectedItem) {
            var keepVal = selectedItem.id;

            //keep value if it has " - " pattern in it otherwise id
            if(selectedItem.value.indexOf(" - ") !== -1) {
                keepVal = selectedItem.value;
            }

            this.$element[0].value = keepVal;
        }
    });

    $('.heating-working-gas, .threat-suspended-gas, .budget-meter-available-gas, .has-content-energy').on('change', function(){
        setGasFlow('change');
    });
    $('.order-questions-lightening, .order-questions-threat, .order-questions-meter, .has_solar_question').on('change', function(){
        setElectricityFlow('change');
    });

    //Annual electricity meter reading
    $('#annual_electricity_meter_reading_month').on('change',function(){
        setAnnualConnectionDate($(this), $('#connect_date'), $('#annual_meter_reading_electricity_switch_date'), $('#anb_suggested_electricity_switch_date'), 'change');
    });

    //Annual gas meter reading
    $('#annual_gas_meter_reading_month').on('change',function(){
        setAnnualConnectionDate($(this), $('#connect_date_gas'), $('#annual_meter_reading_gas_switch_date'), $('#anb_suggested_gas_switch_date'), 'change');
    });

    //On page load
    setElectricityFlow('load');
    setGasFlow('load');
    setAnnualConnectionDate($('#annual_electricity_meter_reading_month'), $('#connect_date'), $('#annual_meter_reading_electricity_switch_date'), $('#anb_suggested_electricity_switch_date'), 'load');
    setAnnualConnectionDate($('#annual_gas_meter_reading_month'), $('#connect_date_gas'), $('#annual_meter_reading_gas_switch_date'), $('#anb_suggested_gas_switch_date'), 'load');
    setSuggestedDate();
    if( $('#annual_electricity_meter_reading_month').length>0 ){
        $('.annualGasWrap').hide();
    }
    else{
        $('.energyOrder.replicateSection').removeClass('hide');
        $('.energyOrder.replicateSection li').removeClass('hide');
    }


    //Step 5 Apply suggestion for Electricity and GAS
    $('.order-selected.grey').on('click','.applyLink',function(e){
        e.preventDefault();
        var $parent = $(this).parents('.order-selected.grey');
        $parent.find('.applyField').val($parent.find('.eanNo').text());
    });

    //thankyou page
    $('#contact_me_next_year_lnk_btn').on('click', function() {
        $('#contact_me_next_year_sbmt_btn').trigger('click');
    })

});
/*** READY FUNCTION ENDS ***/

//Step 3 Set connect date on based on Annual electricity/gas meter readying
function setAnnualConnectionDate($this, $connectDate, $hiddenFieldAnnualMeter, $hiddenFieldSuggestedDate, eventType){
    var d = new Date(),
        currentMonth = d.getMonth(),
        currentYear = d.getFullYear(),
        annualYear,
        result,
        $connectParent = $connectDate.parents('label'),
        $form = $this.parents('form'),
        dateDiv = $form.find('.dateFieldWithLabelText'),
        dateField = dateDiv.find('.actualText');

    if($this.val() <= currentMonth){
        currentYear = currentYear+1;
    }
    result = $this.find('option:selected').text()+' '+currentYear;

    if($this.val() ==""){
        $connectParent.hide();
        if(eventType == 'change'){
            var firstRadioElement = $connectParent.parent().children().first();
            firstRadioElement.find('input[type=radio]').attr('checked','checked');
            dateField.val("").attr('disabled', 'disabled');
            $hiddenFieldSuggestedDate.val(firstRadioElement.find('.actualText').text());
        }
        $hiddenFieldAnnualMeter.val('');
        $connectDate.html('');
    }
    else{
        $connectParent.show();
        if(eventType == 'change'){
            $connectParent.find('input[type=radio]').attr('checked','checked');
            dateField.val("").attr('disabled', 'disabled');
        }
        if(dateDiv.find('input[type=radio]:checked').length<=0 && eventType == 'load'){
            dateField.val("").attr('disabled', 'disabled');
        }

        $hiddenFieldAnnualMeter.val(result);
        $connectDate.html(result);
        $hiddenFieldSuggestedDate.val("");
    }

    dateField.parents('.form-group.has-feedback').removeClass('has-error has-danger has-success');
    dateDiv.find('.help-block.with-errors ul').empty();
    dateDiv.find('.staricicon.form-control-feedback').removeClass('glyphicon-remove glyphicon-ok');

}//setAnnualConnectionDate function ends


//on load set electricty step 3 flow
function setElectricityFlow(eventType){
    var $q1 =jQuery('input[name="is_lightening_working"]:checked'),
        $q2 =jQuery('input[name="is_threat_suspended"]:checked'),
        $q3 = jQuery('input[name="is_budget_meter_available"]:checked'),
        $q4 = jQuery('input[name="has_solar"]:checked'),
        $ul = jQuery('ul.energyOrderQuestionMessages'),
        $form = jQuery('.order-questions-lightening').parents('form'),
        $content =$form.find('.contents');
    if($form.length>0){
        orderStepThreeQuestions($q1, $q2, $q3, $q4, $content, $ul, $form, stepTwoMoveDate, 'electricity', eventType);
    }
}

//on load set gas step 3 flow
function setGasFlow(eventType){
    var $q1 =jQuery('input[name="is_heating_working"]:checked'),
        $q2 =jQuery('input[name="is_threat_gas_suspended"]:checked'),
        $q3 = jQuery('input[name="is_gas_budget_meter_available"]:checked'),
        $q4 = jQuery('input[name="similar_option_for_gas_as_electricity"]:checked'),
        $ul = jQuery('ul.energyOrderQuestionMessagesGas'),
        $form = jQuery('.heating-working-gas').parents('form'),
        $content =$form.find('.contents-gas');
    if($form.length>0){
        orderStepThreeQuestions($q1, $q2, $q3, $q4, $content, $ul, $form, stepTwoMoveDate, 'gas', eventType);
    }
}


//Energy Step 2 Move date section validation and show hide - Core Function
function customValidateDateField(moveDate){
    var hasFeedback = moveDate.parents('.has-feedback'),
        iconSpan = hasFeedback.find('.form-control-feedback'),
        parentForm = moveDate.parents('form'),
        blockWithErrors = hasFeedback.find('.help-block.with-errors'),
        errorMsg = '',
        html ='',
        value = moveDate.val();

    function errorMessage(type){
        if(type == 'show'){
            errorMsg = moveDate.data('error');
            html = '<ul class="list-unstyled"><li>'+ errorMsg +'</li></ul></div>';
            hasFeedback.removeClass('has-success').addClass('has-error has-danger');
            iconSpan.removeClass('glyphicon-ok').addClass('glyphicon-remove');
            blockWithErrors.html(html);
        }
    }
    if(!moveDate.is(':disabled')){
        if(value.length === 10){
            var valParts = value.split('/');
            if(valParts[0] == "00" || valParts[1] == "00") {
                errorMessage('show');
                return false;
            }
            var dateObj = new Date(valParts[2], valParts[1] - 1, valParts[0],0,0,0,0),
                minDate =new Date(),
                maxDate = new Date();

            if( stepTwoMoveDate == '' && (moveDate.hasClass('energy-order3-switchDate1') || moveDate.hasClass('energy-order3-switchDate2') ) ){
                 var suggestedValue = jQuery('#suggested_date').text();
                var minParts = suggestedValue.split('/');
                minDate.setFullYear(minParts[2], minParts[1] - 1, minParts[0]);
                var maxD = minDate.getDate();
                var maxM = minDate.getMonth();
                var maxY = minDate.getFullYear();
                maxDate.setFullYear(maxY, maxM, maxD);
                maxDate.setMonth(maxDate.getMonth() + 6);
            }
            else{
                minDate.setMonth(minDate.getMonth()-1);
                maxDate.setMonth(maxDate.getMonth() + 6);
            }
            minDate.setHours(0,0,0,0);
            maxDate.setHours(0,0,0,0);

            if(dateObj < minDate || dateObj > maxDate){
                errorMessage('show');
                return false;
            }
            else{
                errorMsg = '';
                hasFeedback.removeClass('has-error has-danger').addClass('has-success');
                iconSpan.removeClass('glyphicon-remove').addClass('glyphicon-ok');
                blockWithErrors.html('');
                return true;
            }
        }
        else {
            errorMsg = moveDate.data('error');
            html = '<ul class="list-unstyled"><li>'+ errorMsg +'</li></ul></div>';
            hasFeedback.removeClass('has-success').addClass('has-error has-danger');
            iconSpan.removeClass('glyphicon-ok').addClass('glyphicon-remove');
            blockWithErrors.html(html);
            return false;
        }

    }
    else{
        errorMsg = '';
        hasFeedback.removeClass('has-error has-danger has-success');
        iconSpan.removeClass('glyphicon-remove glyphicon-ok');
        blockWithErrors.html('');
        return true;
    }

}//customValidateDateField Ends

//Energy Step 3
function setSuggestedDate() {
    var suggestedDate = new Date();
    if(stepTwoMoveDate == ""){
       suggestedDate.setDate(suggestedDate.getDate() + 35);
        var sd_mm = suggestedDate.getMonth() + 2;
        var sd_yy = suggestedDate.getFullYear();
        if(sd_mm > 12){
            sd_mm = 1;
            sd_yy =sd_yy + 1;
        }
        suggestedDate.setFullYear(sd_yy, sd_mm-1, 1);

    }

    var sd_d = suggestedDate.getDate();
    var sd_m = suggestedDate.getMonth()+1;
    if(sd_d<10){
        sd_d='0'+sd_d;
    }
    if(sd_m<10){
        sd_m='0'+sd_m;
    }
    var sd_Date = sd_d + '/' + sd_m + '/' + suggestedDate.getFullYear();
    //console.log(sd_Date);

    jQuery('#suggested_date, #suggested_date_gas').html(sd_Date);
    jQuery('#anb_suggested_electricity_switch_date, #anb_suggested_gas_switch_date').val(sd_Date);

}

//Energy Step 3
function orderStepThreeQuestions($elq1, $elq2, $elq3, $elq4, $content, $ul, $form, stepTwoMoveDate, $type, eventType){
    var formName = $form;
    var $q1 =$elq1.val(),
        $q2 =$elq2.val(),
        $q3 =$elq3.val(),
        $q4 =$elq4.val(),
        $contentDv =$content;

    $contentDv.addClass('hide');
    $ul.empty().hide();
    var $q2li = formName.find('li.questionTwo'),
        $q3li = formName.find('li.questionThree'),
        $q2Inputs = $q2li.find('input'),
        $q3Inputs = $q3li.find('input');


    $q3li.addClass('hide');
    $q3Inputs.attr('disabled','disabled');

    if($type == 'gas'){
        var gasSubContainer = jQuery('.replicateSection');
        if( jQuery('#annual_electricity_meter_reading_month').length>0 ){
            if($q4 == 1 || $q4 == undefined){
                gasSubContainer.addClass('hide');
                gasSubContainer.find('li').addClass('hide');
            }
            else if($q4 == 0){
                gasSubContainer.removeClass('hide');
                gasSubContainer.find('li').removeClass('hide');
            }
        }
        else{
            $q4 = 0;
            gasSubContainer.removeClass('hide');
            gasSubContainer.find('li').removeClass('hide');
        }
    }

    //if step 2 move date is empty
    //Installation at current residence
    if(stepTwoMoveDate == ''){

        if( $q1 == 0){

            $q2li.addClass('hide');
            $q2Inputs.attr('disabled','disabled');
            $q2Inputs.removeAttr('checked');
            $q3li.removeClass('hide');
            $q3Inputs.removeAttr('disabled');

            if( $q3 == 0){
                $ul.append('<li>'+main_js.contact_to_open_meter+'</li>');
                $ul.show();
            }
            else if( $q3 == 1){
                $ul.append('<li>'+main_js.contact_your_Dnb+'</li>');
                $ul.show();
            }

        }

        else if($q1 == 1){

            $q2li.removeClass('hide');
            $q2Inputs.removeAttr('disabled');

            if( $q2 == 0){
                $q3li.removeClass('hide');
                $q3Inputs.removeAttr('disabled');

                if( $q3 == 0){
                    $contentDv.removeClass('hide');
                }
                else if( $q3 == 1){
                    $ul.append('<li>'+main_js.contact_your_Dnb+'</li>');
                    $ul.show();
                }

            }
            else if( $q2 == 1){
                $q3li.addClass('hide');
                $q3Inputs.attr('disabled','disabled');
                $q3Inputs.removeAttr('checked');
                $ul.append('<li>'+main_js.contact_to_open_meter+'</li>');
                $ul.show();
            }

        }

    }// If move date is empty
    else{
        $q2li.addClass('hide');
        $q2Inputs.attr('disabled','disabled');
        $q2Inputs.removeAttr('checked');

        if( $q1 == 1){
            $q3li.removeClass('hide');
            $q3Inputs.removeAttr('disabled');

            if( $q3 == 0){
                $contentDv.removeClass('hide');
            }
            else if( $q3 == 1){
                $ul.append('<li>'+main_js.contact_your_Dnb+'</li>');
                $ul.show();
            }
        }
        else if( $q1 == 0){
            $q3li.removeClass('hide');
            $q3Inputs.removeAttr('disabled');

            if( $q3 == 0){
                $ul.append('<li>'+main_js.contact_to_open_meter+'</li>');
                $ul.show();
            }
            else if( $q3 == 1){
                $ul.append('<li>'+main_js.contact_your_Dnb+'</li>');
                $ul.show();
            }
        }

    }// move date is not empty

    // Solar question in Electricity
    if($type == 'electricity'){
        var solarSection = jQuery('.solarSection');

        if($q4 == 0 || $q4 == undefined){
            solarSection.addClass('hide');
        }
        else if($q4 == 1){
            solarSection.removeClass('hide');
        }
    }

    //RESET HIDDEN FIELDS IF IT IS OTHER THAN THE SCENARIO THAT SHOWS SWITCH DATE CONTENT
    if(eventType == 'change'){
        var dateField = $contentDv.find('input.actualText'),
            dateDiv = dateField.parents('.dateFieldWithLabelText'),
            hidden_suggested_date,
            hidden_annual_date,
            suggested_date_actualText,
            connect_date_actualText,
            input1 = $contentDv.find('.content_labelOne input[type=radio]'),
            input2 = $contentDv.find('.content_labelTwo input[type=radio]'),
            input3 = dateDiv.find('input[type=radio]');

        dateField.parents('.form-group.has-feedback').removeClass('has-error has-danger has-success');
        dateDiv.find('.help-block.with-errors ul').empty();
        dateDiv.find('.staricicon.form-control-feedback').removeClass('glyphicon-remove glyphicon-ok');

        if($type == 'electricity') {
            hidden_suggested_date = jQuery('#anb_suggested_electricity_switch_date');
            hidden_annual_date = jQuery('#annual_meter_reading_electricity_switch_date');
            suggested_date_actualText = jQuery('#suggested_date');
            connect_date_actualText = jQuery('#connect_date');
        }
        else if($type == 'gas') {
            hidden_suggested_date = jQuery('#anb_suggested_gas_switch_date');
            hidden_annual_date = jQuery('#annual_meter_reading_gas_switch_date');
            suggested_date_actualText = jQuery('#suggested_date_gas');
            connect_date_actualText = jQuery('#connect_date_gas');
        }

        if($q1 != 1 || $q2 != 0 || $q3 != 0) {
            $contentDv.find('strong.actualText').addClass('skip');
            $contentDv.find('input[type=hidden]').val('');
            dateField.val('').attr('disabled', true);
            input1.addClass('skip');
            input2.addClass('skip');
            input3.addClass('skip');
            // $form.find('.currentSupplier').removeClass('skip');
        }
        else if($q1 == 1 && $q2 == 0 && $q3 == 0) {
            input1.removeClass('skip');
            input2.removeClass('skip');
            input3.addClass('skip');
            // $form.find('.currentSupplier').addClass('skip');

            $contentDv.find('strong.actualText').removeClass('skip');
            if(input3.is(':checked')){
                dateField.removeAttr('disabled');
            }
            else if(input1.is(':checked')){
                hidden_suggested_date.val(suggested_date_actualText.text());
            }
            else if(input2.is(':checked')){
                hidden_annual_date.val(connect_date_actualText.text());
            }
        }
    }
    else if(eventType == 'load'){

        var dateDiv = $contentDv.find('.dateFieldWithLabelText'),
            input1 = $contentDv.find('.content_labelOne input[type=radio]'),
            input2 = $contentDv.find('.content_labelTwo input[type=radio]'),
            input3 = dateDiv.find('input[type=radio]');

        if($q1 == 1 && $q2 == 0 && $q3 == 0) {
            input1.removeClass('skip');
            input2.removeClass('skip');
            input3.addClass('skip');
            //$contentDv.find('input[type=radio]').removeClass('skip');
            // $form.find('.currentSupplier').addClass('skip');
        }
        else{
            input1.addClass('skip');
            input2.addClass('skip');
            input3.addClass('skip');
            // $contentDv.find('input[type=radio]').addClass('skip');
            // $form.find('.currentSupplier').removeClass('skip');
        }
    }


    //whenSwitch Title hiding
    var whenSwitch = formName.find('.whenSwitch'),
        label = formName.find('.whenSwitchLabel');
    if($ul.html() == "" && $content.hasClass('hide') && $type == "electricity" && solarSection.hasClass('hide')){
        whenSwitch.addClass('hide');
    }
    else if($ul.html() == "" && $content.hasClass('hide') && $type == "gas"){
        whenSwitch.addClass('hide');
    }
    else if( $type == 'gas' && ($q4 == 1 || $q4 == undefined) ){
        whenSwitch.addClass('hide');
    }
    else{
        whenSwitch.removeClass('hide');
        if($ul.html() != "" && $content.hasClass('hide')){
            label.addClass('hide');
        }
        else{
            label.removeClass('hide');
        }
    }

    $form.validator('destroy');
    $form.validator('update');
}

jQuery(window).on('load', function(){
    enableDisableEnergyFormNextStep(jQuery('.form-nextstep-energy a.btn'));
});