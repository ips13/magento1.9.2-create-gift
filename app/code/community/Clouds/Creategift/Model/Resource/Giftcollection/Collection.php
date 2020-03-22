<?php
/**
 * @category    S3ibusiness
 * @package     S3ibusiness_Giftpromo
 * @copyright   Copyright (c) 2011 S3i Business sarl au. (http://www.s3ibusiness.com)
 * @author      Ahmed Mahi <1hmedmahi@gmail.com>
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Clouds_Creategift_Model_Resource_Giftcollection_Collection extends Mage_Core_Model_Resource_Db_Collection_Abstract
{
    public function _construct()
    {
        parent::_construct();
        $this->_init('giftcollection/giftcollection');
    }
     public function LoadCollectionbyId( $collectId )
    {
        $this->getSelect()->from(array(c,$this->getTable('user_collections_products')))
        ->where('collection_id=?', $collectId);
        return $this;
    }
}