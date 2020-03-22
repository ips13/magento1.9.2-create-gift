<?php
 
class Clouds_Creategift_EditController extends Mage_Core_Controller_Front_Action
{
     protected $_Collection=null;
     protected $_Helper = null;
     
     public function indexAction(){
          
          if(is_null($this->_Collection)){
               $model = Mage::getModel('giftcollection/giftcollection');
               $this->_Collection = Mage::getModel('giftcollection/giftcollection')->getCollection();
          }
          
          if(is_null($this->_Helper)){
               $this->_Helper = Mage::helper('giftcollection');
          } 
          
          // echo '<pre>'.print_r($this->_Collection,true).'</pre>';
          $collection_id = 1;
          $newcollection_products = $this->_Helper->getCollectionProductsPost();
          
          // $this->saveCollection($collection_id,$newcollection_products);
          
          
          $this->updateBundleProduct('107',$newcollection_products);
          
          //table mgs_user_collections_products
          echo 'Hello developer...';
          /* $this->loadLayout();
          $listBlock = $this->getLayout()->getBlock('content'); 
          $this->renderLayout();  */
          
     }
     
     
     public function saveCollection($id = false,$new_collection){
          
          $CustomerIdAddr = $this->_Helper->getCurrentcustomerID_addr();
          $model = Mage::getModel('giftcollection/giftcollection');
          if($model->load($id)->getID() && $id){
               
               $collectionData = $model->getData();
               $updated_collection = $this->_Helper->updateCollection_products($new_collection,$collectionData['collection_products']);
               
               $data = array(
                    'customer_id' => $CustomerIdAddr['customer_id'],
                    'remote_addr' => $CustomerIdAddr['remote_addr'],
                    'collection_products'  => $updated_collection,
                    'update_time'  => Varien_Date::now()   
               );
               $data['collection_id'] = $id;
               
               $model->setData($data)->setOrigData()->save();
               
               #update bundle Product
               $pro_id = $collectionData['created_product_id'];
               $cPrdcts = unserialize($updated_collection);
               echo $pro_id;
               // echo '<pre>'.print_r($cPrdcts,true).'</pre>';
               $this->updateBundleProduct($pro_id,$new_collection);
               
          }
          
     }
     
     
     public function updateBundleProduct($pro_id,$cPrdcts){
          $data = array(
                         'sku'     => 'testsku621bundle',
                         'bundled_sku'     => 'SPJ08',
                         'bundled_title'     => 'bundled title',
          );
          // Check if bundled product already exists
    $bundled_product_id = Mage::getModel("catalog/product")->getIdBySku($data['sku']);

    // Load new bundled item
    $new_bundled_item_id = (int)Mage::getModel("catalog/product")->getIdBySku($data['bundled_sku']);
    if (!$new_bundled_item_id)
        throw new Exception('Product with sku '. $data['bundled_sku'] .' does not exists');

    // Bundled product already exists
    if ($bundled_product_id)
    {
        // Load existing bundled product
        $productCheck = Mage::getModel('catalog/product')->load($bundled_product_id);
        /* $productCheck->setName($data['name']);
        $productCheck->setDescription($data['description']);
        $productCheck->setShortDescription($data['short_description']);
        $productCheck->setMetaDescription($data['meta_description']);
        $productCheck->setPrice($data['price']); */
    }
    else
    {
        // Create new bundled product
        $productCheck = Mage::getModel('catalog/product');
        /* $productCheck->setData(array(
            'sku_type' => 0,
            'sku' => $data['sku'],
            'name' => $data['name'],
            'description' => $data['description'],
            'short_description' => $data['short_description'],
            'meta_description' => $data['meta_description'],
            'type_id' => 'bundle',
            'tax_class_id' => 2,
            'attribute_set_id' => 4,
            'weight_type' => 0,
            'visibility' => 4,
            'price_type' => 1,
            'price' => $data['price'],
            'price_view' => 0,
            'status' => 1,
            'created_at' => strtotime('now'),
            'store_id' => $data['store_id'],
            'website_ids' => Mage::getModel('core/store')->load($data['store_id'])->getWebsiteId()
        )); */
    }

    // Load option & selection data
    $productCheck->getTypeInstance(true)->setStoreFilter($productCheck->getStoreId(), $productCheck);
    $optionCollection = $productCheck->getTypeInstance(true)->getOptionsCollection($productCheck);
    $selectionCollection = $productCheck->getTypeInstance(true)->getSelectionsCollection(
        $productCheck->getTypeInstance(true)->getOptionsIds($productCheck), $productCheck
    );
    $optionCollection->appendSelections($selectionCollection);

    // Init raw option & selection data
    $bundleOptions = array();
    $bundleSelections = array();

    // Set raw option & selection data
    if (!$optionCollection->count()) {
        $bundleOptions = array(
            0 => array(
                'title' => $data['bundled_title'],
                'default_title' => $data['bundled_title'],
                'option_id' => '',
                'delete' => '',
                'type' => 'checkbox',
                'required' => '1',
                'position' => '1'
            )
        );
        $bundleSelections[0][0] = array(
            'product_id' => $new_bundled_item_id,
            'delete' => '',
            'selection_price_value' => 0.00,
            'selection_price_type' => 0,
            'selection_qty' => 1,
            'selection_can_change_qty' => 0,
            'position' => 0,
            'is_default' => 1
        );
    } else {
        $new_bundled_item_found = false;
        $i = 0;
        $option_index = null;
        foreach ($optionCollection as $option) {
            if ($option->getData('title') && $option->getData('title') == $data['bundled_title']) {
                $option_index = $i;
                $bundleOptions[$option_index] = array(
                    'option_id' => $option->getOptionId(),
                    'required' => $option->getData('required'),
                    'position' => $option->getData('position'),
                    'type' => $option->getData('type'),
                    'title' => $option->getData('title'),
                    'default_title' => $option->getData('default_title'),
                    'delete' => ''
                );
                foreach ($option->getSelections() as $selection) {
                    $new_bundled_item_found = (!$new_bundled_item_found && $new_bundled_item_id == (int)$selection->getProductId());
                    $bundleSelections[$option_index][] = array(
                        'product_id' => $selection->getProductId(),
                        'position' => $selection->getPosition(),
                        'is_default' => $selection->getIsDefault(),
                        'selection_price_type' => $selection->getSelectionPriceType(),
                        'selection_price_value' => $selection->getSelectionPriceValue(),
                        'selection_qty' => $selection->getSelectionQty(),
                        'selection_can_change_qty' => $selection->getSelectionCanChangeQty(),
                        'delete' => ''
                    );
                }
            }
            $i++;
        }
        if (!$new_bundled_item_found && $option_index >= 0) {
            $bundleSelections[$option_index][] = array(
                'product_id' => $new_bundled_item_id,
                'position' => 0,
                'is_default' => 1,
                'selection_price_type' => 0,
                'selection_price_value' => 0.00,
                'selection_qty' => 1,
                'selection_can_change_qty' => 0,
                'delete' => ''
            );
        }
    }

    // Set flags
    $productCheck->setCanSaveCustomOptions(true);
    $productCheck->setCanSaveBundleSelections(true);
    $productCheck->setAffectBundleProductSelections(true);

    // Register flag
    Mage::register('product', $productCheck);

    // Set option & selection data
    $productCheck->setBundleOptionsData($bundleOptions);
    $productCheck->setBundleSelectionsData($bundleSelections);

    // Save changes
    $productCheck->save();

    // Success
    return true;
    
    exit;
          $bundleProduct = Mage::getModel('catalog/product');
          $bundleProduct->load($pro_id);
          $bundleProduct->setName('test product bundle bundlea');
           
          $bundleSelections = array();
               $bundleSelections = array(
                    '0' => array( //option ID
                      '0' => array(
                          'product_id' => '70',
                          'delete' => '',
                          'selection_price_value' => '10',
                          'selection_price_type' => 0,
                          'selection_qty' => 1,
                          'selection_can_change_qty' => 0,
                          'position' => 0,
                          'is_default' => 1,
                          'selection_id' => 71,
                          'option_id' => 14
                      ), 
           
                      '1' => array(
                          'product_id' => '84', 
                          'delete' => '',
                          'selection_price_value' => '10',
                          'selection_price_type' => 0,
                          'selection_qty' => 1,
                          'selection_can_change_qty' => 0,
                          'position' => 0,
                          'is_default' => 1,
                          'selection_id' => 72,
                          'option_id' => 14     
                      )
                  )     //get all selected products list and data
               );
               
          $bundleOptions = array();
              $bundleOptions = array(
                  '0' => array(
                      'title' => 'All Items2',
                      'option_id' => 14,
                      'delete' => '',
                      'type' => 'multi',
                      'required' => '1',
                      'position' => '1'
                  )
              );
           
              $bundleProduct->setData('_edit_mode', true);
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
     }
     
     
     public function exampleprintnameAction(){
          // print_r($this->getRequest()->getParams()); exit;
          echo 'Your Name: '.$this->getRequest()->getParam('name');
          // URL:-- http://192.168.1.200/demo/inderpal/magento-supershop/index.php/clouds-hellodeveloper/index/printname/name/test
          
          //URL:-- Site URL/ frontname / Controller_name / Method_name / Args / values
     }
 
}

?>