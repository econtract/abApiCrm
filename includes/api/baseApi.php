<?php
namespace abApiCrm\includes\api;

use \Econtract\Crm\CrmService;

Abstract Class baseApi{

    protected $crmService;

    /**
     * Connect to CRM
     *
     * Base_Api constructor
     */
    public function __construct()
    {
        $dotenv = new \Dotenv\Dotenv(AP_ABI_CRM_DIR);
        $dotenv->load();

        $this->crmService = new CrmService();
    }

    /**
     * Send API Call
     */
    abstract public function send();
}

