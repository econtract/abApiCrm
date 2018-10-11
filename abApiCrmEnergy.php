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
    	parent::__construct();
        add_action( 'init', array( $this, 'enqueueScripts' ) );
        //add_action( 'wp_enqueue_scripts', array( $this, 'enqueueScripts' ) );
    }

    /**
     * enqueue ajax scripts
     */
    function enqueueScripts() {

        /*wp_enqueue_script( 'crm-script-callMeBack', plugins_url( '/js/callMeBack.js', __FILE__ ), array( 'jquery', 'aanbieder_bootstrap_validate' ), '1.0.3', true );
        wp_enqueue_script( 'utils');*/
	    if($this->sector == pll__('energy')) {
		    wp_enqueue_script( 'crm-script-energy-orders', plugins_url( '/js/energy-orders.js', __FILE__ ), array(
			    'jquery',
			    'jquery-bootstrap-typeahead',
			    'aanbieder_default_script'
		    ), '1.1.5', true );

		    wp_localize_script( 'crm-script-energy-orders', 'orders_obj_energy',
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

	/**
	 * Ajax method
	 * Saves simple order form that, simple for are those using plain names in fields not arrays e.g. it'll be user_name but not user['name']
	 */
	public function saveSimpleOrder() {
		//negate action from $_POST
		unset( $_POST['action'] );

		//separate order related data and loopable meta data
		$data['order_title']     = $_POST['order_title'];
		$data['order_slug']      = $_POST['order_slug'];
		$data['order_id']        = $_POST['order_id'];
		if(empty($data['order_id']) && !empty($_SESSION['order_energy']['wp_order_id'])) {
			$data['order_id'] = $_SESSION['order_energy']['wp_order_id'];
		}

		$data['order_status']    = $_POST['order_status'];

		//Time to unset these variables from $_POST to keep only loopable data in $_POST
		unset( $_POST['order_title'] );
		unset( $_POST['order_slug'] );
		unset( $_POST['order_id'] );
		unset( $_POST['order_status'] );

		//now $_POST will have only the parameters which are ready to be saved, make sure to use same names which are in advance custom fields
		list( $order, $wpError ) = saveAnbEnergyOrderInWp( $data, $_POST, $metaData );
		$errors   = $wpError->get_error_messages();
		$response = null;
		if ( count( $errors ) > 0 ) {
			//its an error so send response appropriatly
			$response['success'] = false;
			$response['errors']  = $errors;
		} elseif ( $order > 0 ) {
			$response['success'] = true;
		} else {
			$response['success'] = 'no-update';
		}
		echo json_encode( $response );
		wp_die();
	}
}