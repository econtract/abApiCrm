<?php
/*
  Plugin Name: Aanbieders Api Crm
  Depends: Wp Autoload with Namespaces, Aanbieders Api Client
  Plugin URI: http://URI_Of_Page_Describing_Plugin_and_Updates
  Description: A plugin to load files from Aanbieders econtract API.
  Version: 1.0.0
  Author: Arslan Hameed <arslan.hameed@zeropoint.it>
  Author URI: http://URI_Of_The_Plugin_Author
  License: A "Slug" license name e.g. GPL2

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License, version 2, as
  published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

 */

namespace abApiCrm;

include_once(WP_PLUGIN_DIR . "/wpal-autoload/wpal-autoload.php" );

// If this file is accessed directory, then abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}


$result = wpal_create_instance(abApiCrm::class);
add_action('wp_ajax_callMeBack', array($result, 'callMeBack'));
add_action( 'wp_ajax_nopriv_callMeBack', array($result, 'callMeBack'));

add_action('wp_ajax_checkAvailability', array($result, 'checkAvailability'));
add_action( 'wp_ajax_nopriv_checkAvailability', array($result, 'checkAvailability'));

add_action('wp_ajax_saveSimpleOrder', array($result, 'saveSimpleOrder'));
add_action( 'wp_ajax_nopriv_saveSimpleOrder', array($result, 'saveSimpleOrder'));

add_action('wp_ajax_removeSubOrder', array($result, 'removeSubOrder'));
add_action( 'wp_ajax_nopriv_removeSubOrder', array($result, 'removeSubOrder'));

$resultEnergy = wpal_create_instance(abApiCrmEnergy::class);
add_action('wp_ajax_saveSimpleOrderEnergy', array($resultEnergy, 'saveSimpleOrder'));
add_action( 'wp_ajax_nopriv_saveSimpleOrderEnergy', array($resultEnergy, 'saveSimpleOrder'));

add_action('wp_ajax_validateCaptcha', array($resultEnergy, 'validateCaptcha'));
add_action( 'wp_ajax_nopriv_validateCaptcha', array($resultEnergy, 'validateCaptcha'));