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
    }

    public function initSessionForProduct($getParams)
    {
        unset($_SESSION[ 'product_energy' ]);
        unset($_SESSION[ 'order_energy' ]);

        foreach( $getParams as $key => $val ) {
            $_SESSION[ 'product_energy' ][ $key ] = $val;
        }

        $productType = $_SESSION[ 'product_energy' ][ 'cat' ];
        if( empty($productType) ) {
            $productType = $_SESSION[ 'product_energy' ][ 'producttype' ];
        }

        $_SESSION[ 'product_energy' ][ 'id' ] = $_SESSION[ 'product_energy' ][ 'product_id' ];
        $_SESSION[ 'product_energy' ][ 'type' ] = $productType;
        $_SESSION[ 'product_energy' ][ 'cat' ] = $productType;
        $_SESSION[ 'product_energy' ][ 'producttype' ] = $productType;
        $_SESSION[ 'product_energy' ][ 'into_cart' ] = true;

        if( !$_SESSION[ 'product_energy' ][ 'supplier' ] && $_SESSION[ 'product_energy' ][ 'cmp_sid' ] ) {
            $_SESSION[ 'product_energy' ][ 'supplier' ] = $_SESSION[ 'product_energy' ][ 'cmp_sid' ];
        }

        if( !$_SESSION[ 'product_energy' ][ 'cmp_sid' ] && $_SESSION[ 'product_energy' ][ 'supplier' ] ) {
            $_SESSION[ 'product_energy' ][ 'cmp_sid' ] = $_SESSION[ 'product_energy' ][ 'supplier' ];
        }

        // Create a referer link
        $_SESSION[ 'HTTP_REFERER' ] = isset($_SERVER[ 'HTTP_REFERER' ]) || !empty($_SERVER[ 'HTTP_REFERER' ]) ? $_SERVER[ 'HTTP_REFERER' ] : '';
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

	function validateCaptcha(){

        $validCaptacha = isValidCaptcha($_REQUEST['userInput']['g-recaptcha-response']);

        if($validCaptacha == 1) {
            echo 'done';
            wp_die();
        }
    }

    public function availabilityErrorHtml( $parentSegment, $urlParamsWithProvider, $prvname, $urlParams ) {
        return '<div class="content-error">
                        <p>' . pll__( 'We offer very similar deals in your area: - Energy' ) . '</p>
                        <a href="/' . $parentSegment . '/' . pll__( 'results' ) . $urlParamsWithProvider . '" class="btn btn-primary">' . sprintf( pll__( 'Alternative deals from %s - Energy' ), $prvname ) . '</a>
                        <a href="/' . $parentSegment . '/' . pll__( 'results' ) . $urlParams . '" class="btn btn-primary">' . pll__( 'Alternative deals from all providers - Energy' ) . '</a>
                        <a href="/' . pll__( 'contact' ) . '" class="modal-btm-link"><i class="fa fa-angle-right"></i> ' . pll__( 'Or contact us directly - Energy' ) . '</a>
                    </div>';
    }

    /**
     * @param $parentSegment
     *
     * @return string
     */
    public function availabilitySuccessHtml( $parentSegment, $checkoutParams = "" ) {

        if(!empty($checkoutParams)) {
            //$checkoutParams = "?$checkoutParams";
            $params = explode('&' , $checkoutParams);

            foreach ($params as $key => $val){
                if(!empty($val)) {
                    $thisParam = explode('=', $val);
                    if ($thisParam[0] == 'hidden_prodsel_cmp' || $thisParam[0] == 'zip' || $thisParam[0] == 'cat') {
                        continue;
                    } else {
                        $nParams[] = $val;
                    }
                }
            }
            $checkoutParams = '?'.implode('&' , $nParams);
        }

        return '<div class="modal-list">
                    <p>' . pll__( 'Be sure to check your infrastructure: - Energy' ) . '</p>
                    <ul class="list-unstyled bullet-list">
                        <li>' . pll__( 'Check internet cable - Energy' ) . ' <span class="infoTip"><a href="#" data-toggle="availability-tooltip" title="' . pll__( 'Tooltip for check internet cable - Energy' ) . '">?</a></span></li>
                        <li>' . pll__( 'Check phone line - Energy' ) . ' <span class="infoTip"><a href="#" data-toggle="availability-tooltip" title="' . pll__( 'Tooltip for check phone line - Energy' ) . '">?</a></span></li>
                    </ul>
                    <a href="/' . $parentSegment . '/' . pll__( 'checkout' ) . $checkoutParams . '" class="btn btn-primary" data-checkout>' . pll__( 'All good! Proceed - Energy' ) . '</a>
                </div>';
    }
}
