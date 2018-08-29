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