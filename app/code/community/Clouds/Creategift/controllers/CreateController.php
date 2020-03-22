<?php
 
class Clouds_Creategift_CreateController extends Mage_Core_Controller_Front_Action
{
     protected $_Collection=null;
     protected $_Helper = null;
     
     public function indexAction(){
          
          if(is_null($this->_Collection)){
               $this->_Collection = Mage::getModel('giftcollection/giftcollection')->getCollection();
          }
          
          if(is_null($this->_Helper)){
               $this->_Helper = Mage::helper('giftcollection'); 
          }
          
          $params = $this->getRequest()->getParams();
          
          // echo '<pre>'.print_r($params,true).'</pre>'; exit;
          
          $collection_products = $this->_Helper->getCollectionProductsPost($params);
          $serialized_product_collection = $this->_Helper->getSerializedCollectionProductsPost();
          
          $sku = preg_replace('#[^0-9a-z]+#i', '-', $params['collection-name']).time();
          $atts = array(
                         'p_sku' => $sku,
                         'p_name' => $params['collection-name'],
                         'p_attr_set_id'     => 10,                        // Change the Create Gift Attribute set id
                         'p_description'     => 'This is a long description',
                         'p_short_description'     => 'This is a short description',
                         'p_categroies'     => array(67),                   // Change the categories
               );
               
          $p_id = $this->createBundleProduct($collection_products,$atts);
          
          $this->createCollection($p_id,$serialized_product_collection); 
          
          $this->addBundleToCart($p_id);
          
          $url = Mage::getUrl('checkout/cart');
          echo '<script type="text/javascript"> window.location = "'.$url.'" </script>'; exit;
          
          echo 'DONE';
          // echo '<pre>'.print_r($this->_Collection,true).'</pre>';
          
     }
     
     
     public function createCollection($cpID,$cPrdcts){
          
          $CustomerIdAddr = $this->_Helper->getCurrentcustomerID_addr();
          // $collection_products = $this->_Helper->getCollectionProductsPost();
          $collection_products = $cPrdcts;
          $created_product_id = $cpID;
          
          $data = array(
               'customer_id' => $CustomerIdAddr['customer_id'],
               'remote_addr' => $CustomerIdAddr['remote_addr'],
               'created_product_id'  => $created_product_id,
               'collection_products'  => $collection_products,
               'created_time'  => Varien_Date::now(),
          );
          $model = Mage::getModel('giftcollection/giftcollection');
          $model->setData($data)->setOrigData()->save();
          return $model->getID();
     } 
     
     
     public function createBundleProduct($cPrdcts,$product_atts){
          
          try{
               $atts = $product_atts;
               /* $atts = array(
                         'p_sku' => 'testsku621bundle',
                         'p_name' => 'test bundle product96',
                         'p_attr_set_id'     => 10,
                         'p_description'     => 'This is a long description',
                         'p_short_description'     => 'This is a short description',
                         'p_categroies'     => array(55, 56),
               ); */
               extract($atts);
               
               $bundleSelections = array();
               $bundleSelections = array(
                    '0' => $cPrdcts     //get all selected products list and data
               );
               
               $bundleProduct = Mage::getModel('catalog/product');
               $bundleProduct
              ->setStoreId(Mage_Core_Model_App::ADMIN_STORE_ID) //you can set data in store scope
                  ->setWebsiteIds(array(1)) //website ID the product is assigned to, as an array
                  ->setAttributeSetId($p_attr_set_id) //ID of a attribute set named 'default'
                  ->setTypeId('bundle') //product type
                  ->setCreatedAt(strtotime('now')) //product creation time
          
                  ->setSkuType(0) //SKU type (0 - dynamic, 1 - fixed)
                  ->setSku($p_sku) //SKU
                  ->setName($p_name) //product name
                  ->setWeightType(0) //weight type (0 - dynamic, 1 - fixed)
          
                  ->setShipmentType(0) //shipment type (0 - together, 1 - separately)
                  ->setStatus(1) //product status (1 - enabled, 2 - disabled)
                  ->setVisibility(Mage_Catalog_Model_Product_Visibility::VISIBILITY_NOT_VISIBLE) //catalog and search visibility
                 
                 
                  ->setPriceType(0) //price type (0 - dynamic, 1 - fixed)
                  
                  ->setDescription($p_description)
                  ->setShortDescription($p_short_description)
                  ->setMediaGallery(array('images' => array(), 'values' => array())) //media gallery initialization
                  ->addImageToMediaGallery('media/creategift/giftbox.png', array('image','thumbnail','small_image'), false, false) //assigning image, thumb and small image to media gallery
 
                  ->setStockData(array(
                          'use_config_manage_stock' => 1, //'Use config settings' checkbox
                          // 'manage_stock' => 1, //manage stock
                          'is_in_stock' => 1, //Stock Availability
                      )
                  )
                  ->setCategoryIds($p_categroies); //assign product to categories
           
              $bundleOptions = array();
              $bundleOptions = array(
                  '0' => array(
                      'title' => 'All Items',
                      'option_id' => '',
                      'delete' => '',
                      'type' => 'multi',
                      'required' => '1',
                      'position' => '1'
                  )
              );
           
              
              //flags for saving custom options/selections
              $bundleProduct->setCanSaveCustomOptions(true);
              $bundleProduct->setCanSaveBundleSelections(true);
              $bundleProduct->setAffectBundleProductSelections(true);
           
              //registering a product because of Mage_Bundle_Model_Selection::_beforeSave
              Mage::register('product', $bundleProduct);
           
              //setting the bundle options and selection data
              $bundleProduct->setBundleOptionsData($bundleOptions);
              $bundleProduct->setBundleSelectionsData($bundleSelections);
           
           // echo '<pre>'.print_r($bundleProduct,true).'</pre>'; exit;
           
              $bundleProduct->save();
               
               return $bundleProduct->getid();
               
          } catch (Exception $e) {
              Mage::log($e->getMessage());
              echo $e->getMessage();
          }
          
     }
     
     
     
     public function addBundleToCart($product_id){
                
          #define cart
          $cart = Mage::getSingleton('checkout/cart');

          #look-up bundle selection ids
          $bundled_product = new Mage_Catalog_Model_Product();
          $bundled_product->load($product_id); 
          
          #get all bundle Selections and their options
          $selectionCollection = $bundled_product->getTypeInstance(true)->getSelectionsCollection(
               $bundled_product->getTypeInstance(true)->getOptionsIds($bundled_product), $bundled_product
          );
          
          #store all option in an array # $bundled_items
          $bundled_items = array();
          foreach ($selectionCollection as $option) {
              // $bundled_items[$option->product_id] = $option->selection_id;
               $bundled_items[$option->option_id][] = $option->selection_id;
          }
          
          // echo '<pre>'.print_r($bundled_items,true).'</pre>'; exit;
            
          /**
             * $bundle_items = @array(
                                   7 => array(                   //Select option name id (7)
                                             0 => 21,                 // option value for product selection
                                             0 => 22
                                   )
                         )
             */
          #define your dynamic options and add into cart
          $params = array(
                   'product' => $product_id,
                   'related_product' => null,
                   'bundle_option' => $bundled_items,
                   'qty' => 1,
          );
          
          $cart->addProduct($bundled_product, $params);
          $cart->save();
           
          Mage::getSingleton('checkout/session')->setCartWasUpdated(true);
           
          $message = $this->__('Success message: %s was successfully added to your shopping cart.', $bundled_product->getName());
          Mage::getSingleton('checkout/session')->addSuccess($message);
          
          // echo 'Product Added';
     }
     
     
}

?>