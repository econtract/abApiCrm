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
            //console.log(reqField.text(), reqField.attr('name'), "====>", reqField.val());
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
        var selectedType = $(this).val();

        if (parseInt(selectedType) === 1) {
            targetForm.find('input[name=mobile_donor_client_nr]').removeAttr('disabled');
        } else {
            targetForm.find('input[name=mobile_donor_client_nr]').attr('disabled', 'true');
            //reset its value to empty so that it may not get submitted
            targetForm.find('#mobile_donor_client_nr').val("");
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
    });

    $("input[name=iban]").on('change', function () {
        $(this).attr('required', true);
    });

    $("input[name=client_nationality]").on('change', function() {
        var nat = $(this).val();

        if(nat == 'BE') {
            $('#client_idnr').parents('li').removeClass('hidden');
            $('#client_idnr').removeAttr('disabled');
            $('#client_idnr').attr('required', true);

            $('#client_rrnr').parents('li').addClass('hidden');
            $('#client_rrnr').attr('disabled', true);
            $('#client_rrnr').removeAttr('required');
        } else {
            $('#client_idnr').parents('li').addClass('hidden');
            $('#client_idnr').attr('disabled', true);
            $('#client_idnr').removeAttr('required');

            $('#client_rrnr').parents('li').removeClass('hidden');
            $('#client_rrnr').removeAttr('disabled', true);
            $('#client_rrnr').attr('required', true);
        }
    });
});