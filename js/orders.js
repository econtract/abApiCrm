function requiredFieldsFilled(inputForm) {
    var filled = true;
    //check all required fields if they are filled submit the form
    inputForm.find(':input[required]:not(:radio):not(:checkbox):not(:disabled):not([type=hidden]), ' +
        ':input[required]:radio:checked:not(:disabled), :input[required]:checkbox:checked:not(:disabled), select[required]:not(:disabled), ' +
        'select[required]:not(".hidden")').each(function(){
        var reqField = jQuery(this);
        var isSelectOpt = false;
        if(reqField.prop("tagName").toLowerCase() == 'select') {
            if(typeof reqField.attr('disabled') == 'undefined') {
                reqField = reqField.find('option').filter(':selected');
                isSelectOpt = true;
            } else {
                return true;//don't consider disabled select
            }
        }

        //if some field don't have name ignore it, and is not a select option
        if(_.isEmpty(reqField.attr('name')) && !isSelectOpt) {
            //console.log("****", reqField.attr('name'), reqField.val());
            return true;
        }

        if(_.isEmpty(reqField.val())) {
            //console.log(reqField.text(), reqField.attr('name'), "====>", reqField.val());
            filled = false;
        }
    });

    return filled;
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
            $('#ModalCheckAvailability .modal-body').append(html);
        });
    });

    $("#select_provider").on('change', function () {
        var changedProviderObj = $(this).find('option:selected');
        var changedProviderTxt = $(changedProviderObj).text();
        var changedProviderVal = $(changedProviderObj).val();

        //console.log(changedProviderObj, changedProviderTxt, changedProviderVal);
        //$('span.selected_supplier').text(changedProviderTxt);
    });

    //Order steps, for the forms that are without array called as simple forms,
    //this means that the input variables are not this way e.g. form_input[], or form_input['order'][] etc
    $("body").on('submit', '.order-simple-form', function(e) {
        e.preventDefault();
        var self = $(this);
        var inputForm = $(this);
        var formInputs = $(inputForm).serialize()+'&action=saveSimpleOrder&'+$('#orderCommon').serialize();

        var filled = requiredFieldsFilled(inputForm);

        if(filled === false) {
            return false; //don't allow sumbitting the form
        }

        var data = formInputs;

        $.post(site_obj.ajax_url, data, function (response) {
            console.log(response);
            var jsonRes = JSON.parse(response);
            console.log(jsonRes);
            if(jsonRes.success == true || jsonRes.success.toString() == "no-update") {
                //In case of mobile form trigger next button to open the next form
                console.log(self.parents('.form-type.type-mobile-phone'));
                console.log("Triggering...", self.parents('.form-type').find('.next-step-btn a'));
                self.parents('.form-type').find('.next-step-btn a').trigger('click');
            } else {
                self.append('<div class="alert alert-danger alert-dismissable">' +
                    '<a href="#" class="close" data-dismiss="alert">×</a>' +
                    site_obj.req_fields_filled+'</div>');
            }
        });
    });

    //on chaning simple form values by ignoring hidden fields control the behavior of submit button
    $("body").on('change', '.order-simple-form', function(e) {
        var inputForm = $(this);
        var filled = requiredFieldsFilled(inputForm);

        if(filled === true) {
            inputForm.find('input[type=submit]').removeClass('disabled');
            inputForm.find('.next-step-btn a').removeClass('disabled');
        } else {
            inputForm.find('.next-step-btn a').addClass('disabled');
            inputForm.find('input[type=submit]').addClass('disabled');
        }
    });

    //check all forms if everything required is filled enable delivery step
    $('body').on('click', '.next-step-btn a', function(e) {
        console.log("Trying to enable delivery btn...");
        var error = false;
        $('body').find('.order-simple-form').each(function() {
            var inputForm = $(this);
            if(requiredFieldsFilled(inputForm) === false) {
                console.log("Error>>>>>");
                console.log(inputForm);
                error = true;
            }
        });

        var deliveryBtn = $('.form-nextstep a.btn-default');
        if(error === true) {
            if(!deliveryBtn.hasClass("disabled")){
                deliveryBtn.addClass("disabled");
            }
        }
        else if(error === false) {
            deliveryBtn.removeClass("disabled");
        }
        else {
            if(!deliveryBtn.hasClass("disabled")){
                deliveryBtn.addClass("disabled");
            }
        }
    });

    //on changing mobile product set other required variables
    $("body").on('change', '.order-simple-form.mobile-form select[name=mobile_product_id]', function() {
        /*console.log("Changed to ..." + $(this).find(":selected").val() + "| " + $(this).val());
        console.log($(this).val(), $(this).find(":selected").val(), $(this).find(":selected"), $(this).find(":selected").text(), $(this).text());
        console.log("+++");
        console.log($(this).find(":selected").text());
        console.log($(this).text());*/
        var targetForm = $(this).parents('.order-simple-form');
        var productName = $(this).find(":selected").text();
        productNameArr = productName.split(" - ");
        productName = productNameArr[0];
        var productPrice = productNameArr[1];
        //console.log("price**:", productPrice);
        targetForm.find('input[name=product_id]').val($(this).find(":selected").val());
        targetForm.find('input[name=product_name]').val(productName);
        targetForm.find('input[name=mobile_product_name]').val(productName);
        targetForm.find('.bundle-ind-price').text(productPrice);
        var subOrderTitle = productName + " (Sub Order)";
        //console.log("Sub order title:", subOrderTitle);
        $('#orderCommon input[name=order_title]').val(subOrderTitle);
        $('#orderCommon input[name=order_slug]').val("#");
    });

    //on changing mobile type to prepaid hide account number, whereas on postpaid show it
    $("body").on('change', '.order-simple-form select[name=mobile_donor_type]', function() {
        var targetForm = $(this).parents('.order-simple-form');
        console.log(targetForm);
        var selectedType = $(this).val();
        console.log(selectedType);
        if(parseInt(selectedType) === 1) {
            targetForm.find('input[name=mobile_donor_client_nr]').removeAttr('disabled');
        } else {
            targetForm.find('input[name=mobile_donor_client_nr]').attr('disabled', 'true');
            //reset its value to empty so that it may not get submitted
            targetForm.find('#mobile_donor_client_nr').val("");
        }
    });

    //control delivery form submit button
    $("#delivery_form").on("change", function() {
        var inputForm = $(this).parents('form');
       // console.log(inputForm);
        var filled = requiredFieldsFilled(inputForm);
        //console.log("Filled", filled);
        if(filled === true) {
            $('.btn.btn-default.disabled').removeClass("disabled");
        }
    });

    //control personal info form submit button
    $("#personal_info_form").on("change", function() {
        var inputForm = $(this);

        var filled = requiredFieldsFilled(inputForm);
        if(filled === true) {
            inputForm.find('.btn.btn-default.disabled').removeClass("disabled");
            inputForm.find('input[type=submit]').removeClass("disabled");
        }
    });

    //control account number field based on payment info selection
    $("input[name=payment_method]").on('change', function() {
        var selectedField = $(this);
        var selectedVal = selectedField.val();

        if(parseInt(selectedVal) === 2) {
            $('#iban').parents('li').removeClass('hidden');
            $('#iban').removeAttr('disabled');
        }
        else if(parseInt(selectedVal) === 1) {
            if($('#iban').hasClass('with-vir')) {
                $('#iban').parents('li').removeClass('hidden');
                $('#iban').removeAttr('disabled');
            } else {
                $('#iban').parents('li').addClass('hidden');
                $('#iban').attr('disabled', true);
            }
        }
        else {
            $('#iban').parents('li').addClass('hidden');
            $('#iban').attr('disabled', true);
        }
    });
});