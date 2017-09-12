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
	define( 'AP_ABI_CRM_DIR', ABSPATH . '../../' );
}

class abApiCrm {

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

		wp_enqueue_script( 'crm-script-callMeBack', plugins_url( '/js/callMeBack.js', __FILE__ ), array( 'jquery' ) );
		wp_enqueue_script( 'crm-script-orders', plugins_url( '/js/orders.js', __FILE__ ), array( 'jquery' ) );

		// in JavaScript, object properties are accessed as ajax_object.ajax_url, ajax_object.we_value
		//The object will be created before including callMeBack.js so its sufficient for orders.js too, there is no need to include it again
		wp_localize_script( 'crm-script-callMeBack', 'site_obj',
			array(
				'ajax_url'         => admin_url( 'admin-ajax.php' ),
				'contact_uri'      => "/" . pll__( 'contact' ),
				'contact_trans'    => pll__( 'Or contact us directly' ),
				'change_zip_trans' => pll__( 'Change zip code' ),
				'api_resp_trans'   => pll__( 'Something went wrong as API is not responding!' )
			)
		);
	}


	public function callMeBack() {
		$params = $this->prepareParametersCallMeBack( $_REQUEST['userInput'] );

		$this->callMeBack = new callMeBackLeadController( $params );
		$this->callMeBack->send();
		$this->callMeBackResponse = $this->callMeBack->getResponse();

		if ( $this->callMeBackResponse->status == 200 ) {
			//$this->address_id = $this->callMeBackResponse->data;
			return true;
		}

		return false;
	}

	/**
	 * @param $data
	 *
	 * @return mixed
	 */
	public function prepareParametersCallMeBack( $data ) {
		$explodeTime = explode( "-", $data['callTime'] );
		$explodeName = explode( " ", $data['name'] );
		$date        = date( 'Y-m-d', strtotime( $data['callDate'] ) );

		return [
			'first_name'     => $explodeName[0],
			'last_name'      => isset( $explodeName[1] ) ? $explodeName[1] : ' ',
			'phone'          => $data['phoneNumber'],
			'call_at'        => $date . " " . trim( $explodeTime[0] ) . ":00",
			'call_until'     => $date . " " . trim( $explodeTime[1] ) . ":00",
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

	/**
	 * Checks product availability
	 */
	public function checkAvailability() {
		if ( ! defined( 'AB_CHK_AVL_URL' ) ) {
			define( 'AB_CHK_AVL_URL', 'https://www.aanbieders.be/rpc' );
		}
		//Expected Params: ?pid=279&prt=internet&lang_mod=nl&zip=3500&action=check_availability
		$zip     = intval( $_GET['zip'] );
		$pid     = intval( $_GET['pid'] );
		$pslug   = $_GET['pslug'];
		$ptype   = trim( sanitize_text_field( $_GET['prt'] ) );
		$pname   = trim( sanitize_text_field( $_GET['pname'] ) );
		$lang    = trim( sanitize_text_field( $_GET['lang'] ) );
		$prvname = trim( sanitize_text_field( $_GET['prvname'] ) );
		$prvslug = trim( sanitize_text_field( $_GET['prvslug'] ) );
		$prvid   = intval( $_GET['prvid'] );
		$sg      = trim( sanitize_text_field( $_GET['sg'] ) );
		$cats    = $_GET['cat'];//TODO: From here
		//TODO: Include product type as well 'prt'
		$action   = 'check_availability';
		$response = null;
		if ( empty( $zip ) || empty( $pid ) || empty( $lang ) || empty( $ptype ) ) {
			$response = json_encode(
				[
					'available' => false,
					'msg'       => pll__( 'Something is wrong! Make sure to check availability after filling data.' )
				]
			);
		} else {
			global $post;
			$parentSlug = getSectorOnCats( $cats );
			$response   = file_get_contents( AB_CHK_AVL_URL . "?pid=$pid&zip=$zip&lang_mod=$lang&prt=$ptype&action=$action&rand=" . mt_rand() );
			$jsonDecRes = json_decode( $response );
			if ( $jsonDecRes->available === false ) {
				$catUrlPart = '';
				foreach ( $cats as $cat ) {
					$catUrlPart .= "cat[]=$cat&";
				}
				$urlParams             = "?$catUrlPart&zip=$zip&searchSubmit=&sg=$sg";
				$urlParamsWithProvider = "$urlParams&pref_cs[]=$prvid";
				$jsonDecRes->msg       = "Sorry! The product is not available in your area.";
				$jsonDecRes->html      = '<div class="content-error">
                        <p>' . pll__( 'We offer very similar deals in your area:' ) . '</p>
                        <a href="/' . $parentSlug . '/' . pll__( 'results' ) . $urlParamsWithProvider . '" class="btn btn-primary">' . sprintf( pll__( 'Alternative deals from %s' ), $prvname ) . '</a>
                        <a href="/' . $parentSlug . '/' . pll__( 'results' ) . $urlParams . '" class="btn btn-primary">' . pll__( 'Alternative deals from all providers' ) . '</a>
                        <a href="/' . pll__( 'contact' ) . '" class="modal-btm-link"><i class="fa fa-angle-right"></i> ' . pll__( 'Or contact us directly' ) . '</a>
                    </div>';
			}
			if ( $jsonDecRes->available === true ) {
				$_SESSION['product']['zip']           = $zip;
				$_SESSION['product']['id']            = $pid;
				$_SESSION['product']['slug']          = $pslug;
				$_SESSION['product']['type']          = $ptype;
				$_SESSION['product']['lang']          = $lang;
				$_SESSION['product']['provider_id']   = $prvid;
				$_SESSION['product']['provider_slug'] = $prvslug;
				$_SESSION['product']['cat']           = $cats;
				$html                                 = '<div class="modal-list">
	                        <p>' . pll__( 'Be sure to check your infrastructure:' ) . '</p>
	                        <ul class="list-unstyled bullet-list">
	                            <li>' . pll__( 'Check internet cable' ) . '
	                                <!--div class="tooltip tooltip-info">
	                                    <span class="tooltiptext"></span>
	                                    <img src="' . get_bloginfo( 'template_url' ) . '/images/common/icons/question-mark.png" alt="icon">
	                                </div-->
	                            </li>
	                            <li>' . pll__( 'Check phone line' ) . '
	                                <!--div class="tooltip tooltip-info">
	                                    <span class="tooltiptext"></span>
	                                    <img src="' . get_bloginfo( 'template_url' ) . '/images/common/icons/question-mark.png" alt="icon">
	                                </div-->
	                            </li>
	                        </ul>
	                        <a href="/' . pll__( 'telecom' ) . '/' . pll__( 'before-we-continue' ) . '" class="btn btn-primary">' . pll__( 'All good! Proceed' ) . '</a>
	                    </div>';
				$jsonDecRes->msg                      = 'Congratulations! The product is available in your area';//Ignore the API response message
				$jsonDecRes->html                     = $html;
			}
			if ( isset( $_GET['debug'] ) ) {
				$jsonDecRes->endpointUrl = AB_CHK_AVL_URL . "?pid=$pid&zip=$zip&lang_mod=$lang&action=$action&rand=" . mt_rand();
			}

			$response = json_encode( $jsonDecRes );
		}

		echo $response;
		wp_die();
	}

}