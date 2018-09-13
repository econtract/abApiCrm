function requiredFieldsFilled(inputForm) {
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
            /*console.log(reqField.text(), reqField.attr('name'), "====>", reqField.val());*/
            filled = false;
        }
    });

    if(inputForm.hasClass('simple-form-radio-checkbox')){
        inputForm.find(':input[required]:radio:not(:disabled), :input[required]:checkbox:not(:disabled)').each(function () {
            var reqField = jQuery(this);
            if(!reqField.is(':checked')){
                filled = false;
            }
        });
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
    var url = window.location.href;
    var urlArr = url.split('#');
    if(urlArr.length === 2) {
        var editSection = urlArr[1];
        var targetEditLink = jQuery('#'+editSection).find('a.edit-data');
        if(targetEditLink) {
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

jQuery(document).ready(function ($) {
    var activeLink = location.pathname;
    var activeLinkHash = activeLink.split('/').join('-')+'-last-active-form-id';

    $("body").on('submit', '#ModalCheckAvailability form', function (e) {

        e.preventDefault();
        // get all the inputs into an array.
        var inputs = $(this).serialize();
        var data = {
            'action': 'checkAvailability',
        };

        $('#ModalCheckAvailability').find('.modal-body').prepend('<div class="ajaxIconWrapper" style="margin:0; padding-top:0; padding-bottom:0;"><div class="ajaxIcon"><img src="'+site_obj.template_uri+'/images/common/icons/ajaxloader.png" alt="Loading..."></div></div>');

        // We can also pass the url value separately from ajaxurl for front end AJAX implementations
        $.get(site_obj.ajax_url + '?' + inputs, data, function (response) {
            var html;
            //Remove any existing messages success/errors
            $('#ModalCheckAvailability .alert').remove();
            $('#ModalCheckAvailability .contact-lnk').remove();
            $('#ModalCheckAvailability .modal-list').remove();
            $('#ModalCheckAvailability .content-error').remove();
            $('#ModalCheckAvailability .ajaxIconWrapper').remove();
            var jsonRes = false;
            if (response.length > 0) {
                jsonRes = JSON.parse(response);
                $("#checkAvailabilityForm").toggle();
                $('#ModalCheckAvailability .desc').toggle();
                if (jsonRes.available == false) {
                    html = '<div class="alert alert-danger">' +
                        '<p>' + jsonRes.msg + '</p>' +
                        '<a href="#change-zip" onclick="jQuery(\'#checkAvailabilityForm\').toggle();jQuery(\'#ModalCheckAvailability .desc\').toggle();jQuery(\'#ModalCheckAvailability .content-error\').toggle();jQuery(\'#ModalCheckAvailability .contact-lnk\').toggle();jQuery(\'#ModalCheckAvailability  .alert.alert-danger\').toggle();">(' + site_obj.change_zip_trans + ')</a>' +
                        '</div>';
                    //html += '<a href="'+site_obj.contact_uri+'" class="modal-btm-link contact-lnk"><i class="fa fa-angle-right"></i> '+site_obj.contact_trans+'</a>';
                    html += jsonRes.html;//append any HTML returned by AJAX response this includes form and submit button
                }
                else if (jsonRes.available == true) {
                    html = '<div class="alert alert-success">' +
                        '<p>' + jsonRes.msg + '</p>' +
                        '<a href="#change-zip" onclick="jQuery(\'#ModalCheckAvailability form\').toggle();jQuery(\'#ModalCheckAvailability .desc\').toggle();jQuery(\'#ModalCheckAvailability .modal-list\').toggle();jQuery(\'#ModalCheckAvailability  .alert.alert-success\').toggle();">(' + site_obj.change_zip_trans + ')</a>' +
                        '</div>';
                    html += jsonRes.html;//append any HTML returned by AJAX response this includes form and submit button

                } else {
                    html = '<div class="alert alert-danger">' +
                        '<p>' + jsonRes.api_resp_trans + '</p>' +
                        '</div>';
                }
            } else {
                html = '<div class="alert alert-danger">' +
                    '<p>' + jsonRes.api_resp_trans + '</p>' +
                    '</div>';
            }
            hideAlertMessages();
            $('#ModalCheckAvailability .modal-body').append(html);
            initAvailabilityToggle();
        });
    });

    $("#select_provider").on('change', function () {
        var changedProviderObj = $(this).find('option:selected');
        var changedProviderTxt = $(changedProviderObj).text();
        var changedProviderVal = $(changedProviderObj).val();
    });

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

    $('.form-nextstep .btn-default').on('mouseover', function(e) {
        enableDisableFormNextStep($(this));
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
        selectedField.parents('form').validator('update');
    });

    $("input[name=iban]").on('change', function () {
        $(this).attr('required', true);
    });

    $("input[name=client_nationality]").on('change', function() {
        var nat = $(this).val();
        var natParent = $('#client_idnr').parents('div.form-group');
        var prevIdnrVal = $('#client_idnr').val();

        if(nat == 'BE') {
            $('#client_idnr').remove();
            natParent.prepend('<input type="text" class="form-control hasMask" ' +
                'id="client_idnr" name="client_idnr" placeholder="591-0123456-78" data-idcard=""' +
                'value="' + prevIdnrVal + '" data-error="' + site_obj.idcard_error + '" required>');
            // $('#client_idnr').addClass('hasMask');
            //$('#client_idnr').attr('data-mask', '999-9999999-99');
            $('#client_idnr').mask("999-9999999-99");
        } else {
            $('#client_idnr').remove();//Removing because unmask doesn't work well, as all of unmasking methods don't work reliably
            /*$('#client_idnr').removeClass('hasMask');
            $('#client_idnr').removeAttr('data-mask');
            $('#client_idnr').mask();
            $('#client_idnr').unmask("999-9999999-99");
            $('#client_idnr').unmask();
            $('#client_idnr').trigger("unmask");

            $('#client_idnr').trigger('unmask.bs.inputmask');*/

            natParent.prepend('<input type="text" class="form-control" ' +
                'id="client_idnr" name="client_idnr" placeholder="" ' +
                'value="" data-error="' + site_obj.idcard_error + '" required>');
            //console.log(natParent);
        }
        $(this).parents('form').validator('update');
    });

    //autocomplete
    $('#personal_info_form .typeahead.complex-typeahead').typeahead({//only apply to complex typeaheads the zipcode one is same across whole site.
        name: 'id',
        display: 'name',
        delay: 300,//will ensure that the request goes after 300 ms delay so that there are no multipe ajax calls while user is typing
        source: function (query, process) {
            //console.log("Another ajax***");
            var current = $(document.activeElement);

            /*if(current.val() == query) {//if field value and new query have same input don't send ajax request
                console.log("Blocking new request*****");
                return false;
            }*/
           // console.log("current***", current);
            var ajaxUrl = site_obj.ajax_url + '?action=ajaxQueryToolboxApi&query_method=' + current.attr('query_method') +
                "&query_params[" + current.attr('query_key') + "]=" + query;

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

            return $.get(ajaxUrl, function (data) {
                var jsonData = JSON.parse(data);

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
        $('.newCostCalc').html('<div class="ajaxIconWrapper"><div class="ajaxIcon"><img src="'+site_obj.template_uri+'/images/common/icons/ajaxloader.png" alt="Loading..."></div></div>');
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

        var transLabelsUri = '';

        transLabelsUri = 'trans_monthly_cost=' + search_compare_obj.trans_monthly_cost +
            '&trans_monthly_total=' + search_compare_obj.trans_monthly_total +
            '&trans_first_month=' + search_compare_obj.trans_first_month +
            '&trans_monthly_total_tooltip_txt=' + search_compare_obj.trans_monthly_total_tooltip_txt +
            '&trans_ontime_costs=' + search_compare_obj.trans_ontime_costs +
            '&trans_ontime_total=' + search_compare_obj.trans_ontime_total;

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
});