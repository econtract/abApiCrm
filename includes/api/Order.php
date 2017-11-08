<?php

namespace abApiCrm\includes\api;

/**
 * Class Order
 * @package abApiCrm\includes\api
 */
class Order extends baseApi
{

	/**
	 * @var array
	 */
	protected $parameters;

	/**
	 * @var
	 */
	public $response;


	public function __construct( $parameters = [] )
    {
		parent::__construct();

		$this->parameters = $parameters;
	}

	/**
	 * @param array $params
	 *
	 * @return $this
	 */
	public function send( $params = [] )
    {

	}

    /**
     * @param array $params
     * @return \stdClass
     */
	public function getLatestOrderByProduct( $params = [] )
    {
        if ( ! empty( $params ) ) {
            $this->parameters = $params;
        }

        //var_dump($this->crmService->getLatestOrderByProduct($this->parameters), $this->parameters, "params"); die;
        return $this->crmService->getLatestOrderByProduct($this->parameters);
    }

}