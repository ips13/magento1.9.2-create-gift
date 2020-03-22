<?php

class Clouds_Creategift_IndexController extends Mage_Core_Controller_Front_Action
{
     
     protected $_Collection=null;
     protected $_Helper = null;
 
     public function indexAction(){
          
          if(is_null($this->_Helper)){
               $this->_Helper = Mage::helper('giftcollection');
          }
          
          echo 'Test Action';
          $this->loadLayout();
          $listBlock = $this->getLayout()->getBlock('content'); 
          $this->renderLayout(); 
     }
      
      
     public function AjaxAction(){
          
          if(is_null($this->_Helper)){
               $this->_Helper = Mage::helper('giftcollection');
          }
          
          
          $params = $this->getRequest()->getParams();
          $product_id = $params['product'];
          $sample_prdct = $params['sample_prdct'];
          $qty = (isset($params['qty']))? $params['qty'] : 1;
          $main_product_ID = $product_id;
          
          $product_model = Mage::getSingleton("catalog/product");
          $product = $product_model->load($product_id);
          
          if($product->isConfigurable()){
               $childProduct = Mage::getModel('catalog/product_type_configurable')->getProductByAttributes($this->getRequest()->getParam('super_attribute'), $product);
               $product_id = $childProduct->getId();
          }
          
          $form_data = $this->_Helper->createGiftProductSelection($product_id,$qty);
          
          // print_r($this->_Helper->getGiftCollectionSession()); exit;
          
          echo json_encode(array('success' => 1, 'product_id' => $main_product_ID,'fields' => $form_data,'sample_prdct' => $sample_prdct));
     }
     
}