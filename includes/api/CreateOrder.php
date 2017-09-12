<?php

namespace abApiCrm\includes\api;

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

	/**
	 * @param array $params
	 *
	 * @return $this
	 */
	public function send( $params = [] ) {
		if ( ! empty( $params ) ) {
			$this->parameters = $params;
		}

		$this->response = $this->crmService->createOrder( $this->parameters );

		return $this;
	}

	/**
	 * @return mixed
	 */
	public function getResponse() {
		return $this->response;
	}

}