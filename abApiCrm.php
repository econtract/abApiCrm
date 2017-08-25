<?php
/**
 * Created by PhpStorm.
 * User: arslan
 * Date: 25/08/17
 * Time: 14:31
 */


namespace abApiCrm;

use abApiCrm\includes\controller\callMeBackLeadController;

if ( ! defined( 'AP_ABI_CRM_DIR' ) ) {
    define( 'AP_ABI_CRM_DIR', ABSPATH.'../../' );
}

class abApiCrm
{

    /**
     * @var
     */
    protected $callMeBack;

    /**
     * @var
     */
    protected $callMeBackResponse;


    public function __construct() {
        //enqueue JS scripts
        add_action( 'init', array( $this, 'enqueueScripts' ) );

    }

    /**
     * enqueue ajax scripts
     */
    function enqueueScripts() {

        wp_enqueue_script( 'call-me-back-script', plugins_url( '/js/callMeBack.js', __FILE__ ), array( 'jquery' ) );

        // in JavaScript, object properties are accessed as ajax_object.ajax_url, ajax_object.we_value
        wp_localize_script( 'call-me-back-script', 'call_me_back_object',
            array( 'ajax_url' => admin_url( 'admin-ajax.php' ) ) );
    }


    public function callMeBack()
    {
        $params = $this->prepareParametersCallMeBack($_REQUEST['userInput']);

        $this->callMeBack = new callMeBackLeadController($params);
        $this->callMeBack->send();
        $this->callMeBackResponse = $this->callMeBack->getResponse();

        if( $this->callMeBackResponse->status == 200 ) {
            //$this->address_id = $this->callMeBackResponse->data;
            return true;
        }

        return false;
    }

    /**
     * @param $data
     * @return mixed
     */
    public function prepareParametersCallMeBack($data)
    {
        $explodeTime  = explode("-", $data['callTime']);
        $explodeName  = explode(" ", $data['name']);
        $date  = date('Y-m-d', strtotime($data['callDate']));

        return [
        'first_name' => $explodeName[0],
        'last_name'  => isset($explodeName[1]) ? $explodeName[1] : ' ',
        'phone'      => $data['phoneNumber'],
        'call_at'    => $date." ". trim($explodeTime[0]). ":00",
        'call_until' => $date." ". trim($explodeTime[1]). ":00",
            // statid data for now
        'producttype_id' => 3,
        'product_id'     => 4,
        'supplier_id'    => 5,
        'affiliate_id'   => 6,
        'subject'        => 'Foo_subject',
        'remarks'        => 'Foo_remarks',
        'deal_closed'    => false
        ];
    }

}