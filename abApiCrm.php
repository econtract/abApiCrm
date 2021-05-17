<?php
/**
 * Created by PhpStorm.
 * User: arslan
 * Date: 25/08/17
 * Time: 14:31
 */


namespace abApiCrm;

use AnbApiClient\Aanbieders;
use abApiCrm\includes\controller\callMeBackLeadController;
use abApiCrm\includes\controller\CreateOrderController;

if ( ! defined( 'AP_ABI_CRM_DIR' ) ) {
	define( 'AP_ABI_CRM_DIR', ABSPATH . '../../' );
}

if(!function_exists('getLanguage')) {
	function getLanguage() {
		$locale = function_exists('pll_current_language') ? pll_current_language() : Locale::getPrimaryLanguage(get_locale());

		return $locale;
	}
}

if(!function_exists('getUriSegment')) {
	function getUriSegment($n)
	{
		$segment = explode("/", parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

		return count($segment) > 0 && count($segment) >= ($n - 1) ? $segment[$n] : '';
	}
}

class abApiCrm {

    /**
     * @var
     */
    protected $createFullOrderObj;

    /**
     * @var
     */
    protected $createFullOrderResponse;

    public $sector;

    public $anbApi;

    public $apiConf = [
        'host'     => ANB_API_HOST,
        'staging'  => ANB_API_STAGING,
        'key'      => ANB_API_KEY,
        'secret'   => ANB_API_SECRET
    ];

	public function __construct() {
		$this->sector = getUriSegment(1);

        $this->anbApi = new Aanbieders ($this->apiConf);

	}

    /**
     * @param $data
     * @return mixed
     */
    public function createFullOrder($data)
    {
        $this->createFullOrderObj = new CreateOrderController($data);

        $this->createFullOrderObj->send();
        $this->createFullOrderResponse = $this->createFullOrderObj->getResponse();

        return $this->createFullOrderResponse;
    }

	/**
	 * @param $data
	 *
	 * @return mixed
	 */
    public function prepareParametersCallMeBack($data)
    {
        $explodeName = explode(" ", $data[ 'name' ]);

        $date = date('Y-m-d');
        if( array_key_exists('callDate', $data) ) {
            $date = date('Y-m-d', strtotime(str_replace('/', '-', $data[ 'callDate' ])));
        }

        $time = '13:00 - 17:00';
        if( array_key_exists('callTime', $data) ) {
            $time = $data[ 'callTime' ];
        }
        $explodeTime = explode(" - ", $time);

        $remarksData = '';
        if( $data[ 'remarks' ] === 'custom' ) {
            $remarksData .= $data[ 'contact_option' ];
            if( $data[ 'save_energy_comparison' ] == 1 ) {
                $remarksData .= ', User wants to save his/her energy comparison';
            }

            if( $data[ 'save_personal_data' ] == 1 ) {
                $remarksData .= ', User wants to save his/her personal data';
            }

            if( $data[ 'time_to_remind_me' ] === 'Remind before winter help text' ) {
                $remarksData .= ', User wants to remind him before winter';
            } else if( $data[ 'time_to_remind_me' ] === 'Remind specific date help text' ) {
                $remarksData .= ', User wants to remind him on specific date : ' . $data[ 'remind_me_later_date' ];
            }
        }

        $phoneNumber = $data[ 'phoneNumber' ];
        if( strpos($phoneNumber, '0') === 0 ) {
            $phoneNumber = substr($phoneNumber, 1);
        }

        $language = 'nl';
        $affiliateId = 1;
        if( getLanguage() === 'fr' ) {
            $language = 'fr';
            $affiliateId = 4;
        }

        return array(
            'first_name'     => array_shift($explodeName),
            'last_name'      => implode(' ', $explodeName),
            'language'       => $language,
            'phone'          => '+32'. $phoneNumber,
            'email'          => $data[ 'email' ],
            'call_at'        => $date . " " . trim($explodeTime[ 0 ]) . ":00",
            'call_until'     => $date . " " . trim($explodeTime[ 1 ]) . ":00",
            'producttype_id' => $data[ 'producttype_id' ],
            'product_id'     => $data[ 'product_id' ],
            'supplier_id'    => $data[ 'supplier_id' ],
            'affiliate_id'   => $affiliateId,
            'subject'        => 'Call me back lead', // need to change as it is static or custom
            'remarks'        => $remarksData,
            'deal_closed'    => false,
        );
    }


    /**
     * Checks product availability
     *
     * @param array $params If empty, $_GET will be used
     * @param bool  $output Indicates if the response should be directly outputted
     * @return array|void
     */
    public function checkAvailability($params = [], $output = true)
    {
        if (empty($params)) {
            $params = $_GET;
        }

        $defaults = [
            'zip'  => 0,
            'pid'  => 0,
            'prt'  => '',
            'lang' => getLanguage(),
        ];

        $params += $defaults;

        //Expected Params: ?pid=279&prt=internet&lang_mod=nl&zip=3500&action=check_availability
        $params['zip']  = intval($params['zip']);
        $params['pid']  = intval($params['pid']);
        $params['prt']  = trim(sanitize_text_field($params['prt']));
        $params['lang'] = trim(sanitize_text_field($params['lang']));

        if (empty($params['zip']) || empty($params['pid']) || empty($params['prt']) || empty($params['lang'])) {
            $response = new \stdClass();
            $response->available = false;
            $response->msg       = pll__('Something is wrong! Make sure to check availability after filling data.');
        } else {
            $apiParams = [
                'zip'  => $params['zip'],
                'pid'  => $params['pid'],
                'prt'  => $params['prt'],
                'lang' => $params['lang'],
            ];

            $response = $this->anbApi->checkAvailabilityRPC($apiParams);

            if (empty($response)) {
                $response            = new \stdClass();
                $response->available = false;
            } else {
                $response = json_decode($response);
            }

            if ($response->available === false) {
                $response->msg         = pll__("Sorry! The product is not available in your area.");
            }
            if ($response->available === true) {
                $response->msg  = pll__('Congratulations! The product is available in your area');//Ignore the API response message
            }
        }

        if ($output === true) {
            echo json_encode($response);
            wp_die();
        }
        return $response;
    }

	/**
	 * @param $zip
	 * @param $pid
	 * @param $pslug
	 * @param $pname
	 * @param $ptype
	 * @param $lang
	 * @param $prvid
	 * @param $prvslug
	 * @param $prvname
	 * @param $cats
	 * @param $sg
	 * @param $cproducts
	 */
	public function initSessionForProduct( $zip, $pid, $pslug, $pname, $ptype, $lang, $prvid, $prvslug, $prvname, $cats, $sg, $cproducts ) {
		unset( $_SESSION['order'] );
		unset( $_SESSION['product'] );
		$_SESSION['product']['zip']           = $zip;
		$_SESSION['product']['id']            = $pid;
		$_SESSION['product']['slug']          = $pslug;
		$_SESSION['product']['name']          = $pname;
		$_SESSION['product']['type']          = empty($ptype) ? 'internet' : $ptype;
		$_SESSION['product']['lang']          = $lang;
		$_SESSION['product']['provider_id']   = $prvid;
		$_SESSION['product']['provider_slug'] = $prvslug;
		$_SESSION['product']['provider_name'] = $prvname;
		$_SESSION['product']['cat']           = $cats;
		$_SESSION['product']['sg']            = $sg;
		$_SESSION['product']['cat_products']  = $cproducts;
		$_SESSION['product']['into_cart'] = true;

		//create a refferer link
		$_SESSION['HTTP_REFERER'] = isset($_SERVER['HTTP_REFERER']) || !empty($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';

		//$this->initCookieForProduct();//preserve the session data for one hour
	}

	/**
	 * @param int $timeInSecs
	 */
	public function initCookieForProduct( $timeInSecs = 3600 ) {
		setcookie( "product", json_encode( $_SESSION['product'] ), time() + 3600 );
	}

	/**
	 * Will store information of the active product in the checkout process
	 */
	public function checkoutActiveProduct($orderId, $productData) {
		update_post_meta($orderId, 'checkout_active_product', json_encode($productData));
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
		$data['parent_order_id'] = $_POST['parent_order_id'];
		$data['order_id']        = $_POST['order_id'];
		if(empty($data['order_id']) && !empty($_SESSION['order']['wp_order_id'])) {
			$data['order_id'] = $_SESSION['order']['wp_order_id'];
		}

		$data['order_status']    = $_POST['order_status'];

		$metaData['seq_number'] = $_POST['seq_number'];

		//Time to unset these variables from $_POST to keep only loopable data in $_POST
		unset( $_POST['order_title'] );
		unset( $_POST['order_slug'] );
		unset( $_POST['parent_order_id'] );
		unset( $_POST['order_id'] );
		unset( $_POST['order_status'] );
		unset( $_POST['seq_number'] );

		//now $_POST will have only the parameters which are ready to be saved, make sure to use same names which are in advance custom fields
		list( $order, $wpError ) = saveAnbOrderInWp( $data, $_POST, $metaData );
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

	/**
	 * Ajax method
	 */
	public function removeSubOrder() {
		$res = ['success' => false, 'msg' => pll__("The order was not removed, please try again.")];

		if(!empty($_POST['parent_order_id']) && !empty($_POST['seq_number'])) {
			//get appropriate child order
			$args = [
				'post_parent' => (int)$_POST['parent_order_id'],
				'post_type'   => 'anb_order',
				'orderby'     => 'ID',
				'order'       => 'ASC',
				'meta_key'    => 'seq_number',
				'meta_value'  => (int)$_POST['seq_number']
			];
			$subOrder = get_posts( $args )[0];
			//$res['debug'] = print_r($subOrder, true);
			$res['imp_data'] = [$_SESSION['order']['wp_order_id'], $subOrder->post_parent, $subOrder->ID];
			if($subOrder->post_parent == $_SESSION['order']['wp_order_id']) {//Making sure that the person who initiated the order is deleting
				$delPost = wp_delete_post($subOrder->ID);
				//$res['debug_del_post'] = print_r($delPost, true);
				if($delPost) {
					$res['success'] = true;
				}
			}
		}

		echo json_encode($res);
		wp_die();
	}
}
