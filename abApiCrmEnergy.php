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
        unset( $_SESSION['prodcut_energy'] );
        foreach ($getParams as $key => $val){
            $_SESSION['prodcut_energy'][$key] = $val;
        }
        //create a refferer link
        $_SESSION['HTTP_REFERER'] = isset($_SERVER['HTTP_REFERER']) || !empty($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
    }
}