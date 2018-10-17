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

    var moveDate = inputForm.find('#move_date');
    if(moveDate.length>0){
        filled = customValidateDateField(moveDate);
    }

    // if (filled === true) {
    //     inputForm.find('input[type=submit]').removeClass('disabled');
    //     inputForm.find('.next-step-btn-energy a').removeClass('disabled');
    // } else {
    //     inputForm.find('.next-step-btn-energy a').addClass('disabled');
    //     inputForm.find('input[type=submit]').addClass('disabled');
    // }
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

function triggerSectionEditEnergy() {
    if(sectionEditTriggered === true) {
        return true;
    }

    var url = window.location.href;
    var urlArr = url.split('#');
    if(urlArr.length === 2) {
        var editSection = urlArr[1];
        var targetEditLink = jQuery('#'+editSection).find('a.edit-data');
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
        if(jQuery('.form-type').length>0){
            jQuery('.form-type').each(function(e){
                var $this = jQuery(this),
                    nextSectionButton = $this.find('.next-step-btn-energy a');
                if($this.hasClass('filled')) {
                    //Fill fields data and display in summary
                    fillEnergyFormDynamicData($this);
                }
            });
        }
    }, 500);


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

    //Step 3 - Electricity section
    $('input[type=radio][name="suggested_date_option"]').on('change', function(e){
        meterSuggestSwitchDate(jQuery(this), 'user_choice_electricity_switch_date');
    });

    //Step 3 - Gas Connection section
    $('input[type=radio][name="suggested_gas_date_option"]').on('change', function(e){
        meterSuggestSwitchDate(jQuery(this), 'user_choice_gas_switch_date');
    });

    //Step 3 - Used in - Electricity Section, Gas Connection Section
    function meterSuggestSwitchDate($this, dateFieldId){
        var radioValue = $this.val(),
            inputForm = $this.parents('form');
        if(radioValue ===  '3'){
            jQuery('#'+dateFieldId)
                .removeAttr('disabled');
        }
        else{
            jQuery('#'+dateFieldId)
                .val("")
                .attr('disabled','disabled');
            jQuery('#'+dateFieldId)
                .parents('.form-group.has-feedback')
                .removeClass('.has-error .has-danger .has-success');
        }

        inputForm.validator('update');
        //requiredFieldsFilledEnergy(inputForm);
    }

    // Step 3 - Gas Connection Section Radio buttons show/hide
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

    /*step 3 - show/hide content on check*/
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
            jQuery('.' + id+ '_content').find('input:not([type=hidden])').attr('required', 'required');
        }
        else{
            jQuery('.' + id+ '_content').addClass('hide');
            jQuery('.' + id+ '_content').find('input:not([type=hidden])').attr('disabled', 'disabled');
            jQuery('.' + id+ '_content').find('input:not([type=hidden])').removeAttr('required');
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
            var zipCode = parseInt($('#location').val()); // aquiring zip code to be sent to toolbox api
            //console.log("Another ajax***");
            var current = $(document.activeElement);

            /*if(current.val() == query) {//if field value and new query have same input don't send ajax request
                console.log("Blocking new request*****");
                return false;
            }*/
            // console.log("current***", current);

            //old url => var ajaxUrl = orders_obj_energy.ajax_url + '?action=ajaxQueryToolboxApi&query_method=' + current.attr('query_method') + "&query_params[" + current.attr('query_key') + "]=" + query;
            var ajaxUrl = orders_obj_energy.toolkit_api_url + 'streets?postcode=' + zipCode + '&toolbox_key=' + orders_obj_energy.toolkit_api_key; // url changed to get cities data direct from toolbox api

            /** Old code commented out in order to get data from toolbox api directly **/
            /*
            //check if there are any parent params to be included
            var extraQueryParams = '';
            if(!_.isEmpty(current.attr('parent_query_key1'))) {
                var extraFirstVal = $('#' + current.attr('parent_query_key1_id')).val();
                //Zipcode can be with city name like "3500 - Hasselt"
                if(extraFirstVal.indexOf(" - ") !== -1) {
                    extraFirstVal = extraFirstVal.split(" - ")[0];
                }
                extraQueryParams += '&query_params[' + current.attr('parent_query_key1') + ']=' + extraFirstVal;
            }
            if(!_.isEmpty(current.attr('parent_query_key2'))) {
                extraQueryParams += '&query_params[' + current.attr('parent_query_key2') + ']=' +
                    $('#' + current.attr('parent_query_key2_id')).val();
            }
            ajaxUrl += extraQueryParams;
            */
            /** Old code commented out in order to get data from toolbox api directly **/

            return $.get(ajaxUrl, function (data) {
                try { // if data is json object
                    var jsonData = JSON.parse(data);
                }
                catch (error){ // if data is already json
                    var jsonData = data;
                }
                /**
                 * Preparing data in following format
                 * [
                 {id: "5400", name: "5400 Text"},
                 {id: "3500", name: "3500 Text"},
                 {id: "4500", name: "4500 Text"}
                 ]
                 */

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

                    //propVal += (!_.isEmpty(jsonData[prop]['name'])) ? jsonData[prop]['name'] : jsonData[prop][current.attr('query_name_key1')];
                    //propVal = jsonData[prop][current.attr('query_key')] + " - " + propVal;
                    //console.log("***propVal", propVal);
                    prepareData.push({
                        id: jsonData[prop][current.attr('query_key')],
                        name: jsonData[prop][current.attr('query_key')],
                        value: propVal
                    });
                }
                //console.log("prepData***", prepareData);
                return process(prepareData);
            });
        },
        displayText: function(item) {
            //console.log("****label:", item);
            //console.log("***elem:", this.$element);
            return item.value;
        },
        afterSelect: function(selectedItem) {
            //this.$element[0].value = item.value
            var keepVal = selectedItem.id;

            //keep value if it has " - " pattern in it otherwise id
            if(selectedItem.value.indexOf(" - ") !== -1) {
                keepVal = selectedItem.value;
            }

            this.$element[0].value = keepVal;
            //console.log("***selectedItem", selectedItem);
        }
    });

    $('.heating-working-gas, .threat-suspended-gas, .budget-meter-available-gas, .has-content-energy').on('change', function(){
        setGasFlow();
    });
    $('.order-questions-lightening, .order-questions-threat, .order-questions-meter, .has_solar_question').on('change', function(){
        setElectricityFlow();
    });

    //Annual electricity meter reading
    $('#electricityAnnualReading').on('change',function(){
        setAnnualConnectionDate($(this), $('#connect_date'), $('#annual_meter_reading_electricity_switch_date'));
    });

    //Annual gas meter reading
    $('#annual_gas_meter_reading_month').on('change',function(){
        setAnnualConnectionDate($(this), $('#connect_date_gas'), $('#annual_meter_reading_gas_switch_date'));
    });

    //On page load
    setElectricityFlow();
    setGasFlow();
    setAnnualConnectionDate($('#electricityAnnualReading'), $('#connect_date'), $('#annual_meter_reading_electricity_switch_date'));
    setAnnualConnectionDate($('#annual_gas_meter_reading_month'), $('#connect_date_gas'), $('#annual_meter_reading_gas_switch_date'));
    setSuggestedDate();


});
/*** READY FUNCTION ENDS ***/

//Step 3 Set connect date on based on Annual electricity/gas meter readying
function setAnnualConnectionDate($this, $connectDate, $hiddenField){
    var d = new Date(),
        currentMonth = d.getMonth(),
        currentYear = d.getFullYear(),
        annualYear,
        result;
    if($this.val() <= currentMonth){
        currentYear = currentYear+1;
    }
    result = $this.find('option:selected').text()+' '+currentYear;

    if($this.val() ==""){
        $connectDate.parents('label').hide();
        $connectDate.parents('label').find('input:checked').removeAttr('checked');
        $hiddenField.val('');
        $connectDate.html('');
    }
    else{
        $connectDate.parents('label').show();
        $hiddenField.val(result);
        $connectDate.html(result);
    }

}//setAnnualConnectionDate function ends


//on load set electricty step 3 flow
function setElectricityFlow(){
    var $q1 =jQuery('input[name="is_lightening_working"]:checked'),
        $q2 =jQuery('input[name="is_threat_suspended"]:checked'),
        $q3 = jQuery('input[name="is_budget_meter_available"]:checked'),
        $q4 = jQuery('input[name="has_solar"]:checked'),
        $ul = jQuery('ul.energyOrderQuestionMessages'),
        $form = jQuery('.order-questions-lightening').parents('form'),
        $content =$form.find('.contents');
    if($form.length>0){
        orderStepThreeQuestions($q1, $q2, $q3, $q4, $content, $ul, $form, stepTwoMoveDate, 'electricity');
    }
}

//on load set gas step 3 flow
function setGasFlow(){
    var $q1 =jQuery('input[name="is_heating_working"]:checked'),
        $q2 =jQuery('input[name="is_threat_gas_suspended"]:checked'),
        $q3 = jQuery('input[name="is_gas_budget_meter_available"]:checked'),
        $q4 = jQuery('input[name="similar_option_for_gas_as_electricity"]:checked'),
        $ul = jQuery('ul.energyOrderQuestionMessagesGas'),
        $form = jQuery('.heating-working-gas').parents('form'),
        $content =$form.find('.contents-gas');
    if($form.length>0){
        orderStepThreeQuestions($q1, $q2, $q3, $q4, $content, $ul, $form, stepTwoMoveDate, 'gas');
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
            if(valParts[1] == "00") {
                errorMessage('show');
                return false;
            }
            var dateObj = new Date(valParts[2], valParts[1] - 1, valParts[0]);
            var minDate = new Date();
            var maxDate = new Date();
            minDate.setDate(minDate.getDate() - 30);
            maxDate.setDate(maxDate.getDate() + 180);
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
    console.log(sd_Date);

    jQuery('#suggested_date, #suggested_date_gas').html(sd_Date);
    jQuery('#anb_suggested_electricity_switch_date, #anb_suggested_gas_switch_date').val(sd_Date);

}

//Energy Step 3
function orderStepThreeQuestions($elq1, $elq2, $elq3, $elq4, $content, $ul, $form, stepTwoMoveDate, $type){
    var formName = $form;
    var $q1 =$elq1.val(),
        $q2 =$elq2.val(),
        $q3 =$elq3.val(),
        $q4 =$elq4.val(),
        $contentDv =$content;

    $contentDv.addClass('hide');
    $ul.empty();
    var $q2li = formName.find('li.questionTwo'),
        $q3li = formName.find('li.questionThree'),
        $q2Inputs = $q2li.find('input'),
        $q3Inputs = $q3li.find('input');


    $q3li.addClass('hide');
    $q3Inputs.attr('disabled','disabled');

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
            }
            else if( $q3 == 1){
                $ul.append('<li>'+main_js.contact_your_Dnb+'</li>');
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
                }

            }
            else if( $q2 == 1){
                $q3li.addClass('hide');
                $q3Inputs.attr('disabled','disabled');
                $q3Inputs.removeAttr('checked');
                $ul.append('<li>'+main_js.contact_to_open_meter+'</li>');
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
            }
        }
        else if( $q1 == 0){
            $q3li.removeClass('hide');
            $q3Inputs.removeAttr('disabled');

            if( $q3 == 0){
                $ul.append('<li>'+main_js.contact_to_open_meter+'</li>');
            }
            else if( $q3 == 1){
                $ul.append('<li>'+main_js.contact_your_Dnb+'</li>');
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

    //whenSwitch Title hiding
    var whenSwitch = formName.find('.whenSwitch');
    if($ul.html() == "" && $content.hasClass('hide') && $type == "electricity" && solarSection.hasClass('hide')){
        whenSwitch.addClass('hide');
    }
    else if($ul.html() == "" && $content.hasClass('hide') && $type == "gas"){
        whenSwitch.addClass('hide');
    }
    else{
        whenSwitch.removeClass('hide');
    }

    $form.validator('update');
}
