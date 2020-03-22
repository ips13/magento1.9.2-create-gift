<?php
/**
 * @category    S3ibusiness
 * @package     S3ibusiness_Giftpromo
 * @copyright   Copyright (c) 2011 S3i Business sarl au. (http://www.s3ibusiness.com)
 * @author      Ahmed Mahi <1hmedmahi@gmail.com>
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class Clouds_Creategift_Model_Resource_Giftcollection extends Mage_Core_Model_Resource_Db_Abstract
{
    public function _construct()
    {    
        // Note that the collection_id refers to the key field in your database table.
        $this->_init('giftcollection/giftcollection', 'collection_id');
    }
}