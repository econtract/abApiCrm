<?php
/**
 * Created by PhpStorm.
 * User: imran
 * Date: 06/09/17
 * Time: 12:30
 */

namespace abApiCrm\includes\api;


class CreateOrder extends baseApi {

    protected $parameters;
    public $response;

    public function __construct($parameters = [])
    {
        parent::__construct();

        $this->parameters = $parameters;
    }

	/**
	 * @param array $params
	 *
	 * @return $this
	 */
    public function send($params = []){
    	if(!empty($params)) {
		    $this->parameters = $params;
	    }
    	$this->response = $this->crmService->createOrder($this->parameters);
    	return $this;
    }

    public function getResponse(){
        return $this->response;
    }
}