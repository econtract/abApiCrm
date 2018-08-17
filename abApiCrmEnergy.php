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

    /**
     * @var
     */
    protected $callMeBack;

    /**
     * @var
     */
    protected $callMeBackResponse;

    /**
     * @var
     */
    protected $createFullOrderObj;

    /**
     * @var
     */
    protected $createFullOrderResponse;


    public function __construct() {
        //enqueue JS scripts
        add_action( 'init', array( $this, 'enqueueScripts' ) );

    }

    /**
     * enqueue ajax scripts
     */
    function enqueueScripts() {

        wp_enqueue_script( 'crm-script-callMeBack', plugins_url( '/js/callMeBack.js', __FILE__ ), array( 'jquery', 'aanbieder_bootstrap_validate' ), '1.0.3', true );
        wp_enqueue_script( 'utils');
        wp_enqueue_script( 'crm-script-orders', plugins_url( '/js/orders.js', __FILE__ ), array(
            'jquery',
            'jquery-bootstrap-typeahead',
            'aanbieder_default_script'
        ), '1.9.1', true );

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
        unset( $_SESSION['prodcut_energy'] );
        foreach ($getParams as $key => $val){
            $_SESSION['prodcut_energy'][$key] = $val;
        }
        //create a refferer link
        $_SESSION['HTTP_REFERER'] = isset($_SERVER['HTTP_REFERER']) || !empty($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
    }
}