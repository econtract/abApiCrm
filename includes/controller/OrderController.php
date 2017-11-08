<?php

namespace abApiCrm\includes\controller;

use abApiCrm\includes\api\Order;

/**
 * Class OrderController
 * @package abApiCrm\includes\controller
 */
class OrderController
{
    /**
     * @var
     */
    protected $params;

    /**
     * @var array
     */
    protected $data = [];

    /**
     * @var
     */
    protected $order;


    /**
     * @var array
     */
    protected static $default_fields = [];


    public function __construct($params)
    {
        $this->params = $params;

        $this->order = new Order($this->params);
    }

    /**
     * @return \stdClass
     */
    public function getLatestOrderByProductResponse ()
    {
        return $this->order->getLatestOrderByProduct();
    }

}