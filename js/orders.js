var sectionEditTriggered = false;

function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = amount < 0 ? "-" : "";

        let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
        let j = (i.length > 3) ? i.length % 3 : 0;

        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
        console.log(e)
    }
}

function formatPrice(price, numDecimals = 2, preFix = "")
{
    //check if the digits already has comma instead of dot
    if(_.includes(price.toString(), ',')) {
        price = price.toString().replace(',', '.');
    }

    // Set thousand separator to ., and decimal separator to a ,
    number = formatMoney(price, numDecimals, ',', '.');

    // remove trailing ,00 from a price
    price = preFix + number + "";

    return price;
}

function formatPriceInParts(price, numDecimals = 2) {
    price = formatPrice(price, numDecimals, '');
    priceArr = price.toString().split(',');

    if (!_.isEmpty(priceArr[1]) || priceArr[1].length == 0) {
        priceArr[1] = '00';
    }
    else if(strlen(priceArr[1]) == 1)
    {
        priceArr[1] = '0'.priceArr[1];
    }

    return [priceArr[0], priceArr[1]];
}

function applyDiyPriceOnPbs(diyPrice) {
    if(!_.isEmpty(jQuery('.newCostCalc')) && !_.isEmpty(diyPrice.toString())) {
        //apply if further conditions are matched
        //No need to apply if both prices are same
        var instTarget = jQuery('.ident-inst .ident-applied-price');
        var oneTimeTotalRarget = jQuery('.ident-onetime-total');

        var appliedPrice = instTarget.attr('applied-price');
        if(diyPrice != appliedPrice) {
            var diyPriceInParts = formatPriceInParts(diyPrice);
            //console.log('diyPriceInParts***', diyPriceInParts);
            instTarget.find('.amount').text(diyPriceInParts[0]);
            instTarget.find('.cents').text(diyPriceInParts[1]);

            var diffPrice = appliedPrice - diyPrice;//to subtruct from total
            //console.log('diffPrice***', diffPrice);
            var oneTimeTotal = oneTimeTotalRarget.attr('onetime-total');
            //console.log('oneTimeTotal', oneTimeTotal);
            var oneTimeTotalDiff = oneTimeTotal - diffPrice;
            //console.log('oneTimeTotalDiff', oneTimeTotalDiff);
            var diffOnetimeInParts = formatPriceInParts(oneTimeTotalDiff);
            //console.log('diffOnetimeInParts***', diffOnetimeInParts);
            //console.log('diffOnetimeInParts[0]', diffOnetimeInParts[0]);
            oneTimeTotalRarget.find('.amount').text(diffOnetimeInParts[0]);
            oneTimeTotalRarget.find('.cents').text(diffOnetimeInParts[1]);
        }
    }
}

function requiredFieldsFilled(inputForm) {
    var filled = true;
    if ((inputForm.attr('id') == "mc4wp-form-1") || inputForm.hasClass('mc4wp-form') || inputForm.data('name') == "Newsletter Subscription"){
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
            //console.log(reqField.text(), reqField.attr('name'), "====>", reqField.val());
            filled = false;
        }

    });

    // Multi Phone validation
    var multiPhone = inputForm.find(':input[type=tel]:not(:disabled)');
    if(multiPhone.length>0){
        multiPhone.each(function () {
            $this = jQuery(this);
            var countryData = $this.intlTelInput("getSelectedCountryData");
            var thisData = '+'+countryData.dialCode + $this.val();
            if(!libphonenumber.isValidNumber(thisData)){
                filled = false;
            }
        });
    }

    if(inputForm.hasClass('simple-form-radio-checkbox')){
        var allElements = inputForm.find(':input[required]:radio:not(:disabled), :input[required]:checkbox:not(:disabled)');
        allElements.each(function(){
            if(jQuery(':'+jQuery(this).attr('type')+'[name='+jQuery(this).attr('name')+']:checked').length == 0)
            {
                filled = false;
            }
        });
    }

    var radioGroup = inputForm.find('.requiredRadioGroup');
    if(radioGroup.length>0) {
        radioGroup.each(function () {
            if(jQuery(this).find('input:disabled').length == 0){
                if (jQuery(this).find('input:checked').length == 0) {
                    if (!jQuery(this).parents('li').hasClass('hide')) {
                        filled = false;
                    }
                }
            }
        });
    }

    var moveDate = inputForm.find('#move_date');
    if(moveDate.length>0){
        var fill = customValidateDateField(moveDate);
        if(!fill){
            filled =  false;
        }
    }

    if (filled === true) {
        inputForm.find('input[type=submit]').removeClass('disabled');
        inputForm.find('.next-step-btn a, .btnWrapper a.btn').removeClass('disabled');
    } else {
        inputForm.find('.next-step-btn a, .btnWrapper a.btn').addClass('disabled');
        inputForm.find('input[type=submit]').addClass('disabled');
    }

    return filled;
}

function allFormsAnyRequiredFieldHasError() {
    var error = false;

    var $ = jQuery;

    $('body').find('form').each(function () {
        var inputForm = $(this);
        if (requiredFieldsFilled(inputForm) === false) {
            error = true;
        }
    });

    return error;
}

function enableDisableFormNextStep(targetStep) {
    var $ = jQuery;

    var error = allFormsAnyRequiredFieldHasError();

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

var partialFormSubmit = null;
var pbsAjaxCall = null;

function submitValidFormValues(form) {
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
        formElements.push({name: 'action', value: 'saveSimpleOrder'});
    }

    //ensure that action variable is set if not so set that as well.

    partialFormSubmit = $.ajax({
        type: 'POST',
        url: site_obj.ajax_url,
        data: formElements,
        beforeSend : function() {
            if(partialFormSubmit != null) {
                partialFormSubmit.abort();//if request already in process aboart that
            }
        },
        success: function (response) {
            //nothing to do at the moment...
        },
        dataType: 'json',
        async:true
    });
}

function submitValidValuesWrapper(inputForm, activeLinkHash) {
    submitValidFormValues(inputForm);
    var filled = requiredFieldsFilled(inputForm);
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

//The following code will make sure if someone comes back from confirmation step for editing data he see that portion in edit mode instead of summary
function triggerSectionEdit() {
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

function initAvailabilityToggle(){
    jQuery('[data-toggle="availability-tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        html: true
    });
}

function updateOnInstallationSituation($this){
    var moveDateSection = jQuery('#move_date_section'),
        moveDate = moveDateSection.find('#move_date'),
        parentForm = moveDateSection.parents('form');
    if(moveDateSection.length>0 && moveDate.length>0){
        if($this.val() == 2){
            moveDate.removeAttr('disabled');
            moveDateSection.removeClass('hidden');
        }
        else{
            moveDate.attr('disabled',true);
            moveDateSection.addClass('hidden');
            moveDate.val('');
        }
    }
}

jQuery(document).ready(function ($) {
    var activeLink = location.pathname;
    var activeLinkHash = activeLink.split('/').join('-')+'-last-active-form-id';

    $("#select_provider").on('change', function () {
        var changedProviderObj = $(this).find('option:selected');
        var changedProviderTxt = $(changedProviderObj).text();
        var changedProviderVal = $(changedProviderObj).val();
    });

    //Multiphone value update to its hidden field on keyup
    var multiPhone = jQuery(':input[type=tel]:not(:disabled)');
    if(multiPhone.length>0){
        $('body').on('keyup', multiPhone ,function(e){
            if(jQuery('#'+e.target.id).hasClass('multi-phone')){
                var $this = jQuery('#'+e.target.id);
                var countryData = $this.intlTelInput("getSelectedCountryData");
                var thisData = '+'+countryData.dialCode + $this.val();
                if(libphonenumber.isValidNumber(thisData)){
                    $('#'+$this.attr('id')+'_hidden').val(thisData);
                }
            }
        });
    }

    //Order steps, for the forms that are without array called as simple forms,
    //this means that the input variables are not this way e.g. form_input[], or form_input['order'][] etc
    $("body").on('submit', '.order-simple-form', function (e) {
        e.preventDefault();
        var self = $(this);
        var inputForm = $(this);
        var formInputs = $(inputForm).serialize() + '&action=saveSimpleOrder&' + $('#orderCommon').serialize();

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
                if(partialFormSubmit != null) {
                    partialFormSubmit.abort();//if request already in process aboart that
                }
            },
            success: function (response) {
                //var jsonRes = JSON.parse(response);
                var jsonRes = response;
                if (jsonRes.success == true || jsonRes.success.toString() == "no-update") {
                    //In case of mobile form trigger next button to open the next form
                    self.parents('.form-type').find('.next-step-btn a').trigger('click');
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

        /*$.post(site_obj.ajax_url, data,  function (response) {
            var jsonRes = JSON.parse(response);
            if (jsonRes.success == true || jsonRes.success.toString() == "no-update") {
                //In case of mobile form trigger next button to open the next form
                self.parents('.form-type').find('.next-step-btn a').trigger('click');
                self.parents('.form-type').addClass('order-saved');
            } else {
                $.each(jsonRes.errors, function(key, val) {
                    self.append('<div class="alert alert-danger alert-dismissable">' +
                        '<a href="#" class="close" data-dismiss="alert">×</a>' +
                        val + '</div>');
                });
                hideAlertMessages();
            }
        });*/
    });

    //on chaning simple form values by ignoring hidden fields control the behavior of submit button
    //At this place also save the changed values, to preserve them
    $("body").on('change', '.order-simple-form', function (e) {
        var inputForm = $(this);
        submitValidValuesWrapper(inputForm, activeLinkHash);
    });

    $("body").on('change', '.order-simple-form-nonajax', function (e) {
        var inputForm = $(this);
        submitValidValuesWrapper(inputForm, activeLinkHash);
    });

    $("body").on('click', '.order-simple-form', function (e) {//changing last active form on click
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

    //check all forms if everything required is filled enable delivery step
    $('body').on('click', '.next-step-btn a', function (e) {
        enableDisableFormNextStep($('.form-nextstep a.btn-default'));
    });

    $('.form-nextstep').on('mouseover', function(e) {
        enableDisableFormNextStep($(this).find('.btn'));
    });

    //on changing mobile product set other required variables
    $("body").on('change', '.order-simple-form.mobile-form select[name=mobile_product_id]', function () {
        var targetForm = $(this).parents('.order-simple-form');
        var productName = $(this).find(":selected").text();
        productNameArr = productName.split(" - ");
        productName = productNameArr[0];
        var productPrice = productNameArr[1];
        targetForm.find('input[name=product_id]').val($(this).find(":selected").val());
        targetForm.find('input[name=product_name]').val(productName);
        targetForm.find('input[name=mobile_product_name]').val(productName);
        targetForm.find('.bundle-ind-price').text(productPrice);
        var subOrderTitle = productName + " (Sub Order)";
        $('#orderCommon input[name=order_title]').val(subOrderTitle);
        $('#orderCommon input[name=order_slug]').val("#");
    });

    //on changing mobile type to prepaid hide account number, whereas on postpaid show it
    $("body").on('change', '.order-simple-form select[name=mobile_donor_type]', function () {
        var targetForm = $(this).parents('.order-simple-form');
        var mobileDonorNr =targetForm.find('input[name=mobile_donor_client_nr]');
        var compulsoryStar = mobileDonorNr.siblings('.form-control-feedback');
        var selectedType = $(this).val();

        if (parseInt(selectedType) === 1) {
            mobileDonorNr
                .removeAttr('disabled')
                .attr('required', 'required');

            compulsoryStar.addClass('staricicon');
        } else {
            mobileDonorNr
                .val("")
                .removeAttr('required')
                .attr('disabled', 'true');

            compulsoryStar.removeClass('staricicon');
            //reset its value to empty so that it may not get submitted
        }

        targetForm.validator('destroy');
        targetForm.validator('update');
        /*mobileDonorNr.trigger('input');*/
    });

    //trigger save options button automatically on clicking delivery button
    $("body").on('click', '#order-delivery-btn', function(e) {
        e.preventDefault();//stop click to follow href
        var currAttr = $(this);
        $('#btn-save-options').trigger('click');

        //now we are going to 3rd step that is delivery till now all the forms should be filled that's why now expire the last edit form cookie
        wpCookies.set(activeLinkHash, '', 0);

        //now when the data is saved it's time to initiate redirect to the next page
        setTimeout(function() {
            window.location = currAttr.attr('href');
        }, 5);
    });

    //keep delivery button disabled until data gets saved
    $( document ).ajaxStart(function() {
        $( "#order-delivery-btn" ).addClass('disabled');
    });
    $( document ).ajaxStop(function() {
        if(allFormsAnyRequiredFieldHasError() === false) {
            $( "#order-delivery-btn" ).removeClass('disabled');
        }
    });

    //control delivery form submit button
    $("#delivery_form").on("change", function () {
        var inputForm = $(this).parents('form');
        // console.log(inputForm);
        var filled = requiredFieldsFilled(inputForm);
        //console.log("Filled", filled);
        if (filled === true) {
            $('.btn.btn-default.disabled').removeClass("disabled");
        }
    });

    //control personal info form submit button
    $("#personal_info_form").on("change", function () {
        var inputForm = $(this);

        var filled = requiredFieldsFilled(inputForm);
        if (filled === true) {
            inputForm.find('.btn.btn-default.disabled').removeClass("disabled");
            inputForm.find('input[type=submit]').removeClass("disabled");
        }
    });

    //control account number field based on payment info selection
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
        selectedField.parents('form').validator('destroy');
        selectedField.parents('form').validator('update');
    });

    $("input[name=iban]").on('change', function () {
        $(this).attr('required', true);
    });

    $("input[name=client_nationality]").on('change', function(e) {
        e.stopPropagation();
        if($('#client_idnr').length > 0) {
            var idcardEl = $('#client_idnr'),
                nat = $(this).val();
            var natParent = $('#client_idnr').parents('div.form-group');
            var prevIdnrVal = $('#client_idnr').val();
            idcardEl.val('');

            if (nat == 'BE') {
                idcardEl.remove();
                natParent.prepend('<input type="text" class="form-control telecom-order4-idcard" ' +
                    'id="client_idnr" name="client_idnr" placeholder="591-0123456-78" data-idcard=""' +
                    'value="' + prevIdnrVal + '" data-error="' + site_obj.idcard_error + '" required>');
                idcardEl.mask("000-0000000-00");
            } else {
                idcardEl.remove();//Removing because unmask doesn't work well, as all of unmasking methods don't work reliably
                natParent.prepend('<input type="text" class="form-control" ' +
                    'id="client_idnr" name="client_idnr" placeholder="" ' +
                    'value="" data-error="' + site_obj.idcard_error + '" required>');
                idcardEl.unmask();
            }
        }
        $(this).parents('form').validator('destroy');
        $(this).parents('form').validator('update');
    });

    //autocomplete
    //on September 14, 2018 - the funcationlity has been implemented to fetch data directly from Toolbox API.
    $('#personal_info_form .typeahead.complex-typeahead').typeahead({//only apply to complex typeaheads the zipcode one is same across whole site.
        name: 'id',
        display: 'name',
        delay: 300,//will ensure that the request goes after 300 ms delay so that there are no multipe ajax calls while user is typing
        source: function (query, process) {
            var zipCode = ''; // aquiring zip code to be sent to toolbox api
            //console.log("Another ajax***");
            var current = $(document.activeElement);
            if(current.attr('id') == 'invoice_street'){
                zipCode = parseInt($('#invoice_postal_code').val());
            } else {
                zipCode = parseInt($('#location').val());
            }

            /*if(current.val() == query) {//if field value and new query have same input don't send ajax request
                console.log("Blocking new request*****");
                return false;
            }*/
            // console.log("current***", current);

            //old url => var ajaxUrl = site_obj.ajax_url + '?action=ajaxQueryToolboxApi&query_method=' + current.attr('query_method') + "&query_params[" + current.attr('query_key') + "]=" + query;
            var ajaxUrl = site_obj.toolkit_api_url + 'streets?postcode=' + zipCode + '&toolbox_key=' + site_obj.toolkit_api_key; // url changed to get cities data direct from toolbox api

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

    //code to update cart
    $("body").on('change', '.update-price', function () {
        var allAttrs = '';
        $('.newCostCalc').html('<div class="ajaxIconWrapper"><div class="ajaxIcon"><img src="'+site_obj.template_uri+'/images/common/icons/ajaxloader.png" alt="'+site_obj.trans_loading_dots+'"></div></div>');
        //getting all applicable variable's values to update the cart
        $('.update-price:not(.hidden):not(:radio):not(:checkbox):not(:disabled), ' +
            '.update-price:input:radio:checked:not(:disabled), ' +
            '.update-price:input:checkbox:checked:not(:disabled)').each(function(idx, val){
            var currAttr = $(val);
            var attrVal = currAttr.val();
            if(attrVal == '') {//in case of empty value move on
                return;
            }
            if(allAttrs.length >= 1) {
                allAttrs += '&';
            }
            var pbsKey = currAttr.attr("pbs_key");
            var pbsVal = '';

            if(this.hasAttribute("pbs_val")) {
                pbsVal = currAttr.attr("pbs_val");
                if(pbsVal.length >= 1) {
                    attrVal = pbsVal;
                }
            }

            var attrName = currAttr.attr("name");

            if(pbsKey == 'extra_pid[]') {//this means we need to combine two values like mobile|213
                if(attrVal.indexOf('mobile') === -1) {//only append when this text is not already in there
                    attrVal = 'mobile|' + attrVal;
                }
                attrName = 'extra_pid[]';
            }
            else if(pbsKey.length >= 1) {//use the name as pbsKey
                attrName = pbsKey;
            }

            allAttrs += attrName + '=' + attrVal;
        });
        //if diy is checked include its price as well
        if($('#by_diy').is(':checked')) {
            allAttrs += '&tmp_diy_inst_price='+$('#tmp_diy_inst_price').val();
        }

        var transLabelsUri = '';

        transLabelsUri = 'trans_monthly_cost=' + site_obj.trans_monthly_cost +
            '&trans_monthly_total=' + site_obj.trans_monthly_total +
            '&trans_first_month=' + site_obj.trans_first_month +
            '&trans_monthly_total_tooltip_txt=' + site_obj.trans_monthly_total_tooltip_txt +
            '&trans_ontime_costs=' + site_obj.trans_ontime_costs +
            '&trans_ontime_total=' + site_obj.trans_ontime_total +
            '&trans_yearly_total=' + site_obj.trans_yearly_total +
            '&trans_your_advantage=' + site_obj.trans_your_advantage +
            '&trans_mth='+site_obj.trans_mth;

        //appending remaining variables which are required to grab the updated cart
        allAttrs += '&prt=' + $('#prt').val();
        allAttrs += '&pid=' + $('#pid').val();
        allAttrs += '&lang='+site_obj.lang;
        allAttrs += '&'+transLabelsUri;

        //data is now ready time to send an AJAX request
        /*$.post(site_obj.ajax_url, allAttrs, function (response) {
            $('.newCostCalc').replaceWith(response);
        });*/

        pbsAjaxCall = $.ajax({
            type: 'POST',
            url: site_obj.site_url+'/api/?action=ajaxProductPriceBreakdownHtml&load=product',
            data: allAttrs,
            beforeSend : function() {
                if(pbsAjaxCall != null) {
                    pbsAjaxCall.abort();//if request already in process aboart that
                }
            },
            success: function (response) {
                $('.newCostCalc').replaceWith(response);
                //Time to fix DIY price problem, TODO remove it once DIY problem is fixed in PBS API
                if($('#by_diy').is(':checked')) {
                    applyDiyPriceOnPbs($('#tmp_diy_inst_price').val());
                }
            },
            dataType: 'text',//handle response as raw text without validating :)
            async:true//do not block coming calls
        });
    });

    $('body').on('change', 'input[name="install_type"]', function(){

        var _self = $(this);
        var option = parseInt(_self.val());

        if(option === 1){ //DIY
            _self.parents('form').find('.packageInstallation').removeClass('show');
            _self.parents('form').find('.packageInstallation.package_DIY').addClass('show');
        }

        else if(option === 2){ //DAI
            _self.parents('form').find('.packageInstallation').removeClass('show');
            _self.parents('form').find('.packageInstallation.package_DAI').addClass('show');
        }

    });

    //hide next button if there is only one form in order steps
    if($('.OrderFormWrap').find('form').length == 1) {
        $('.next-step-btn').hide();
    }

    /*$('.typeahead').change(function (activeObj) {
        console.log("Changed***");
        var current = $('.typeahead').typeahead("getActive");
        var active_input = $(activeObj.target);
        console.log("curr***", current);
        if (current) {
            active_input.val(current.id);
        }
        //$('.typeahead').typeahead('close');
    });*/
    //autocomplete ends here

    //The following code will make sure if someone comes back from confirmation step for editing data he see that portion in edit mode instead of summary
    triggerSectionEdit();

    if(!_.isEmpty($('.newCostCalc')) && !_.isEmpty($('#diy_inst_price')) && !_.isEmpty($('.diy-requested'))) {
        applyDiyPriceOnPbs($('#diy_inst_price').val());
    }



    //TELECOME Step 4 Move date section validation and show hide
    if(jQuery('#move_date').length>0 && jQuery('#move_date_section').length>0){
        $('input[name=situation]').on('change',function(){
            updateOnInstallationSituation(jQuery(this));
        });
    }

    //Telecom step 2 on the basis of current internet provider display phone number
    if(jQuery('.clientNumberCnt').length>0){
        clientNumberShowHide();

        jQuery('#select_provider').on('change',function(){
            clientNumberShowHide();
        });

    }

});//Ready Ends

//Telecom step 2 on the basis of current internet provider display phone number
function clientNumberShowHide(){
    var elVal = jQuery('#select_provider').find('option:selected').val();
    var clientContainer = jQuery('.clientNumberCnt');
    var clientNumber = jQuery('#client_number');
    if(elVal == '' || elVal == site_obj.no_provider){
        clientNumber.attr('disabled',true);
        clientContainer.hide();
    }
    else{
        clientNumber.removeAttr('disabled');
        clientContainer.show();
    }
}

//TELECOME Step 4 Move date section validation and show hide - Core Function
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
                minDate = new Date(),
                maxDate = new Date();

            minDate.setMonth(minDate.getMonth()-1);
            maxDate.setMonth(maxDate.getMonth() + 6);
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


jQuery(window).on('load', function(){
    enableDisableFormNextStep(jQuery('.form-nextstep .btn-default'));
});
