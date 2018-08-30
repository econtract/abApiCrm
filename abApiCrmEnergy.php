<?php
/**
 * Created by PhpStorm.
 * User: arslan
 * Date: 25/08/17
 * Time: 14:31
 */


namespace abApiCrm;

if ( ! defined( 'AP_ABI_CRM_DIR' ) ) {
    define( 'AP_ABI_CRM_DIR', ABSPATH . '../../' );
}

class abApiCrmEnergy extends abApiCrm{

    public function __construct() {
        add_action( 'init', array( $this, 'enqueueScripts' ) );
        //add_action( 'wp_enqueue_scripts', array( $this, 'enqueueScripts' ) );
    }

    /**
     * enqueue ajax scripts
     */
    function enqueueScripts() {

        /*wp_enqueue_script( 'crm-script-callMeBack', plugins_url( '/js/callMeBack.js', __FILE__ ), array( 'jquery', 'aanbieder_bootstrap_validate' ), '1.0.3', true );
        wp_enqueue_script( 'utils');*/
        wp_enqueue_script( 'crm-script-energy-orders', plugins_url( '/js/energy-orders.js', __FILE__ ), array(
            'jquery',
            'jquery-bootstrap-typeahead',
            'aanbieder_default_script'
        ), '1.0.0', true );

        // in JavaScript, object properties are accessed as ajax_object.ajax_url, ajax_object.we_value
        //The object will be created before including callMeBack.js so its sufficient for orders.js too, there is no need to include it again
        wp_localize_script( 'crm-script-callMeBack', 'site_obj',
            array(
                'ajax_url'          => admin_url( 'admin-ajax.php' ),
                'contact_uri'       => "/" . pll__( 'contact' ),
                'contact_trans'     => pll__( 'Or contact us directly' ),
                'change_zip_trans'  => pll__( 'Change zip code' ),
                'api_resp_trans'    => pll__( 'Something went wrong as API is not responding!' ),
                'req_fields_filled' => pll__( 'Make sure all required fields are filled' ),
                'idcard_error'      => pll__('Please enter your ID card number'),
                'template_uri'      => get_template_directory_uri()
            )
        );
    }

    public function initSessionForProduct( $getParams ) {
        unset( $_SESSION['product_energy'] );
	    unset( $_SESSION['order_energy'] );
        foreach ($getParams as $key => $val){
            $_SESSION['product_energy'][$key] = $val;
        }
	    $_SESSION['product_energy']['id'] = $_SESSION['product_energy']['product_id'];
	    $_SESSION['product_energy']['type'] = $_SESSION['product_energy']['cat'];
	    $_SESSION['product_energy']['into_cart'] = true;

        //create a refferer link
        $_SESSION['HTTP_REFERER'] = isset($_SERVER['HTTP_REFERER']) || !empty($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
    }
}