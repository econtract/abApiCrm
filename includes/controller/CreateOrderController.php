<?php


namespace abApiCrm\includes\controller;

use abApiCrm\includes\api\CreateOrder;

class CreateOrderController
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
     * @var array
     */
    protected static $default_fields = [

        // Client data
        'client_gender'              => 1,
        'client_segment'             => 1,
        'client_first_name'          => 'John',
        'client_last_name'           => 'Doe',
        'client_birthdate'           => '1956-12-25',
        'client_birthplace'          => 'Hasselt',
        'client_nationality'         => 'BE',
        'client_idnr'                => 5,
        'client_cellphone'           => '012457898',
        'client_landline'            => '',
        'client_fax'                 => '',
        'client_email'               => 'john.doe@server.com',
        'client_language'            => 'nl',
        'client_iban'                => '',
        'client_family_size'         => 3,
        'idnr'                       => 3, // ID card Number

        // Address data
        'address_street'             => 'Street 02',
        'address_nr'                 => 10,
        'address_box'                => '',
        'address_postal_code'        => 3500,
        'address_city'               => 'Hasselt',
        'address_country'            => 'BE',

        // address New Data fields
        'building_type'              => '',
        'address_floor'              => '',
        'situation'                  => '',

        // Order data
        'comparison_id'              => 45688954,
        'affiliate_id'               => 50,
        'sales_channel_id'           => 1,
        'ip_address'                 => '',
        'remarks'                    => 'Please fix fast',
        'internal_remarks'           => 'Fix fast for this customer',
        'product_id'                 => 12,
        'supplier_id'                => 5,
        'payment_method'             => 1,
        'producttype'                => 'internet',

        // internet fields
        'internet_new_connection'    => 45688954,
        'internet_new_modem'         => 50,
        'internet_donor_provider'    => 1,

        // Mobile Data
        'mobile_subscription_alias' => 'Please fix fast',
        'mobile_product_name'       => 'Fix fast for this customer',
        'mobile_product_id'         => 12,
        'sim_type'                  => 5,
        'keep_number'               => 1,
        'internet_donor_phone_nr'   => 'internet', // verify this fields exists under mobile
        'mobile_donor_operator'     => 45688954,
        'mobile_donor_type'         => 50,
        'mobile_donor_client_nr'    => 1,
        'mobile_donor_sim_nr'       => '',

        // Telephone Data
        'telephony_phone_nr'        => 'internet', // verify this fields exists under mobile
        'telephony_donor_operator'  => 45688954,
        'telephony_donor_client_nr' => 50,

        // Other Fields
        'install_type'              => 50,
        'iban'                      => 50,
        'sub_order'                 => '',

        // Invoice data
        'invoice_address_is'        => '',

        // IDTV data
        /**
         * Todo : IDTV data will be under options
         */

    ];


    public function __construct($params, $user_id = null, $address_id = null, $address_invoice_id = null)
    {
        $this->params = $params;
        $this->user_id = $user_id;
        $this->address_id = $address_id;
        $this->address_invoice_id = $address_invoice_id;

        $this->prepareParameters();

        $this->order = new CreateOrder($this->data);
    }

    protected function prepareParameters()
    {

        foreach( self::$default_fields as $key => $paraKey ){
            $this->data[$key] = ( isset( $this->params[$key]) ) ? $this->params[$key] : '';
        }

        $this->data['ip_address'] = $_SERVER['REMOTE_ADDR'];
        $this->data['affiliate_id'] = 1;
        $this->data['sales_channel_id'] = 1;
        $this->data['send_confirmation_mail'] = true;


        $this->data['client_birthdate'] = date('Y-m-d', strtotime($this->params['client_birthdate']));
        $this->data['client_nationality'] = 'BE';

        $this->data['client_family_size'] = !empty($this->params['client_family_size']) ? $this->params['client_family_size'] : 0;
        $this->data['comparison_id'] = !empty($this->params['comparison_id']) ? $this->params['comparison_id'] : 0;


        if (isset($this->params['telephone_option_json']) || isset($this->params['idtv_option_json'])) {
            $telOptions = $idtvOptions = [];
            $telephone = json_decode($this->params['telephone_option_json'], true);
            $idtv = json_decode($this->params['idtv_option_json'], true);

            if ($telephone && !is_null($telephone['options'])) {
                $telOptions = $telephone['options'];
            }

            if ($idtv && !is_null($idtv['options'])) {
                $idtvOptions = $idtv['options'];
            }

            if ($telOptions && $idtvOptions) {
                $this->data['options'] = array_merge($telOptions, $idtvOptions);
            }

        }

       // var_dump($this->data); die;
    }

    public function send()
    {
        $this->order->send();
    }

    public function getResponse()
    {
        return $this->order->getResponse();
    }

}