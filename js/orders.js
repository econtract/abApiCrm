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
                        '<a href="#change-zip" onclick="jQuery(\'#checkAvailabilityForm\').toggle();jQuery(\'#ModalCheckAvailability .desc\').toggle();jQuery(\'#ModalCheckAvailability .content-error\').toggle();jQuery(\'#ModalCheckAvailability .contact-lnk\').toggle();jQuery(\'#ModalCheckAvailability  .alert.alert-danger\').toggle();">('+site_obj.change_zip_trans+')</a>' +
                        '</div>';
                    //html += '<a href="'+site_obj.contact_uri+'" class="modal-btm-link contact-lnk"><i class="fa fa-angle-right"></i> '+site_obj.contact_trans+'</a>';
                    html += jsonRes.html;//append any HTML returned by AJAX response this includes form and submit button
                }
                else if(jsonRes.available == true) {
                    html = '<div class="alert alert-success">' +
                        '<p>' + jsonRes.msg + '</p>' +
                        '<a href="#change-zip" onclick="jQuery(\'#ModalCheckAvailability form\').toggle();jQuery(\'#ModalCheckAvailability .desc\').toggle();jQuery(\'#ModalCheckAvailability .modal-list\').toggle();jQuery(\'#ModalCheckAvailability  .alert.alert-success\').toggle();">('+site_obj.change_zip_trans+')</a>' +
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


});

