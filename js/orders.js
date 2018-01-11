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
            console.log(reqField.text(), reqField.attr('name'), "====>", reqField.val());
            filled = false;
        }
    });

    return filled;
}

function enableDisableFormNextStep(targetStep) {
    var $ = jQuery;
    var error = false;
    $('body').find('form').each(function () {
        var inputForm = $(this);
        if (requiredFieldsFilled(inputForm) === false) {
            error = true;
        }
    });

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

jQuery(document).ready(function ($) {


    $("#ModalCheckAvailability form").submit(function (e) {

        e.preventDefault();
        // get all the inputs into an array.
        var inputs = $(this).serialize();
        var data = {
            'action': 'checkAvailability',
        };

        // We can also pass the url value separately from ajaxurl for front end AJAX implementations
        $.get(site_obj.ajax_url + '?' + inputs, data, function (response) {
            var html;
            //Remove any existing messages success/errors
            $('#ModalCheckAvailability .alert').remove();
            $('#ModalCheckAvailability .contact-lnk').remove();
            $('#ModalCheckAvailability .modal-list').remove();
            $('#ModalCheckAvailability .content-error').remove();
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

        $.post(site_obj.ajax_url, data, function (response) {
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
        });
    });

    //on chaning simple form values by ignoring hidden fields control the behavior of submit button
    $("body").on('change', '.order-simple-form', function (e) {
        var inputForm = $(this);
        var filled = requiredFieldsFilled(inputForm);
        if (filled === true) {
            inputForm.find('input[type=submit]').removeClass('disabled');
            inputForm.find('.next-step-btn a').removeClass('disabled');
        } else {
            inputForm.find('.next-step-btn a').addClass('disabled');
            inputForm.find('input[type=submit]').addClass('disabled');
        }
    });

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
        var mobileDonorNr =targetForm.find('input[name=mobile_donor_client_nr]')
        var selectedType = $(this).val();

        if (parseInt(selectedType) === 1) {
            mobileDonorNr
                .removeAttr('disabled')
                .attr('required', 'required');
        } else {
            mobileDonorNr
                .val("")
                .removeAttr('required')
                .attr('disabled', 'true');
            //reset its value to empty so that it may not get submitted
        }

        targetForm.validator('update');
        mobileDonorNr.trigger('input');
    });

    //trigger save options button automatically on clicking delivery button
    $("body").on('click', '#order-delivery-btn', function(e) {
        e.preventDefault();//stop click to follow href
        var currAttr = $(this);
        $('#btn-save-options').trigger('click');
        //now when the data is saved it's time to initiate redirect to the next page
        setTimeout(function() {
            window.location = currAttr.attr('href');
        }, 1500);
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
                'id="client_idnr" name="client_idnr" placeholder="591-0123456-78" ' +
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
            console.log("current***", current);
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
        $('.CostWrap').html('<div class="ajaxIconWrapper"><div class="ajaxIcon"><img src="'+site_obj.template_uri+'/images/common/icons/ajaxloader.png" alt="Loading..."></div></div>');
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

        //appending remaining variables which are required to grab the updated cart
        allAttrs += '&prt=' + $('#prt').val();
        allAttrs += '&pid=' + $('#pid').val();
        allAttrs += '&action=ajaxProductPriceBreakdownHtml';

        //data is now ready time to send an AJAX request
        $.post(site_obj.ajax_url, allAttrs, function (response) {
            $('.CostWrap').replaceWith(response);
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
});