<?php
/**
 * @category    S3ibusiness
 * @package     S3ibusiness_Giftpromo
 * @copyright   Copyright (c) 2011 S3i Business sarl au. (http://www.s3ibusiness.com)
 * @author      Ahmed Mahi <1hmedmahi@gmail.com>
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Clouds_Creategift_Helper_Data extends Mage_Core_Helper_Abstract
{
     
     protected $pro_collections =array();
     
     public function getCurrentcustomerID_addr(){
          
          $session = Mage::getSingleton('customer/session');
          $remote_addr = $this->getRemoteAddr();
          
          $CustomerData = array('remote_addr' => $remote_addr, 'customer_id' => '');
          
          if($session->isLoggedIn()){
               $customer = $session->getCustomer();
               $current_userID = $customer->getID();
               
               $CustomerData['customer_id'] = $current_userID;
          }
          
          return $CustomerData;
          
          // echo '<pre>'.print_r($customer,true).'</pre>';
     }
      
     public function getRemoteAddr(){
          return Mage::helper('core/http')->getRemoteAddr(true);  
     }
     
     public function getCollectionProductsPost($params = array()){
          /* $pro_collections = array( //option ID
                      '0' => array(
                          'product_id' => '70',
                          'delete' => '',
                          // 'selection_price_value' => '10',
                          'selection_price_type' => 0,
                          'selection_qty' => 1,
                          'selection_can_change_qty' => 0,
                          'position' => 0,
                          'is_default' => 1
                      ), 
           
                      '1' => array(
                          'product_id' => '75', 
                          'delete' => '',
                          // 'selection_price_value' => '10',
                          'selection_price_type' => 0,
                          'selection_qty' => 1,
                          'selection_can_change_qty' => 0,
                          'position' => 0,
                          'is_default' => 1
                      )
                  ); */
                  
        $pro_collections = $params['products'];
                  
         $this->pro_collections = $pro_collections;
          
          return $this->pro_collections;
     }
     
     
     public function getSerializedCollectionProductsPost(){
          return serialize($this->pro_collections);
     }
     
     /*
          * Update if new data is changed added or deleted
     */
     public function updateCollection_products($new_collection,$cPrdcts){
          
          $data = @unserialize($cPrdcts);
          if ($data !== false) {
               if(is_array($new_collection)){
                    
                    //check if new array is different 
                    if($this->array_diff_assoc_recursive($new_collection,$data)){
                         $merged = serialize($new_collection);
                    }
                    else{
                         $merged = $cPrdcts;
                    }
                    
               }
          }
          
          $returnData = (isset($merged))? $merged : $cPrdcts;
          
          return $returnData;
     }
     
     
     
     /*
     *         Difference between two array values multidimensional array
     */
     function array_diff_assoc_recursive($array1, $array2){
          foreach($array1 as $key => $value)
          {
               if(is_array($value))
               {
                    if(!isset($array2[$key]))
                    {
                         $difference[$key] = $value;
                    }
                    elseif(!is_array($array2[$key]))
                    {
                         $difference[$key] = $value;
                    }
                    else
                    {
                         $new_diff = $this->array_diff_assoc_recursive($value, $array2[$key]);
                         if($new_diff != FALSE)
                         {
                              $difference[$key] = $new_diff;
                         }
                    }
               }
               elseif(!isset($array2[$key]) || $array2[$key] != $value)
               {
                    $difference[$key] = $value;
               }
          }
          return !isset($difference) ? 0 : $difference;
     }
     
     
     /**
      * Get item configurable child product
      *
      * @return Mage_Catalog_Model_Product
      */
     public function getCartChildProductIDs(){ 
          
          $cart = Mage::getSingleton('checkout/cart');
          $productIds = array();
          foreach ($cart->getQuote()->getAllVisibleItems() as $item) {
               $productId = $item->getProduct()->getId();
               if ($option = $item->getOptionByCode('simple_product')) {
                    $productId = $option->getProduct()->getId();
               }
               $productIds[] = $productId;
          }
          
          return $productIds;
     }
     
     
     
     public function setGiftCollectionSession($data=array()){
          Mage::getSingleton('core/session')->setGiftCollectionData($data); 
     }
     
     public function getGiftCollectionSession(){
          return Mage::getSingleton('core/session')->getGiftCollectionData(); 
     }
     
     public function unsetGiftCollectionSession(){
          Mage::getSingleton('core/session')->unsGiftCollectionData();
     }
     
     public function addGiftCollectionSession($newsession){
          
          $old_session = $this->getGiftCollectionSession();
          if(isset($old_session) && is_array($old_session)){
               $updated_sess = array_push($old_session,$newsession);
               
               $old_session = array_map("unserialize", array_unique(array_map("serialize", $old_session)));
               
               $this->setGiftCollectionSession($old_session);
          }
          else{
               $addsession = array();
               array_push($addsession,$newsession);
               $this->setGiftCollectionSession($addsession);
          }
          
     }
     
     public function addGiftProduct($p_id,$qty = 1){
          $data = array(
                              'product_id' => $p_id,
                              'delete' => '',
                              // 'selection_price_value' => '10',
                              'selection_price_type' => 0,
                              'selection_qty' => $qty,
                              'selection_can_change_qty' => 0,
                              'position' => 0,
                              'is_default' => 1
                         ); 
          $old_session = $this->addGiftCollectionSession($data);
     }
     
     
     public function createGiftProductSelection($p_id,$qty = 1){
          $fields = array(
                              'product_id' => $p_id,
                              'delete' => '',
                              // 'selection_price_value' => '10',
                              'selection_price_type' => 0,
                              // 'selection_qty' => $qty,
                              'selection_can_change_qty' => 0,
                              'position' => 0,
                              'is_default' => 1
                         ); 
          
          ob_start();
               echo '<div class="hidden-product-wrap">';
                    foreach($fields as $fkey => $fvalue){
                         echo '<input type="hidden" name="products['.$p_id.']['.$fkey.']" value="'.$fvalue.'">';
                    }
                    
                    $select_option = range(0,5);
                    
                    echo '<select name="products['.$p_id.'][selection_qty]">';
                         foreach($select_option as $option){
                              $selected = ($option == $qty)? 'selected' : '';
                              echo '<option value="'.$option.'" '.$selected.'>'.$option.'</option>';
                         }
                    echo '<select>';
               
               echo '</div>';
          $HTMLdata = ob_get_clean();
          
          return $HTMLdata;
     }
     
     
     
}