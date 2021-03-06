<?php

namespace abApiCrm\includes\api;

use GuzzleHttp\Psr7\Request;

/**
 * Class CreateOrder
 * @package abApiCrm\includes\api.
 */
class CreateOrder extends baseApi {

	/**
	 * @var array
	 */
	protected $parameters;

	/**
	 * @var
	 */
	public $response;

	public function __construct( $parameters = [] ) {
		parent::__construct();

		$this->parameters = $parameters;
	}

	public function send( $params = [] ) {
		if ( ! empty( $params ) ) {
			$this->parameters = $params;
		}

        if(!$_SERVER['AB_CRM_URL']) {
            throw new \Exception('"AB_CRM_URL" is not defined');
        }

        $crmBaseUrl = $_SERVER['AB_CRM_URL'];
        $client = new \GuzzleHttp\Client(['base_uri' => $crmBaseUrl]);

        $data = $this->parameters;
        $data[ 'crm_api_id' ] = $_SERVER['AB_CRM_ID'];
        $data[ 'crm_api_key' ] = $_SERVER['AB_CRM_KEY'];

        $this->response = $client->request('POST','/api/orders', ['body' => json_encode($data),'headers' => ['content-type' => 'application/json'] ]);
		#$this->response = $this->crmService->createOrder(  );

		return $this;
	}

	/**
	 * @return mixed
	 */
	public function getResponse() {
		return $this->response;
	}

}