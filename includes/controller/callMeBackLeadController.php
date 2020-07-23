<?php namespace abApiCrm\includes\controller;


use abApiCrm\includes\api\callMeBackLead;

class callMeBackLeadController {

    protected $params;

    protected $data = array();

    /**
     * @var array
     */
    protected static $default_fields = array(
        'first_name'            => '',
        'last_name'             => '',
        'language'              => 'nl',
        'phone'                 => '0499656565',
        'call_at'               => '2016-04-15 12:00:00',
        'call_until'            => '2016-04-15 18:00:00',
        'producttype_id'        => 0,
        'product_id'            => 0,
        'supplier_id'           => 0,
        'affiliate_id'          => 1,
        'subject'               => '',
        'remarks'               => '',
        'deal_closed'           => false,
    );


    public function __construct($params)
    {
        $this->params = $params;

        $this->prepareParameters();

        $this->lead = new callMeBackLead($this->data);
    }


    protected function prepareParameters()
    {
        foreach( self::$default_fields as $key => $paraKey ) {
            $this->data[ $key ] = ( isset($this->params[ $key ]) ) ? $this->params[ $key ] : '';
        }
    }

    public function send()
    {
        $this->lead->send();
    }

    public function getResponse()
    {
        return $this->lead->getResponse();
    }
}
