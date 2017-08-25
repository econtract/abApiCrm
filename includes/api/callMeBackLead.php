<?php
/**
 * Created by PhpStorm.
 * User: arslan
 * Date: 25/08/17
 * Time: 14:39
 */

namespace abApiCrm\includes\api;


class callMeBackLead extends baseApi {

    protected $parameters;
    public $response;

    public function __construct($parameters)
    {
        parent::__construct();

        $this->parameters = $parameters;
    }

    public function send(){
        $this->response = $this->crmService->createCallMeBackLead( $this->parameters );
    }

    public function getResponse(){
        return $this->response;
    }
}