<?php


namespace abApiCrm\includes\controller;

use abApiCrm\includes\api\callMeBackLead;

class callMeBackLeadController
{
    /**
     * @var array
     *
     *
    array(
    'first_name'                    => 'John',
    'last_name'                     => 'Doe',
    'email'                         => 'john.doe@server.com',
    'phone'                         => '0499656565',
    'producttype_id'                => 3,
    'product_id'                    => 4,
    'supplier_id'                   => 5,
    'affiliate_id'                  => 6,
    'subject'                       => 'Foo_subject',
    'remarks'                       => 'Foo_remarks',
    'call_at'                       => '2016-04-15 12:00:00',
    'call_until'                    => '2016-04-15 18:00:00',
    'deal_closed'                   => false,
    )
     *
     */

    /**
     * @var
     */
    protected $params;

    /**
     * @var array
     */
    protected $data = [];



    /**
     * @var array
     */
    protected static $default_fields = [

        'first_name'                    => 'John',
        'last_name'                     => 'Doe',
        'phone'                         => '0499656565',
        'call_at'                       => '2016-04-15 12:00:00',
        'call_until'                    => '2016-04-15 18:00:00',
        'producttype_id'                => 3,
        'product_id'                    => 4,
        'supplier_id'                   => 5,
        'affiliate_id'                  => 6,
        'subject'                       => 'Foo_subject',
        'remarks'                       => 'Foo_remarks',
        'deal_closed'                   => false
    ];


    public function __construct($params)
    {

        $this->params = $params;

        $this->prepareParameters();

        $this->lead = new callMeBackLead($this->data);

    }

    protected function prepareParameters(){

        foreach( self::$default_fields as $key => $paraKey ){
            $this->data[$key] = ( isset( $this->params[$key]) ) ? $this->params[$key] : '';
        }
    }

    public function send(){
        $this->lead->send();
    }

    public function getResponse(){
        return $this->lead->getResponse();
    }

}