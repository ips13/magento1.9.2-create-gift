/**
 *Flycart Extension
 *
 * PHP versions 4 and 5
 *
 * LICENSE: This source file is subject to version 3.0 of the PHP license
 * that is available through the world-wide-web at the following URI:
 * http://www.store.vt.com/license.txt.  If you did not receive a copy of
 * the PHP License and are unable to obtain it through the web, please
 * send a note to admin@vt.com so we can mail you a copy immediately.
 *
 * @category   Magento Extensions
 * @package    Vt_Flycart
 * @author     Vt <sales@vt.com>
 * @copyright  2007-2011 Vt
 * @license    http://www.store.vt.com/license.txt
 * @version    1.0.1
 * @link       http://www.store.vt.com
 */ 
var varCounter = 0;
var flag = 0; 
var closePopup = function(){
    if(varCounter < 1) {
        varCounter++;
		if($('fly-cart-content'))
			new Effect.Fade($('fly-cart-content'));
    } else {
        clearInterval(closePopup);
    }
};
/*Event.observe(window, 'load', function() {
		FlycartCreate();	
	}
);*/
setInterval( function(){
    FlycartCreate();
} ,1000)
function FlycartCreate(){
	if(typeof(defaultConfig) == 'object'){
		
		var check = $$('.category-products .btn-cart');		
		var check_cart = $$('.cart .btn-remove');	
		if (check != '') {		
			var elements = null;
			for(var i=0; i< check.length; i++){				
				elements = check[i].readAttribute('id');
				if (elements == null) {
					break;
				}
			}
						
			if (elements == null) {			
				ajaxcartConfig = new FlycartConfigClass(defaultConfig);
			};
		};
		var pageView = $$('.product-view #product-addtocart-button');
		
		if ((pageView != '' || check_cart !='') && flag == 0) {			
			ajaxcartConfig = new FlycartConfigClass(defaultConfig);
			flag = 1;
		}		
	} 
}

FlycartConfigClass = Class.create();
FlycartConfigClass.prototype = {
	initialize: function(config){		
		this.config = config;		
		if (this.config.enable != '1') return;
				
		this.add_to_cart_url = new Array();
		this.addition_product_ids = new Array();
		this.associated_products = {};
		
		this.qty_input = defaultQtyTemp;
		this.cart_qty = cartQtyTemp;
		this.product_qty = productQtyTemp;
		
		if($$('div.category-products').length > 0){
			if (typeof(flycart_associated_products) != 'undefined'){
				this.associated_products = flycart_associated_products;
			}
			
			var elements = $$('div.category-products')[0].getElementsByClassName('btn-cart');
			
			for(var i=0; i<elements.length; i++){
				
				var onclick_url = elements[i].attributes["onclick"].nodeValue;
				onclick_url = onclick_url.toString().match(/\'.*?\'/);
				onclick_url = onclick_url[0].replace(/\'/g, '');
				var regexS = "[\\?&]flycart_item=([^&#]*)";
				var regex = new RegExp( regexS );  
				var results = regex.exec( onclick_url );  
				
				if( results == null )
					var product_id = '';
				else
					var product_id = results[1]; 

				if (!product_id) continue;	
				if (this.config.qty_update_category_page == '1'){
					var qty_div = $(document.createElement('div'));
					qty_div.addClassName('flycart_qty_edit');
					
					var validate_qty = false;
					if (onclick_url.search('checkout/cart/add') != -1){
						validate_qty = true;
					}	
					
					qty_div.innerHTML = this.qty_input.replace(/#flycart_item/g, product_id).replace(/#validate_qty/g, validate_qty);
					new Insertion.After(elements[i], qty_div);
					
					
					if (typeof(this.associated_products[product_id])=='undefined'){
						this.addition_product_ids.push(product_id);
						$('flycart_prod_id_' + product_id).value = 1;
					}else{
						$('flycart_prod_id_' + product_id).value = this.associated_products[product_id].min_qty;
					}
				}
				
				
				elements[i].onclick = function() {		
                         //check if button is not disabled
                         if(!jQuery(this).hasClass('disabled')){
                              ajaxcartConfig.addtoCart(this);
                         }
				};
				
				elements[i].id = 'flycart_add_to_cart_' + this.add_to_cart_url.length;				
				this.add_to_cart_url[this.add_to_cart_url.length] = onclick_url;				 
				
			}				 			
		}
		
		this.prepareCartItem(undefined);
		this.prepareProductPage();
		
				
		this.overlay = $('flycart-overlay');				
		if(!this.overlay){				
			var element = $$('body')[0];			
			this.overlay = $(document.createElement('div'));
			this.overlay.id = 'flycart-overlay';
			document.body.appendChild(this.overlay);
				
			var offsets = element.cumulativeOffset();
			this.overlay.setStyle({
				'top'	    : offsets[1] + 'px',
				'left'	    : offsets[0] + 'px',
				'width'	    : element.offsetWidth + 'px',
				'height'	: '1500px',
				'position'  : 'absolute',
				'display'   : 'block',
				'zIndex'	: '2000'				
			});
			
			if (this.config.background_view == '1'){
				this.overlay.setStyle({
					'opacity'  : '0.6',
					'background' : '#000000'
				});	
			}
			
			this.loading = $(document.createElement('div'));		
			if(this.config.loadingAlign == 'bottom')			
				this.loading.innerHTML = this.config.loadingText+'<img src="'+this.config.loadingImage+'" alt="" class="align-'+this.config.loadingAlign+'"/>';			
			else				
				this.loading.innerHTML = '<img src="'+this.config.loadingImage+'" alt="" class="align-'+this.config.loadingAlign+'"/>'//+this.config.loadingText;				
					
			this.loading.id = "flycart-loading";
			this.loading.className = "flycart-loading";			
			document.body.appendChild(this.loading);
			
			this.overlay.onclick = function() {
				if ($('flycart_confirm_window').visible()){
					ajaxcartConfig.overlay.hide();
					$('flycart_confirm_window').hide();
				}
			};
			
		}
		if (this.overlay && this.overlay.visible()) this.overlay.hide();
		if (this.loading && this.loading.visible()) this.loading.hide();
		
		this.addAdditionProduct();
								
	},
	
	addAdditionProduct: function(){
		if(this.addition_product_ids.length){
			var params = {product_ids: this.addition_product_ids.join(',')};
			
			var request = new Ajax.Request(this.config.related_product_url,
		          {
		              method:'post',
		              parameters:params,		                
		              onSuccess: function(transport){
							eval('var response = '+transport.responseText);		
							if (response.associated_products){
								for (var product_id in response.associated_products){
									this.associated_products[product_id] = response.associated_products[product_id];
								}
							}
							this.addition_product_ids = new Array();
							
					  }.bind(this),				  
					  onFailure: function(){						  
					  }.bind(this)
		          }
		      );
		}	
	},
	
	prepareCartItem: function(update_item_id){
		
		if (this.config.qty_update_cart_page != '1') return;
		
		if ($('shopping-cart-table') && $('shopping-cart-table').select('input.qty').length > 0){
			var elements = $('shopping-cart-table').select('input.qty');
			
			for(var i=0; i<elements.length; i++){
				var item_id = elements[i].name;
				item_id = item_id.replace(/\D/g, '');
				
				if (update_item_id != undefined && item_id != update_item_id){
					continue;
				}	
				
				var td = elements[i].up('td');								
				elements[i].id = 'flycart_cart_item_' + item_id;
				
				var item_html = td.innerHTML;
				var td_html = this.cart_qty.replace(/#flycart_item_id/g, item_id).replace(/#flycart_input_cart_qty/g, item_html);
				
				td.innerHTML = td_html;
			}	
		}
	},
	
	addtoCartProduct: function(){
		var product_id = $$('input[name="product"]').first().value;
		
		if ($('qty')){
			var qty = $('qty').value;
			qty = parseInt(qty);
			if (!qty){
				$('qty').value = 1;
				qty = 1;
			}
			
			if (qty < this.associated_products[product_id].min_qty){
				alert('The minimum quantity allowed for purchase is ' + this.associated_products[product_id].min_qty + '.');
				return;
			}		
			if (qty > this.associated_products[product_id].max_qty){
				alert('The maximum quantity allowed for purchase is ' + this.associated_products[product_id].max_qty + '.');
				return;
			}
		}else if (this.associated_products[product_id].is_grouped == '1' && $('super-product-table')){
			var elements = $('super-product-table').getElementsByClassName('qty');
			if (elements.length > 0){
				var zeroQty = true;
				for(var i=0; i<elements.length; i++){
					if (parseInt(elements[i].value) > 0){
						zeroQty = false;
						break;
					}
				}
				if (zeroQty){
					alert('Please specify the quantity of product(s).');
					return;
				}
			}
		}
		if ($('customer-reviews') &&
			 (this.associated_products[product_id].is_grouped == '0') && (this.associated_products[product_id].is_simple == '2')){
			
			this.showConfigurableParams(this.associated_products[product_id].product_url, product_id);
		}else{
			
			if (this.config.effect == '2') { 
				this.slide_control = $('image');
				this.effectSlideToCart(this.slide_control);
				this.slide_control = '';
			} else if (this.config.effect == '1'){
				this.loadData();
			}
					
			$('product_addtocart_form').request({
				onSuccess: this.onSuccesAddtoCart.bind(this), 		                	
	            onFailure: this.onFailureAddtoCart.bind(this)
		    });
		}
	},
	
	prepareProductPage: function(){	
		
		if ($('product_addtocart_form') && typeof(productAddToCartForm) != 'undefined'){
			var flycart_add = document.createElement("input");
			flycart_add.type = "hidden";
			flycart_add.name = "flycart_add";
			flycart_add.value = "1";
			$('product_addtocart_form').appendChild(flycart_add);
			$('product_addtocart_form').onsubmit = function(){
			    return false;
			};
			productAddToCartForm.submit = function(){
				if (productAddToCartForm.validator.validate()){
					ajaxcartConfig.addtoCartProduct();					
				}
			}

            if (typeof(flycart_associated_products) != 'undefined'){
			    this.associated_products = flycart_associated_products;
    		}else{
    			var product_id = $$('input[name="product"]').first().value;
    			if (product_id){
    				this.addition_product_ids.push(product_id);
    			}
    		}
		}

		if (this.config.qty_update_product_page != '1') return;

		if ($('qty')){
			var product_id = $$('input[name="product"]').first().value; 
						
			var qty_div = $(document.createElement('div'));
			qty_div.addClassName('flycart_qty_edit');
			new Insertion.After($('qty'), qty_div);
			qty_div.appendChild($('qty'));
			
			var qty_html = qty_div.innerHTML;			
			qty_div.innerHTML = this.product_qty.replace(/#product_id/g, product_id).replace(/#flycart_qty_input/g, qty_html);
		}
		if ($('super-product-table')){
			var elements = $('super-product-table').select('input.qty');
			for(var i=0; i<elements.length; i++){
				
				var product_id = elements[i].name;
				product_id = product_id.replace(/\D/g, '');
				
				var td = elements[i].up('td');								
				elements[i].id = 'grouped_product_' + product_id;
				
				var item_html = td.innerHTML;				
				var td_html = this.product_qty.replace(/#product_id/g, product_id).replace(/#flycart_qty_input/g, item_html);				
				td.innerHTML = td_html;
				
				if (typeof(this.associated_products[product_id])=='undefined'){
					this.addition_product_ids.push(product_id);
				}
				
			}				
		}
	},
	
	addtoCart: function(control){
		var control_id = control.id;
		control_id = control_id.replace(/\D/g, '');
		var onclick_url = this.add_to_cart_url[control_id]; 						
		var regexS = "[\\?&]flycart_item=([^&#]*)";
		var regex = new RegExp( regexS );  
		var results = regex.exec( onclick_url );  
		if( results == null )
			var product_id = '';
		else
			var product_id = results[1]; 

		console.log(this.associated_products[product_id]);
		if (!product_id) return;			
		
		if ($('flycart_prod_id_' + product_id)){
			var qty = $('flycart_prod_id_' + product_id).value;
		}else{
			var qty = 1;
		}
		
		qty = parseInt(qty);
		if (!qty){
			$('flycart_prod_id_' + product_id).value = 1;
			qty = 1;
		}
		
		if (qty < this.associated_products[product_id].min_qty){
			alert('The minimum quantity allowed for purchase is ' + this.associated_products[product_id].min_qty + '.');
			return;
		}		
		if (qty > this.associated_products[product_id].max_qty){
			alert('The maximum quantity allowed for purchase is ' + this.associated_products[product_id].max_qty + '.');
			return;
		}
		
          //remove 
          // this.addProductinSidebar(product_id); return;
          
		this.slide_control = control;

		if (onclick_url.search('checkout/cart/add') != -1){
			if (this.associated_products[product_id].is_simple == '1'){				
				this.effectSlideToCart(control);
				this.slide_control = '';
			}
			if (this.associated_products[product_id].is_simple == '0'){
				this.loadData();
			}
			this.addSimpleProduct(onclick_url, product_id,0);
		}	
		else if (onclick_url.search('options=cart')){			
			this.showConfigurableParams(onclick_url, product_id);
		}	
		
	},	
	
	showConfigurableParams: function(url, product_id){
				 
		this.loadData();		
		
		if ($('flycart_prod_id_' + product_id)){
			var qty = $('flycart_prod_id_' + product_id).value;
		}else if($('qty')){
			var qty = $('qty').value;
		}
		else{
			var qty = 1;
		}	
		
		qty = parseInt(qty);
		if (!qty){
			if ($('flycart_prod_id_' + product_id)){
				$('flycart_prod_id_' + product_id).value = 1;
			}	
			qty = 1;
		}
		
		var params = {qty: qty,
					  flycart_show_configurable: 1};
		
		var request = new Ajax.Request(url,
	            {
	                method:'post',
	                parameters:params,		                
	                onSuccess: this.onSuccesConfigurable.bind(this), 		                	
	                onFailure: this.onFailureConfigurable.bind(this)
	            }
	        );    	
	},	
	
	onSuccesConfigurable: function(transport){			
		eval('var response = '+transport.responseText);		
		this.endLoadData();
		if(response.success){
			this.js_scripts = response.form.extractScripts();
			this.configurable_qty = response.qty;
			var popupWindow = new FlycartPopup('flycart_configurable_add_to_cart', 
					{className: "flycart",
					 additionClass: "flycart_confirm_btns-" + ajaxcartConfig.config.cart_button_color,
				     title: 'Add to Gift', 
				     width: ajaxcartConfig.config.window_width, 	
				     top: '50%',
				     destroyOnClose: true,
				     closeOnEsc: false,
				     showEffectOptions: {afterFinish: function(){
						for (var i=0; i<ajaxcartConfig.js_scripts.length; i++){																
							if (typeof(ajaxcartConfig.js_scripts[i]) != 'undefined'){        	        	
								globalEval(ajaxcartConfig.js_scripts[i]);                	
							}
						}
						$('qty').value = ajaxcartConfig.configurable_qty;
						if ($('overlay_modal_flycart')){
							$('overlay_modal_flycart').onclick = function() {					 				     
								var popupWindow = FlycartPopups.getWindow('flycart_configurable_add_to_cart');
								popupWindow.close();
							};
						}	
					}
				}
			}); 
			popupWindow.getContent().innerHTML = response.form.stripScripts();			
			popupWindow.showCenter(parseInt(this.config.background_view));									
		}	
		else{
			if (response.redirect){
				window.location.href = response.redirect; 
			}else if (response.message){
				alert(response.message);
			}else{
				alert('Error add to cart.');
			}	
		}			            			
	},
	
	onFailureConfigurable: function(transport){
		this.endLoadData();
		alert('Failure add to cart.');
	},
	
	addConfigurableProduct: function(form){
          
		if (this.config.effect == '1'){ 
			this.loadData();
		}
		var elements = form.getElements('input, select, textarea');		
		var params = {};		
		for(var i = 0;i < elements.length;i++){
			if((elements[i].type == 'checkbox' || elements[i].type == 'radio') && !elements[i].checked){
				continue;
			}				
			if (elements[i].disabled){
				continue;
			}				
			params[elements[i].name] = elements[i].value;
		}	
          
          var storeproductSessionURL = VT_QV.SETTING.BASE_URL + 'index.php/giftcollection/index/ajax';
          
		var request = new Ajax.Request(storeproductSessionURL,
	            {
	                method:'post',
	                parameters:params,		                
	                onSuccess: this.onSuccesAddtoCart.bind(this), 		                	
	                onFailure: this.onFailureAddtoCart.bind(this)
	            }
	        );   
	},	
	
	addSimpleProduct: function(url, product_id,sample_prdct){
           
		if (this.config.effect == '1'){ 
			this.loadData();
		}
		if ($('flycart_prod_id_' + product_id)){
			var qty = $('flycart_prod_id_' + product_id).value;
		}else{
			var qty = 1;
		}
		qty = parseInt(qty);
		if (!qty){
			$('flycart_prod_id_' + product_id).value = 1;
			qty = 1;
		}
          
		var params = {qty: qty,
					  flycart_add: 1, product: product_id,sample_prdct : sample_prdct};
                           
                           
          var storeproductSessionURL = VT_QV.SETTING.BASE_URL + 'index.php/giftcollection/index/ajax';
		
		var request = new Ajax.Request(storeproductSessionURL,
			            {
			                method:'post',
			                parameters:params,		                
			                onSuccess: this.onSuccesAddtoCart.bind(this), 		                	
			                onFailure: this.onFailureAddtoCart.bind(this)
			            }
			        );    	
	},	
	
	onSuccesAddtoCart: function(transport){
		eval('var response = '+transport.responseText);
		this.endLoadData();		
          
          // exit data here
          
		if(response.success){
               
               // alert('Gift Added'); 
			
			var popupWindow = FlycartPopups.getWindow('flycart_configurable_add_to_cart');		
			if (popupWindow){
				popupWindow.close();
			}	
               
               this.addProductinSidebar(response.product_id,response.fields,response.sample_prdct);
               
		}else{
			if (response.redirect){
				window.location.href = response.redirect; 
			}else if (response.message){
				alert(response.message);
			}else{
				alert('Error add to cart.');
			}	 
		}			            			
	},
     
     
     addProductinSidebar: function(product_id,fields,sample_prdct){
          
          var $ = jQuery;
          $product_div = $('.giftpro_'+product_id);
          $product_img = $product_div.find('.product-image').html();
          $product_title = $product_div.find('.product-name > a').text();
          $product_price = ($product_div.find('.regular-price .price').text().length > 0)? $product_div.find('.regular-price .price').text() : $product_div.find('.special-price .price').text();
          
          //show hide enable/disabled button
          $product_div.find('.btn-cart').addClass('disabled');
          var sample_prdct = (sample_prdct == 1)? 'sample-remove' : '';
          
          var remove_link = '<span href="javascript:void(0)" class="remove-prdct '+ sample_prdct +'" data-btn-enable=".giftpro_'+product_id+'">Remove</span>';
          $productHTMLframe = '<div class="img-holder">' + $product_img + '</div> <div class="pr-data"><span class="pr-title">'+ $product_title + '</span><span class="pr-price">' + $product_price + '</span>' + fields + remove_link + '</div>';          
          

          if(trim($('.giftproduct-holder.holder1').text()).length == 0) {
               $('.giftproduct-holder.holder1').append($productHTMLframe);
          }
          else if(trim($('.giftproduct-holder.holder2').text()).length == 0) {
               $('.giftproduct-holder.holder2').append($productHTMLframe);
          }
          else if(trim($('.giftproduct-holder.holder3').text()).length == 0){
               $('.giftproduct-holder.holder3').append($productHTMLframe);
          }
          else{
               $productHTMLframe = '<div class="giftproduct-holder">' + $productHTMLframe + '</div>';
               $('.gifts-multiproduct-holder').append($productHTMLframe);
          }
          
     },
     
	_updateCustomCart: function(response){
		if(this.config.custom_cart){
			if($(this.config.custom_cart)) {
				$(this.config.custom_cart).update(response.custom_cart);
				$(this.config.custom_cart).scrollTo();
			}
			if($$("." + this.config.custom_cart)){
				var customCart = $$("." + this.config.custom_cart);
				customCart[0].update(response.custom_cart);
				customCart[0].scrollTo();
			}
		}
	},
	updateSidebar: function(block_class, content_html){
		
		var blocks = $$('div.' + block_class);
		for(var ii=0; ii<blocks.length; ii++){
			var block = blocks[ii];
			var content = content_html;
			if (block && content){				
				var js_scripts = content.extractScripts();
							
				if (content && content.toElement){
			    	content = content.toElement();			    	
			    }else if (!Object.isElement(content)){			    	
				    content = Object.toHTML(content);
				    var tempElement = document.createElement('div');
				    content.evalScripts.bind(content).defer();
				    content = content.stripScripts();
				    tempElement.innerHTML = content;
					var el = [];
					var re = new RegExp('\\b' + block_class + '\\b');
					var els = tempElement.getElementsByTagName("*");
					for(var i=0,j=els.length; i<j; i++){
						   if(re.test(els[i].className))el.push(els[i]);
					} 
				    if (el.length > 0){
				        content = el[0];
				    }
				    else{
				       return;
				    }
			    }								
				block.parentNode.replaceChild(content, block);				
				for (var i=0; i< js_scripts.length; i++){																
			        if (typeof(js_scripts[i]) != 'undefined'){        	        	
			        	globalEval(js_scripts[i]);                	
			        }
			    }
				if(typeof truncateOptions == 'function') {
					truncateOptions();
				}
			}
		}
	},
	
	updateToplinks: function(response){

		this._updateTopCart('top-link-cart', response);
		this._updateCustomCart(response);
		this._updateTopWishlist('top-link-wishlist', response);
		
	}, 
	
	_updateTopCart: function(link_class, response){
		
		$$(".header-container .top-link-cart").each(function(s){
			s.innerHTML = response.top_cart;
		});	
		$$(".header-minicart").each(function(s){
			s.innerHTML = response.top_cart;
			    var skipContents = $j('.skip-content');
				var skipLinks = $j('.skip-link');

				skipLinks.on('click', function (e) {
					e.preventDefault();

					var self = $j(this);
					var target = self.attr('href');

					// Get target element
					var elem = $j(target);

					// Check if stub is open
					var isSkipContentOpen = elem.hasClass('skip-active') ? 1 : 0;

					// Hide all stubs
					skipLinks.removeClass('skip-active');
					skipContents.removeClass('skip-active');

					// Toggle stubs
					if (isSkipContentOpen) {
						self.removeClass('skip-active');
					} else {
						self.addClass('skip-active');
						elem.addClass('skip-active');
					}
				});

				$j('#header-cart').on('click', '.skip-link-close', function(e) {
					var parent = $j(this).parents('.skip-content');
					var link = parent.siblings('.skip-link');

					parent.removeClass('skip-active');
					link.removeClass('skip-active');

					e.preventDefault();
				});
		});	
		if(this.config.visible_top_cart && $('fly-cart-content')){
			$('fly-cart-content').hide();
			new Effect.Appear($('fly-cart-content'));
			$('fly-cart-content').scrollTo();
			varCounter = 0;
			setInterval(closePopup, 4000);
		}
	}, 
	
	onFailureAddtoCart: function(transport){
		this.endLoadData();
		alert('Failure add to cart.');
	},
	
	qtyUp: function(product_id, validate_qty){
		
		var qty = $('flycart_prod_id_' +  product_id).value*1 + 1; 
		
		if (qty > this.associated_products[product_id].max_qty){
			alert('The maximum quantity allowed for purchase is ' + this.associated_products[product_id].max_qty + '.');
			return;
		}
		
		if (!validate_qty){
			$('flycart_prod_id_' + product_id).value = $('flycart_prod_id_' + product_id).value*1 + 1;
			return;
		}
		this.loadData();
		var params = {product_id: product_id,
		 		      qty: qty};
		
		var request = new Ajax.Request(this.config.updateqty,
			            {
			                method:'post',
			                parameters:params,		                
			                onSuccess: this.onSuccesChangeQty.bind(this), 		                	
			                onFailure: this.onFailureChangeQty.bind(this)
			            }
			        );    				
	},
	
	qtyDown: function(product_id, validate_qty){
		
		var qty = $('flycart_prod_id_' + product_id).value*1 - 1;
		
		if (qty < this.associated_products[product_id].min_qty){
			alert('The minimum quantity allowed for purchase is ' + this.associated_products[product_id].min_qty + '.');
			return;
		}			
		if (!validate_qty){
			$('flycart_prod_id_' + product_id).value = qty;
			return;
		}	
		this.loadData();
		var params = {product_id: product_id,
	 		      	  qty: qty};
	
		var request = new Ajax.Request(this.config.updateqty,
			            {
			                method:'post',
			                parameters:params,		                
			                onSuccess: this.onSuccesChangeQty.bind(this), 		                	
			                onFailure: this.onFailureChangeQty.bind(this)
			            }
			        ); 
	},
	
	onSuccesChangeQty: function(transport){									
		eval('var response = '+transport.responseText);
		this.endLoadData();
		if(response.error){
			alert(response.message); 
		}	
		else{
			if ($('flycart_prod_id_' + response.product_id)){
				$('flycart_prod_id_' + response.product_id).value = response.qty;
			}
		}			            			
	},
	
	onFailureChangeQty: function(transport){
		this.endLoadData();
		alert('Failure change qty.');
	},
	
	setOverlaySize: function(){
		var element = $$('body')[0];					
		this.overlay.setStyle({			
			'height'	: '1500px'						
		});
	},
	
	loadData: function(){
		this.setOverlaySize();
		this.overlay.show();
		$('flycart-loading').show();		
	},
	
	endLoadData: function(){
		if (this.overlay)
			this.overlay.hide();		
			$('flycart-loading').hide();
	},
	
	effectSlideToCart: function(control){
		
		if (this.config.effect != '2') return;
		if (!this.slide_control) return;
		
		if (control.id == 'image')
			var img = control;
		else	
			var img = $(control).up('.item').down('img');
		
		var topcarts = $$(".header-container .top-link-cart");
		var cart = null;
		var carts = $$('div.block-cart');
		var carts191 = $$('div.header-minicart .skip-cart');
		if (carts.length){
		    for(var i=0; i<carts.length; i++){
		       offset = carts[i].cumulativeOffset();
		       if (offset[0] || offset[1]){
		    	   cart = carts[i];
		    	   break;
		       } 
		    }
		}
		if (carts191.length){
		    for(var i=0; i<carts191.length; i++){
		       offset = carts191[i].cumulativeOffset();
		       if (offset[0] || offset[1]){
		    	   cart = carts191[i];
		    	   break;
		       } 
		    }
		}
		if(!cart && topcarts.length) {
			for(var i=0; i<topcarts.length; i++){
		       offset = topcarts[i].cumulativeOffset();
		       if (offset[0] || offset[1]){
		    	   cart = topcarts[i];
		    	   break;
		       } 
		    }
		}
		if(this.config.custom_cart && !cart){
			if($(this.config.custom_cart)){
				var customCart = $(this.config.custom_cart);
			}
			if($$("." + this.config.custom_cart)){
				var customCart = $$("." + this.config.custom_cart);
			}
			if(customCart.length) {
				for(var i=0; i<customCart.length; i++){
				   offset = customCart[i].cumulativeOffset();
				   if (offset[0] || offset[1]){
					   cart = customCart[i];
					   break;
				   } 
				}
			} else {
				cart = customCart;
			}
		}
		if (img && cart){			
			var img_offsets = img.cumulativeOffset();
			var cart_offsets = cart.cumulativeOffset();
			var animate_img =  img.cloneNode(true);
			animate_img.id = 'animate_image';
			document.body.appendChild(animate_img);			 
			animate_img.setStyle({'position': 'absolute', 
								  'top': img_offsets[1] + 'px', 
								  'left': img_offsets[0] + 'px'});
			cart.id = 'top_cart_temp';	
			new Effect.ScrollTo('top_cart_temp',{ duration:'0.8'});
			new Effect.Parallel(			
			    [						    			
			     	new Effect.Fade('animate_image', {sync: true, to: 0.3}),
			     	new Effect.MoveBy('animate_image', cart_offsets[1]-img_offsets[1], cart_offsets[0]-img_offsets[0], {sync: true})			     	 
			    ],			
			    {duration: 2,
			     afterFinish: function(){
			    		$('animate_image').remove();	
						
			     	}			    	
			    }			
			);
		}						
	},
	
	qtyUpSidebar: function(item_id){
		
		this.loadData();
		var params = {item_id: item_id,
	 		      	  qty: $('flycart_sidebar_' + item_id).value*1 + 1,
	 		      	  sidebar: 1};
		
		var request = new Ajax.Request(this.config.updatecartqty,
			            {
			                method:'post',
			                parameters:params,		                
			                onSuccess: this.onSuccesUpdateQtySidebar.bind(this), 		                	
			                onFailure: this.onFailureUpdateQtySidebar.bind(this)
			            }
			        );    				
	},
	
	qtyDownSidebar: function(item_id){
		if ($('flycart_sidebar_' + item_id).value*1 == 1){
			alert('The minimum quantity allowed for purchase is 1.');
			return;
		}			
		this.loadData();
		var params = {item_id: item_id,
		      	  	  qty: $('flycart_sidebar_' + item_id).value*1 - 1,
		      	  	  sidebar: 1};
	
		var request = new Ajax.Request(this.config.updatecartqty,
			            {
			                method:'post',
			                parameters:params,		                
			                onSuccess: this.onSuccesUpdateQtySidebar.bind(this), 		                	
			                onFailure: this.onFailureUpdateQtySidebar.bind(this)
			            }
			        ); 
	},
	
	onSuccesUpdateQtySidebar: function(transport){									
		eval('var response = '+transport.responseText);
		this.endLoadData();
		if(response.error){
			alert(response.message); 
		}	
		else{
			if (response.product_id && this.associated_products[response.product_id] && response.max_qty){
				this.associated_products[response.product_id].max_qty = response.max_qty;
			}
			this.updateSidebar('block-cart', response.cart);
			this.updateToplinks(response);
		}			            			
	},
	
	onFailureUpdateQtySidebar: function(transport){
		this.endLoadData();
		alert('Failure change qty.');
	},
	
	deleteItem: function(url){
		
		this.loadData();
		var params = {};
		if ($('shopping-cart-table'))
			params.flycart_cart_delete = 1;
		else
			params.flycart_sidebar_delete = 1;
	
		var request = new Ajax.Request(url,
	            {
	                method:'post',
	                parameters:params,		                
	                onSuccess: this.onSuccesDeleteItem.bind(this), 		                	
	                onFailure: this.onFailureDeleteItem.bind(this)
	            }
	        );
	},
	
	onSuccesDeleteItem: function(transport){									
		eval('var response = '+transport.responseText);
		this.endLoadData();
		if(response.error){
			alert(response.message); 
		}	
		else{	
			if (response.redirect){
				setLocation(response.redirect);
				return;
			}
			if (response.item_id){
				if($('flycart_cart_item_' + response.item_id)) {
					$('flycart_cart_item_' + response.item_id).up('td').up('tr').remove();
				}
				if($$('[name="cart[' + response.item_id + '][qty]"]').first()) {
					$$('[name="cart[' + response.item_id + '][qty]"]').first().up('td').up('tr').remove();
				}
				this.updateCartBlocks(response);
			}
			this.updateSidebar('block-cart', response.cart);
			this.updateToplinks(response);
			if (response.product_id && this.associated_products[response.product_id] && response.max_qty){
				this.associated_products[response.product_id].max_qty = response.max_qty;
			}
		}			            			
	},
	
	onFailureDeleteItem: function(transport){
		this.endLoadData();
		alert('Cannot remove the item.');
	},
	
	qtyCartUp: function(item_id){
		
		this.loadData();
		var params = {item_id: item_id,
	 		      	  qty: $('flycart_cart_item_' + item_id).value*1 + 1,
	 		      	  cart: 1};
		
		var request = new Ajax.Request(this.config.updatecartqty,
			            {
			                method:'post',
			                parameters:params,		                
			                onSuccess: this.onSuccesUpdateQtyCart.bind(this), 		                	
			                onFailure: this.onFailureUpdateQtyCart.bind(this)
			            }
			        );    				
	},
	
	qtyCartDown: function(item_id){
		if ($('flycart_cart_item_' + item_id).value*1 == 1){
			alert('The minimum quantity allowed for purchase is 1.');
			return;
		}			
		this.loadData();
		var params = {item_id: item_id,
		      	  	  qty: $('flycart_cart_item_' + item_id).value*1 - 1,
		      	  	  cart: 1};
	
		var request = new Ajax.Request(this.config.updatecartqty,
			            {
			                method:'post',
			                parameters:params,		                
			                onSuccess: this.onSuccesUpdateQtyCart.bind(this), 		                	
			                onFailure: this.onFailureUpdateQtyCart.bind(this)
			            }
			        ); 
	},
	
	onSuccesUpdateQtyCart: function(transport){									
		eval('var response = '+transport.responseText);
		this.endLoadData();		
		if(response.error){
			if (response.update_attribute){				
				
				if ($('flycart_cart_item_' + response.item_id)){
					var elements = $('flycart_cart_item_' + response.item_id).up('td').up('tr').select('select');
				}else if ($('flycart_sidebar_' + response.item_id)){
					var elements = $('flycart_sidebar_' + response.item_id).up('div.product-details').select('select');
				}
				if (elements){
					for(var i=0; i<elements.length; i++){
						var attribute_id = elements[i].getAttribute('class');
						attribute_id = attribute_id.replace(/\D/g, ''); 
						if (response.success_param.hasOwnProperty(attribute_id)){
							continue;
						}else if(attribute_id == response.update_attribute){
							elements[i].options.length = 0;
							elements[i].options[elements[i].options.length] = new Option(response.choosetext, '', false, false);
							
							for (key in response.attribute_data){
								elements[i].options[elements[i].options.length] = new Option(response.attribute_data[key], key, false, false);
							}
	
						}else{
							elements[i].options.length = 0;
							elements[i].options[elements[i].options.length] = new Option(response.choosetext, '', false, false);
						}
					}	
				}
			}else{
				this.updateSidebar('block-cart', response.cart);
				this.replaceCartItems(response);
				alert(response.message); 
			}	
		}	
		else{
			this.updateSidebar('block-cart', response.cart);
			this.replaceCartItems(response); 	
			this.updateCartBlocks(response);
			this.updateToplinks(response);
		}			            			
	},
	
	onFailureUpdateQtyCart: function(transport){
		this.endLoadData();
		alert('Failure change qty.');
	},
	
	replaceCartItems: function(response){					
		if ($('shopping-cart-table') && response.items_html){
			
			var tbody = $('shopping-cart-table').down('tbody');
			var tempElement = document.createElement('div');		    
		    tempElement.innerHTML = '<table><tbody>' + response.items_html + '</tbody></table>';			    			    
		    el = tempElement.getElementsByTagName('tbody');		    
		    if (el.length > 0){
		        content = el[0];
		        tbody.parentNode.replaceChild(content, tbody);
		    }
			decorateTable('shopping-cart-table');
			this.prepareCartItem(undefined);						
		}
	},
	
	updateCartBlocks: function(response){		
		this._updateCartBlock($('shopping-cart-totals-table'), response.total);
		this._updateCartBlock($$('div.shipping')[0], response.shipping);
		if ($$('div.crosssell')[0] && response.crosssell){
			this._updateCartBlock($$('div.crosssell')[0], response.crosssell);			
			
			this.addAdditionProduct();
		}
	},
	
	_updateCartBlock: function(block, content){					
		if (block && content){	
			
			var js_scripts = content.extractScripts();
			content = content.stripScripts();
									
			if (content && content.toElement){
		    	content = content.toElement();			    	
		    }else if (!Object.isElement(content)){			    	
			    content = Object.toHTML(content);
			    var tempElement = document.createElement('div');			    
			    tempElement.innerHTML = content;
			    el =  tempElement.getElementsByTagName('table');			    
			    if (el.length > 0){
			        content = el[0];
			    }else{
			    	content = tempElement.firstChild;
			    }
		    }								
			block.parentNode.replaceChild(content, block);
			
			for (var i=0; i< js_scripts.length; i++){																
		        if (typeof(js_scripts[i]) != 'undefined'){        	        	
		        	globalEval(js_scripts[i]);                	
		        }
		    }	
			
		}
	}, 
	
	attributeCartUpdate: function(control, product_id){
		if ($(control).up('td')){
			var item_id = $(control).up('td').up('tr').down('input.qty').name;
			item_id = item_id.replace(/\D/g, '');
			var super_attribute = {};
					
			if ($(control).up('td').up('tr').select('select').length > 0){
				var attributes = $(control).up('td').up('tr').select('select');
				for(var i=0; i<attributes.length; i++){				
					var attribute_id = $(attributes[i]).className;
					attribute_id = attribute_id.replace(/\D/g, '');
					super_attribute[attribute_id] = $(attributes[i]).value;
				}	
			}
		}else if ($(control).up('div.product-details')){
			var item_id = $(control).up('div.product-details').down('input.qty').id;
			item_id = item_id.replace(/\D/g, '');
			var super_attribute = {};
					
			if ($(control).up('div.product-details').select('select').length > 0){
				var attributes = $(control).up('div.product-details').select('select');
				for(var i=0; i<attributes.length; i++){				
					var attribute_id = $(attributes[i]).className;
					attribute_id = attribute_id.replace(/\D/g, '');
					super_attribute[attribute_id] = $(attributes[i]).value;
				}	
			}
		}else{
			return;
		}
		
		this.loadData();
								
		var params = {'id': item_id,
					  'product': product_id,
					  'super_attribute': Object.toJSON(super_attribute)};
		
		var request = new Ajax.Request(this.config.updateattqty,
			            {
			                method:'post',
			                parameters: params,		                
			                onSuccess: this.onSuccesUpdateQtyCart.bind(this), 		                	
			                onFailure: this.onFailureUpdateQtyCart.bind(this)
			            }
			        ); 
	},
	
	showConfirmWindow: function(response, type){
		this.setOverlaySize();
		if (this.config.show_window == '1'){
			this.confirmation_type = type;
			$$('span.confirm_addtocart').each(Element.hide);
			$('confirm_addtocart_' + type).show();
			if (parseInt(response.qty) >= 1){
				$('confirm_qty').innerHTML = response.qty;
			}
			else{
				$('confirm_qty').innerHTML = '';
			}
			$('flycart_productname').innerHTML = response.prod_name;
			$('flycart_singular').hide();
			$('flycart_plural').hide();
			if (parseInt(response.qty) > 1)
				$('flycart_plural').show();
			else
				$('flycart_singular').show();
			
			for (key in _flycart_data){
				if (key == this.confirmation_type){					
					$('flycart_confirm_checkout').up('button').setAttribute("onclick", _flycart_data[key].onclick);
					if (Prototype.Browser.IE){						
						$('flycart_confirm_checkout').up('button').onclick = function() {																				    
						    for (_key in _flycart_data){
								if (_key == ajaxcartConfig.confirmation_type){
									globalEval(_flycart_data[_key].onclick);
								}
							}
						};
					}
					$('flycart_confirm_checkout').innerHTML = _flycart_data[key].text;
				}
			}
			
			this.setOverlaySize();
			this.overlay.show();
			$('flycart_confirm_window').show();
			
			var auto_hide_window = this.config.auto_hide_window;
			this.auto_hide_window = parseInt(auto_hide_window);
			if (this.auto_hide_window > 0){
				this.setTimeout();
			}				
		}	
	},
	
	setTimeout: function(){
		var text = '';
		var onclick = '';
		for (key in _flycart_data){
			if (key == this.confirmation_type){
				text = _flycart_data[key].text;
				onclick = _flycart_data[key].onclick;
			}
		}
		if (this.auto_hide_window > 0 && $('flycart_confirm_window').visible()) {
			if (this.config.redirect_to == '1')
				$('flycart_confirm_checkout').innerHTML = text + ' (' + this.auto_hide_window + ')';
			else	
				$('flycart_confirm_continue').innerHTML = continueMessage + ' (' + this.auto_hide_window + ')';
			window.setTimeout(function() { 				  
				ajaxcartConfig.setTimeout();
			}, 1000);
			this.auto_hide_window = this.auto_hide_window - 1;
		}else{			
			if (this.config.redirect_to == '1' && $('flycart_confirm_window').visible()){				
				globalEval(onclick);
			}
			ajaxcartConfig.overlay.hide();
			$('flycart_confirm_window').hide();
		}
	},
	
	qtyProductUp: function(pid){
		if (productAddToCartForm.validator.validate()){
			
			var product_id = $$('input[name="product"]').first().value;
			if($('qty')){
				var qty = $('qty').value*1 + 1;
				if (qty > this.associated_products[product_id].max_qty){
					alert('The maximum quantity allowed for purchase is ' + this.associated_products[product_id].max_qty + '.');
					return;
				}
			}else if($('grouped_product_' + pid)){
				var qty = $('grouped_product_' + pid).value*1 + 1;
				if (qty > this.associated_products[pid].max_qty){
					alert('The maximum quantity allowed for purchase is ' + this.associated_products[pid].max_qty + '.');
					return;
				}
				product_id = pid;
			}
			
			this.loadData();
			var params = {product_id: product_id,
			 		      qty: qty};
			
			var request = new Ajax.Request(this.config.updateproductqty,
				            {
				                method:'post',
				                parameters:params,		                
				                onSuccess: this.onSuccesUpdateProductQty.bind(this), 		                	
				                onFailure: this.onFailureUpdateProductQty.bind(this)
				            }
				        );    				
		}	
	},
	
	qtyProductDown: function(prod_id){
		if (productAddToCartForm.validator.validate()){
			
			var product_id = $$('input[name="product"]').first().value;
			if($('qty')){
				var qty = $('qty').value*1 - 1;			
				if (qty < this.associated_products[product_id].min_qty){
					alert('The minimum quantity allowed for purchase is ' + this.associated_products[product_id].min_qty + '.');
					return;
				}
			}else if($('grouped_product_' + prod_id)){
				var qty = $('grouped_product_' + prod_id).value*1 - 1;			
				if (qty < this.associated_products[prod_id].min_qty){
					alert('The minimum quantity allowed for purchase is ' + this.associated_products[prod_id].min_qty + '.');
					return;
				}
				product_id = prod_id;
			}	
			
			this.loadData();
			var params = {product_id: product_id,
						  qty: qty};
		
			var request = new Ajax.Request(this.config.updateproductqty,
				            {
				                method:'post',
				                parameters:params,		                
				                onSuccess: this.onSuccesUpdateProductQty.bind(this), 		                	
				                onFailure: this.onFailureUpdateProductQty.bind(this)
				            }
				        ); 
		}	
	},
	
	onSuccesUpdateProductQty: function(transport){									
		eval('var response = '+transport.responseText);
		this.endLoadData();
		if(response.error){
			alert(response.message); 
		}	
		else{
			if($('qty')){
				$('qty').value = response.qty;
			}else if($('grouped_product_' + response.product_id)){
				$('grouped_product_' + response.product_id).value = response.qty;
			}	
		}			            			
	},
	
	onFailureUpdateProductQty: function(transport){
		this.endLoadData();
		alert('Failure change qty.');
	},
	
	showGroupedParams: function(response){			
				
		this.js_scripts = response.form.extractScripts();
		this.grouped_qty = response.qty;
		var popupWindow = new FlycartPopup('flycart_configurable_add_to_cart', 
				{className: "flycart",
				 additionClass: "flycart_confirm_btns-" + ajaxcartConfig.config.cart_button_color,
			     title: 'Add to Gift', 
			     width: ajaxcartConfig.config.window_width, 
			     top: '50%',
			     destroyOnClose: true,
			     closeOnEsc: false,
			     showEffectOptions: {afterFinish: function(){
					for (var i=0; i<ajaxcartConfig.js_scripts.length; i++){																
						if (typeof(ajaxcartConfig.js_scripts[i]) != 'undefined'){        	        	
							globalEval(ajaxcartConfig.js_scripts[i]);                	
						}
					}
					$('super-product-table').select('input[type=text]').each(function(control){
						$(control).value = ajaxcartConfig.grouped_qty;
					}); 
					if ($('overlay_modal_flycart')){
						$('overlay_modal_flycart').onclick = function() {					 				     
							var _win = FlycartPopups.getWindow('flycart_configurable_add_to_cart');
							if(_win) _win.close();
						};
					}
				}
			}
		}); 
		popupWindow.getContent().innerHTML = response.form.stripScripts();			
		popupWindow.showCenter(parseInt(this.config.background_view));											            			
	},
	
	addtoCartGrouped: function(form){
		 
		this.loadData();
		
		var elements = form.getElements('input, select, textarea');		
		var params = {};		
		for(var i = 0;i < elements.length;i++){
			if((elements[i].type == 'checkbox' || elements[i].type == 'radio') && !elements[i].checked){
				continue;
			}				
			if (elements[i].disabled){
				continue;
			}				
			params[elements[i].name] = elements[i].value;
		}	
		var request = new Ajax.Request(form.action,
	            {
	                method:'post',
	                parameters:params,		                
	                onSuccess: this.onSuccesAddtoCart.bind(this), 		                	
	                onFailure: this.onFailureAddtoCart.bind(this)
	            }
	        );   
	}	
		
};	

/* $ingh */
(function($){
 
     $(document).ready(function() {
          
          $('.gift-steps .step').not('.step-1').hide();
          $('.gift-continue-btn').not('.btn-1').hide();
          $('.add-gift-to-cart').not('.not-hide').hide();
          
          $('.header-gift-steps .h-step').on('click', function(e)  {
               var currentAttrValue = $(this).attr('data-step');
               var currentBtn = $(this).attr('data-btn');
      
               if(!$(this).hasClass('h-step-1')){
                    if($('.gifts-multiproduct-holder .giftproduct-holder').filter(function(){  return $.trim($(this).text()).length > 0 }).length >= 3){
                         // alert('3 selected');
                    }
                    else{
                         alert('Select atlest 3 products');
                         return false;
                    }
               }
                    
               // Show/Hide Tabs
               $('.gift-steps ' + currentAttrValue).show().siblings().hide();
               
               // Show/Hide Tabs
               $('.continue-holder ' + currentBtn).show().siblings().hide();
      
               // Change/remove current tab to active
               $(this).addClass('active').siblings().removeClass('active');
      
               e.preventDefault();
          });
         
         
         //Gift btn onclick below
          $('.gift-continue-btn').on('click', function(e)  {
              
               var next_view = $(this).attr('data-next');
               $('.header-gift-steps .h-step'+'.'+next_view).click();
               
               $('html,body').animate({  scrollTop: $('.header-gift-steps .h-step'+'.'+next_view).offset().top}, 1000);
               
               e.preventDefault();
              
          });
          
          //Add to cart button
          $('.add-gift-to-cart').on('click', function(e)  {
               if($(this).hasClass('disabled')){
                    e.preventDefault();
               }
               else{
                    $('.collection-name-hidden').val($('.collection_name').val());
                    $('#gift-collection').submit();
                    e.preventDefault();
               }
          });
          
          
          // Check if product name is set
          $('.collection_name').on('change keyup',function(){
               if($(this).val().length <= 0){
                    $('.add-gift-to-cart').addClass('disabled');
               }
               else{
                    $('.add-gift-to-cart').removeClass('disabled');
               }
               $('.collection-name-hidden').val($('.collection_name').val());
          });
          
          
          // On click remove empty
          $(document).on('click','.remove-prdct',function(){
               // alert('Product removed');
               if($(this).parent().parent().hasClass('giftproduct-holder')){
                    $(this).parent().parent().empty();
               }
               
               $btn_enable = $(this).attr('data-btn-enable');
               $($btn_enable).find('.btn-cart').removeClass('disabled');
               
               /* if($(this).hasClass('sample-remove')){
                    $('#gift-step-2 .btn-cart').removeClass('disabled');
               } */
               
          });
          
          $(document).on('click','#gift-step-2 .btn-cart',function(e){
               e.preventDefault();
               
               if($(this).hasClass('disabled')){
                    return false;
               }
               onclick_url = $(this).attr('data-onclick');
               onclick_url = onclick_url.toString().match(/\'.*?\'/);
               onclick_url = onclick_url[0].replace(/\'/g, '');
               var regexS = "[\\?&]flycart_item=([^&#]*)";
               var regex = new RegExp( regexS );  
               var results = regex.exec( onclick_url );  
               var product_id = results[1];
               // alert(product_id); alert(onclick_url); 
               ajaxcartConfig = new FlycartConfigClass(defaultConfig).addSimpleProduct(onclick_url, product_id,1);
            
               $(this).addClass('disabled');
               // $('#gift-step-2 .btn-cart').addClass('disabled');
               return false;
          });
          
          $(document).on('click','.product-image,.pro-title a',function(e){
               e.preventDefault();
               $(this).closest('.item-wrap').find('.btn-cart').click();
               return false;
          });
          
          $(document).on('click','select.super-attribute-select',function(){
               
               if($(this).attr('id') == 'attribute209'){ $('option[value=333]',this).remove(); }
               
          });
          
          
     });
     
}(jQuery));





/***
   *   Flycart Popup
  */
var globalEval = function globalEval(src){
    if (window.execScript) {
        window.execScript(src);
        return;
    }
    var fn = function() {
        window.eval.call(window,src);
    };
    fn();
};
var FlycartPopup = Class.create();
FlycartPopup.keepMultiModalWindow = false;
FlycartPopup.hasEffectLib = (typeof Effect != 'undefined');
FlycartPopup.resizeEffectDuration = 0.4;
FlycartPopup.prototype = {
  
  initialize: function() {
    var id;
    var optionIndex = 0;
    if (arguments.length > 0) {
      if (typeof arguments[0] == "string" ) {
        id = arguments[0];
        optionIndex = 1;
      }
      else
        id = arguments[0] ? arguments[0].id : null;
    }
    
    if (!id)
      id = "window_" + new Date().getTime();
      
    if ($(id))
      alert("Window " + id + " is already registered in the DOM! Make sure you use setDestroyOnClose() or destroyOnClose: true in the constructor");

    this.options = Object.extend({
      className:         "dialog",
      additionClass:     "",
      Buttoncolor:       "black",
      windowClassName:   null,
      blurClassName:     null,
      minWidth:          100, 
      minHeight:         20,
      resizable:         true,
      closable:          true,
      minimizable:       true,
      maximizable:       true,
      draggable:         true,
      userData:          null,
      showEffect:        (FlycartPopup.hasEffectLib ? Effect.Appear : Element.show),
      hideEffect:        (FlycartPopup.hasEffectLib ? Effect.Fade : Element.hide),
      showEffectOptions: {},
      hideEffectOptions: {},
      effectOptions:     null,
      parent:            document.body,
      title:             "&nbsp;",
      url:               null,
      onload:            Prototype.emptyFunction,
      width:             200,
      opacity:           1,
      recenterAuto:      true,
      wiredDrag:         false,
      closeOnEsc:        true,
      closeCallback:     null,
      destroyOnClose:    false,
      gridX:             1, 
      gridY:             1      
    }, arguments[optionIndex] || {});
    if (this.options.blurClassName)
      this.options.focusClassName = this.options.className;
      
    if (typeof this.options.top == "undefined" &&  typeof this.options.bottom ==  "undefined") 
      this.options.top = this._round(Math.random()*500, this.options.gridY);
    if (typeof this.options.left == "undefined" &&  typeof this.options.right ==  "undefined") 
      this.options.left = this._round(Math.random()*500, this.options.gridX);

    if (this.options.effectOptions) {
      Object.extend(this.options.hideEffectOptions, this.options.effectOptions);
      Object.extend(this.options.showEffectOptions, this.options.effectOptions);
      if (this.options.showEffect == Element.Appear)
        this.options.showEffectOptions.to = this.options.opacity;
    }
    if (FlycartPopup.hasEffectLib) {
      if (this.options.showEffect == Effect.Appear)
        this.options.showEffectOptions.to = this.options.opacity;
    
      if (this.options.hideEffect == Effect.Fade)
        this.options.hideEffectOptions.from = this.options.opacity;
    }
    if (this.options.hideEffect == Element.hide)
      this.options.hideEffect = function(){ Element.hide(this.element); if (this.options.destroyOnClose) this.destroy(); }.bind(this)
    
    if (this.options.parent != document.body)  
      this.options.parent = $(this.options.parent);
      
    this.element = this._createWindow(id);       
    this.element.win = this;
    
    // Bind event listener
    this.eventMouseDown = this._initDrag.bindAsEventListener(this);
    this.eventMouseUp   = this._endDrag.bindAsEventListener(this);
    this.eventMouseMove = this._updateDrag.bindAsEventListener(this);
    this.eventOnLoad    = this._getWindowBorderSize.bindAsEventListener(this);
    this.eventMouseDownContent = this.toFront.bindAsEventListener(this);
    this.eventResize = this._recenter.bindAsEventListener(this);
    this.eventKeyUp = this._keyUp.bindAsEventListener(this);
 
    this.topbar = $(this.element.id + "_top");
    this.bottombar = $(this.element.id + "_bottom");
    this.content = $(this.element.id + "_content");
    
    Event.observe(this.topbar, "mousedown", this.eventMouseDown);
    Event.observe(this.bottombar, "mousedown", this.eventMouseDown);
    Event.observe(this.content, "mousedown", this.eventMouseDownContent);
    Event.observe(window, "load", this.eventOnLoad);
    Event.observe(window, "resize", this.eventResize);
    Event.observe(window, "scroll", this.eventResize);
    Event.observe(document, "keyup", this.eventKeyUp);
    Event.observe(this.options.parent, "scroll", this.eventResize);
    
    if (this.options.draggable)  {
      var that = this;
      [this.topbar, this.topbar.up().previous(), this.topbar.up().next()].each(function(element) {
        element.observe("mousedown", that.eventMouseDown);
        element.addClassName("top_draggable");
      });
      [this.bottombar.up(), this.bottombar.up().previous(), this.bottombar.up().next()].each(function(element) {
        element.observe("mousedown", that.eventMouseDown);
        element.addClassName("bottom_draggable");
      });
      
    }    
    
    if (this.options.resizable) {
      this.sizer = $(this.element.id + "_sizer");
      Event.observe(this.sizer, "mousedown", this.eventMouseDown);
    }  
    
    this.useLeft = null;
    this.useTop = null;
    if (typeof this.options.left != "undefined") {
      this.element.setStyle({left: this.options.left});
      this.useLeft = true;
    }
    else {
      this.element.setStyle({right: this.options.right});
      this.useLeft = false;
    }
    
    if (typeof this.options.top != "undefined") {
      this.element.setStyle({top: this.options.top});
      this.useTop = true;
    }
    else {
      this.element.setStyle({bottom: this.options.bottom});      
      this.useTop = false;
    }
      
    this.storedLocation = null;
    
    this.setOpacity(this.options.opacity);
    if (this.options.zIndex)
      this.setZIndex(this.options.zIndex)

    if (this.options.destroyOnClose)
      this.setDestroyOnClose(true);

    this._getWindowBorderSize();
    this.width = this.options.width;
    this.height = this.options.height;
    this.visible = false;
    
    this.constraint = false;
    this.constraintPad = {top: 0, left:0, bottom:0, right:0};
    
    if (this.width && this.height)
      this.setSize(this.options.width, this.options.height);
    this.setTitle(this.options.title)
    FlycartPopups.register(this);      
  },
  
  // Destructor
  destroy: function() {
    this._notify("onDestroy");
    Event.stopObserving(this.topbar, "mousedown", this.eventMouseDown);
    Event.stopObserving(this.bottombar, "mousedown", this.eventMouseDown);
    Event.stopObserving(this.content, "mousedown", this.eventMouseDownContent);
    
    Event.stopObserving(window, "load", this.eventOnLoad);
    Event.stopObserving(window, "resize", this.eventResize);
    Event.stopObserving(window, "scroll", this.eventResize);
    
    Event.stopObserving(this.content, "load", this.options.onload);
    Event.stopObserving(document, "keyup", this.eventKeyUp);

    if (this._oldParent) {
      var content = this.getContent();
      var originalContent = null;
      for(var i = 0; i < content.childNodes.length; i++) {
        originalContent = content.childNodes[i];
        if (originalContent.nodeType == 1) 
          break;
        originalContent = null;
      }
      if (originalContent)
        this._oldParent.appendChild(originalContent);
      this._oldParent = null;
    }

    if (this.sizer)
        Event.stopObserving(this.sizer, "mousedown", this.eventMouseDown);

    if (this.options.url) 
      this.content.src = null

    if (!Prototype.Browser.IE){  
	    if(this.iefix){ 
	      Element.remove(this.iefix);
	    }  
	    Element.remove(this.element);
    }else{
    	if(this.iefix){ 
  	      this.iefix.id = 'iefix_' + new Date().getTime();
  	    }  
  	    this.element.id = 'flycart_win_' + new Date().getTime();
    }
        
    FlycartPopups.unregister(this);      

  },
    
  // Sets close callback, if it sets, it should return true to be able to close the window.
  setCloseCallback: function(callback) {
    this.options.closeCallback = callback;
  },
  
  // Gets window content
  getContent: function () {
    return this.content;
  },
  
  // Sets the content with an element id
  setContent: function(id, autoresize, autoposition) {
    var element = $(id);
    if (null == element) throw "Unable to find element '" + id + "' in DOM";
    this._oldParent = element.parentNode;

    var d = null;
    var p = null;

    if (autoresize) 
      d = Element.getDimensions(element);
    if (autoposition) 
      p = Position.cumulativeOffset(element);

    var content = this.getContent();
    // Clear HTML (and even iframe)
    this.setHTMLContent("");
    content = this.getContent();
    
    content.appendChild(element);
    element.show();
    if (autoresize) 
      this.setSize(d.width, d.height);
    if (autoposition) 
      this.setLocation(p[1] - this.heightN, p[0] - this.widthW);    
  },
  
  setHTMLContent: function(html) {
    // It was an url (iframe), recreate a div content instead of iframe content
    if (this.options.url) {
      this.content.src = null;
      this.options.url = null;
      
  	  var content ="<div id=\"" + this.getId() + "_content\" class=\"" + this.options.className + "_content\"> </div>";
      $(this.getId() +"_table_content").innerHTML = content;
      
      this.content = $(this.element.id + "_content");
    }
      
    this.getContent().innerHTML = html;
  },
  
  setAjaxContent: function(url, options, showCentered, showModal) {
    this.showFunction = showCentered ? "showCenter" : "show";
    this.showModal = showModal || false;
  
    options = options || {};

    // Clear HTML (and even iframe)
    this.setHTMLContent("");
 
    this.onComplete = options.onComplete;
    if (! this._onCompleteHandler)
      this._onCompleteHandler = this._setAjaxContent.bind(this);
    options.onComplete = this._onCompleteHandler;

    new Ajax.Request(url, options);    
    options.onComplete = this.onComplete;
  },
  
  _setAjaxContent: function(originalRequest) {
    Element.update(this.getContent(), originalRequest.responseText);
    if (this.onComplete)
      this.onComplete(originalRequest);
    this.onComplete = null;
    this[this.showFunction](this.showModal)
  },
  
  setURL: function(url) {
    // Not an url content, change div to iframe
    if (this.options.url) 
      this.content.src = null;
    this.options.url = url;
    var content= "<iframe frameborder='0' name='" + this.getId() + "_content'  id='" + this.getId() + "_content' src='" + url + "' width='" + this.width + "' height='" + this.height + "'> </iframe>";
    $(this.getId() +"_table_content").innerHTML = content;
    
    this.content = $(this.element.id + "_content");
  },

  getURL: function() {
  	return this.options.url ? this.options.url : null;
  },

  refresh: function() {
    if (this.options.url)
	    $(this.element.getAttribute('id') + '_content').src = this.options.url;
  },
  
  setCookie: function(name, expires, path, domain, secure) {
    name = name || this.element.id;
    this.cookie = [name, expires, path, domain, secure];
    var value = FlycartPopupUtilities.getCookie(name)
    if (value) {
      var values = value.split(',');
      var x = values[0].split(':');
      var y = values[1].split(':');

      var w = parseFloat(values[2]), h = parseFloat(values[3]);
      var mini = values[4];
      var maxi = values[5];

      this.setSize(w, h);
      if (mini == "true")
        this.doMinimize = true; // Minimize will be done at onload window event
      else if (maxi == "true")
        this.doMaximize = true; // Maximize will be done at onload window event

      this.useLeft = x[0] == "l";
      this.useTop = y[0] == "t";

      this.element.setStyle(this.useLeft ? {left: x[1]} : {right: x[1]});
      this.element.setStyle(this.useTop ? {top: y[1]} : {bottom: y[1]});
    }
  },
  
  getId: function() {
    return this.element.id;
  },
  
  setDestroyOnClose: function() {
    this.options.destroyOnClose = true;
  },
  
  setConstraint: function(bool, padding) {
    this.constraint = bool;
    this.constraintPad = Object.extend(this.constraintPad, padding || {});
    if (this.useTop && this.useLeft)
      this.setLocation(parseFloat(this.element.style.top), parseFloat(this.element.style.left));
  },
  

  _initDrag: function(event) {
    if (Event.element(event) == this.sizer && this.isMinimized())
      return;

    // No move on maximzed window
    if (Event.element(event) != this.sizer && this.isMaximized())
      return;
      
    if (Prototype.Browser.IE && this.heightN == 0)
      this._getWindowBorderSize();
    
    // Get pointer X,Y
    this.pointer = [this._round(Event.pointerX(event), this.options.gridX), this._round(Event.pointerY(event), this.options.gridY)];
    if (this.options.wiredDrag) 
      this.currentDrag = this._createWiredElement();
    else
      this.currentDrag = this.element;
      
    // Resize
    if (Event.element(event) == this.sizer) {
      this.doResize = true;
      this.widthOrg = this.width;
      this.heightOrg = this.height;
      this.bottomOrg = parseFloat(this.element.getStyle('bottom'));
      this.rightOrg = parseFloat(this.element.getStyle('right'));
      this._notify("onStartResize");
    }
    else {
      this.doResize = false;

      // Check if click on close button, 
      var closeButton = $(this.getId() + '_close');
      if (closeButton && Position.within(closeButton, this.pointer[0], this.pointer[1])) {
        this.currentDrag = null;
        return;
      }

      this.toFront();

      if (! this.options.draggable) 
        return;
      this._notify("onStartMove");
    }    
    // Register global event to capture mouseUp and mouseMove
    Event.observe(document, "mouseup", this.eventMouseUp, false);
    Event.observe(document, "mousemove", this.eventMouseMove, false);
    
    // Add an invisible div to keep catching mouse event over iframes
    FlycartPopupUtilities.disableScreen('__invisible__', '__invisible__', this.overlayOpacity);

    // Stop selection while dragging
    document.body.ondrag = function () { return false; };
    document.body.onselectstart = function () { return false; };
    
    this.currentDrag.show();
    Event.stop(event);
  },
  
  _round: function(val, round) {
    return round == 1 ? val  : val = Math.floor(val / round) * round;
  },

  // updateDrag event
  _updateDrag: function(event) {
    var pointer =  [this._round(Event.pointerX(event), this.options.gridX), this._round(Event.pointerY(event), this.options.gridY)];  
    var dx = pointer[0] - this.pointer[0];
    var dy = pointer[1] - this.pointer[1];
    
    // Resize case, update width/height
    if (this.doResize) {
      var w = this.widthOrg + dx;
      var h = this.heightOrg + dy;
      
      dx = this.width - this.widthOrg
      dy = this.height - this.heightOrg
      
      // Check if it's a right position, update it to keep upper-left corner at the same position
      if (this.useLeft) 
        w = this._updateWidthConstraint(w)
      else 
        this.currentDrag.setStyle({right: (this.rightOrg -dx) + 'px'});
      // Check if it's a bottom position, update it to keep upper-left corner at the same position
      if (this.useTop) 
        h = this._updateHeightConstraint(h)
      else
        this.currentDrag.setStyle({bottom: (this.bottomOrg -dy) + 'px'});
        
      this.setSize(w , h);
      this._notify("onResize");
    }
    // Move case, update top/left
    else {
      this.pointer = pointer;
      
      if (this.useLeft) {
        var left =  parseFloat(this.currentDrag.getStyle('left')) + dx;
        var newLeft = this._updateLeftConstraint(left);
        // Keep mouse pointer correct
        this.pointer[0] += newLeft-left;
        this.currentDrag.setStyle({left: newLeft + 'px'});
      }
      else 
        this.currentDrag.setStyle({right: parseFloat(this.currentDrag.getStyle('right')) - dx + 'px'});
      
      if (this.useTop) {
        var top =  parseFloat(this.currentDrag.getStyle('top')) + dy;
        var newTop = this._updateTopConstraint(top);
        // Keep mouse pointer correct
        this.pointer[1] += newTop - top;
        this.currentDrag.setStyle({top: newTop + 'px'});
      }
      else 
        this.currentDrag.setStyle({bottom: parseFloat(this.currentDrag.getStyle('bottom')) - dy + 'px'});

      this._notify("onMove");
    }
    if (this.iefix) 
      this._fixIEOverlapping(); 
      
    this._removeStoreLocation();
    Event.stop(event);
  },

   // endDrag callback
   _endDrag: function(event) {
    // Remove temporary div over iframes
     FlycartPopupUtilities.enableScreen('__invisible__');
    
    if (this.doResize)
      this._notify("onEndResize");
    else
      this._notify("onEndMove");
    
    // Release event observing
    Event.stopObserving(document, "mouseup", this.eventMouseUp,false);
    Event.stopObserving(document, "mousemove", this.eventMouseMove, false);

    Event.stop(event);
    
    this._hideWiredElement();

    // Store new location/size if need be
    this._saveCookie()
      
    // Restore selection
    document.body.ondrag = null;
    document.body.onselectstart = null;
  },

  _updateLeftConstraint: function(left) {
    if (this.constraint && this.useLeft && this.useTop) {
      var width = this.options.parent == document.body ? FlycartPopupUtilities.getPageSize().windowWidth : this.options.parent.getDimensions().width;

      if (left < this.constraintPad.left)
        left = this.constraintPad.left;
      if (left + this.width + this.widthE + this.widthW > width - this.constraintPad.right) 
        left = width - this.constraintPad.right - this.width - this.widthE - this.widthW;
    }
    return left;
  },
  
  _updateTopConstraint: function(top) {
    if (this.constraint && this.useLeft && this.useTop) {        
      var height = this.options.parent == document.body ? FlycartPopupUtilities.getPageSize().windowHeight : this.options.parent.getDimensions().height;
      
      var h = this.height + this.heightN + this.heightS;

      if (top < this.constraintPad.top)
        top = this.constraintPad.top;
      if (top + h > height - this.constraintPad.bottom) 
        top = height - this.constraintPad.bottom - h;
    }
    return top;
  },
  
  _updateWidthConstraint: function(w) {
    if (this.constraint && this.useLeft && this.useTop) {
      var width = this.options.parent == document.body ? FlycartPopupUtilities.getPageSize().windowWidth : this.options.parent.getDimensions().width;
      var left =  parseFloat(this.element.getStyle("left"));

      if (left + w + this.widthE + this.widthW > width - this.constraintPad.right) 
        w = width - this.constraintPad.right - left - this.widthE - this.widthW;
    }
    return w;
  },
  
  _updateHeightConstraint: function(h) {
    if (this.constraint && this.useLeft && this.useTop) {
      var height = this.options.parent == document.body ? FlycartPopupUtilities.getPageSize().windowHeight : this.options.parent.getDimensions().height;
      var top =  parseFloat(this.element.getStyle("top"));

      if (top + h + this.heightN + this.heightS > height - this.constraintPad.bottom) 
        h = height - this.constraintPad.bottom - top - this.heightN - this.heightS;
    }
    return h;
  },
  
  
  // Creates HTML window code
  _createWindow: function(id) {
    var className = this.options.className;
    var win = document.createElement("div");
    win.setAttribute('id', id);
    win.className = "flycart_dialog";
    if (this.options.windowClassName) {
      win.className += ' ' + this.options.windowClassName;
    }
    if (this.options.additionClass) {
        win.className += ' ' + this.options.additionClass;
    }    
    var content;
    if (this.options.url)
      content= "<iframe frameborder=\"0\" name=\"" + id + "_content\"  id=\"" + id + "_content\" src=\"" + this.options.url + "\"> </iframe>";
    else
      content ="<div id=\"" + id + "_content\" class=\"" +className + "_content\"> </div>";

    var closeDiv = this.options.closable ? "<div class='"+ className +"_close "+className +"_close_"+this.options.Buttoncolor+"' id='"+ id +"_close' onclick='FlycartPopups.close(\""+ id +"\", event)'> </div>" : "";
    var minDiv = this.options.minimizable ? "<div class='"+ className + "_minimize' id='"+ id +"_minimize' onclick='FlycartPopups.minimize(\""+ id +"\", event)'> </div>" : "";
    var maxDiv = this.options.maximizable ? "<div class='"+ className + "_maximize' id='"+ id +"_maximize' onclick='FlycartPopups.maximize(\""+ id +"\", event)'> </div>" : "";
    var seAttributes = this.options.resizable ? "class='" + className + "_sizer' id='" + id + "_sizer'" : "class='"  + className + "_se'";
    var blank = "../themes/default/blank.gif";
    
    win.innerHTML = closeDiv + minDiv + maxDiv + "\
      <a href='#' id='"+ id +"_focus_anchor'><!-- --></a>\
      <table id='"+ id +"_flycart_top' class=\"flycart_top flycart_table_window\">\
        <tr>\
          <td class='"+ className +"_nw'></td>\
          <td class='"+ className +"_n'><div id='"+ id +"_top' class='"+ className +"_title title_window'>"+ this.options.title +"</div></td>\
          <td class='"+ className +"_ne'></td>\
        </tr>\
      </table>\
      <table id='"+ id +"_flycart_mid' class=\"flycart_mid flycart_table_window\">\
        <tr>\
          <td class='"+ className +"_w'></td>\
            <td id='"+ id +"_table_content' class='"+ className +"_content' valign='top'>" + content + "</td>\
          <td class='"+ className +"_e'></td>\
        </tr>\
      </table>\
        <table id='"+ id +"_flycart_bot' class=\"flycart_bot flycart_table_window\">\
        <tr>\
          <td class='"+ className +"_sw'></td>\
            <td class='"+ className +"_s'><div id='"+ id +"_bottom' class='status_bar'><span style='float:left; width:1px; height:1px'></span></div></td>\
            <td " + seAttributes + "></td>\
        </tr>\
      </table>\
    ";
    Element.hide(win);
    this.options.parent.insertBefore(win, this.options.parent.firstChild);
    Event.observe($(id + "_content"), "load", this.options.onload);
    return win;
  },
  
  
  changeClassName: function(newClassName) {    
    var className = this.options.className;
    var id = this.getId();
    $A(["_close", "_minimize", "_maximize", "_sizer", "_content"]).each(function(value) { this._toggleClassName($(id + value), className + value, newClassName + value) }.bind(this));
    this._toggleClassName($(id + "_top"), className + "_title", newClassName + "_title");
    $$("#" + id + " td").each(function(td) {td.className = td.className.sub(className,newClassName); });
    this.options.className = newClassName;
  },
  
  _toggleClassName: function(element, oldClassName, newClassName) { 
    if (element) {
      element.removeClassName(oldClassName);
      element.addClassName(newClassName);
    }
  },
  
  // Sets window location
  setLocation: function(top, left) {
    top = this._updateTopConstraint(top);
    left = this._updateLeftConstraint(left);

    var e = this.currentDrag || this.element;
    e.setStyle({top: '50%'});
    e.setStyle({left: left + 'px'});

    this.useLeft = true;
    this.useTop = true;
    var height = parseInt(parseInt($(this.getId()).getHeight())/2);
    if (height > 240) height = 240;    
    e.setStyle({margin: -height + 'px 0 0'});    
  },
    
  getLocation: function() {
    var location = {};
    if (this.useTop)
      location = Object.extend(location, {top: this.element.getStyle("top")});
    else
      location = Object.extend(location, {bottom: this.element.getStyle("bottom")});
    if (this.useLeft)
      location = Object.extend(location, {left: this.element.getStyle("left")});
    else
      location = Object.extend(location, {right: this.element.getStyle("right")});
    
    return location;
  },
  
  // Gets window size
  getSize: function() {
    return {width: this.width, height: this.height};
  },
    
  // Sets window size
  setSize: function(width, height, useEffect) {    
    width = parseFloat(width);
    height = parseFloat(height);
    
    // Check min and max size
    if (!this.minimized && width < this.options.minWidth)
      width = this.options.minWidth;

    if (!this.minimized && height < this.options.minHeight)
      height = this.options.minHeight;
      
    if (this.options. maxHeight && height > this.options. maxHeight)
      height = this.options. maxHeight;

    if (this.options. maxWidth && width > this.options. maxWidth)
      width = this.options. maxWidth;

    
    if (this.useTop && this.useLeft && FlycartPopup.hasEffectLib && Effect.ResizeWindow && useEffect) {
      new Effect.ResizeWindow(this, null, null, width, height, {duration: FlycartPopup.resizeEffectDuration});
    } else {
      this.width = width;
      this.height = height;
      var e = this.currentDrag ? this.currentDrag : this.element;

      e.setStyle({width: width + this.widthW + this.widthE + "px"})
      e.setStyle({height: height  + this.heightN + this.heightS + "px"})

      // Update content size
      if (!this.currentDrag || this.currentDrag == this.element) {
        var content = $(this.element.id + '_content');
        content.setStyle({height: height  + 'px'});
        content.setStyle({width: width  + 'px'});
      }
    }
  },
  
  updateHeight: function() {
    this.setSize(this.width, this.content.scrollHeight, true);
  },
  
  updateWidth: function() {
    this.setSize(this.content.scrollWidth, this.height, true);
  },
  
  // Brings window to front
  toFront: function() {
    if (this.element.style.zIndex < FlycartPopups.maxZIndex)  
      this.setZIndex(FlycartPopups.maxZIndex + 1);
    if (this.iefix) 
      this._fixIEOverlapping(); 
  },
   
  getBounds: function(insideOnly) {
    if (! this.width || !this.height || !this.visible)  
      this.computeBounds();
    var w = this.width;
    var h = this.height;

    if (!insideOnly) {
      w += this.widthW + this.widthE;
      h += this.heightN + this.heightS;
    }
    var bounds = Object.extend(this.getLocation(), {width: w + "px", height: h + "px"});
    return bounds;
  },
      
  computeBounds: function() {
     if (! this.width || !this.height) {
      var size = FlycartPopupUtilities._computeSize(this.content.innerHTML, this.content.id, this.width, this.height, 0, this.options.className)
      if (this.height)
        this.width = size + 5
      else
        this.height = size + 5
    }

    this.setSize(this.width, this.height);
    if (this.centered)
      this._center(this.centerTop, this.centerLeft);    
  },
  
  show: function(modal) {
    this.visible = true;
    if (modal) {
      if (typeof this.overlayOpacity == "undefined") {
        var that = this;
        setTimeout(function() {that.show(modal)}, 10);
        return;
      }
      FlycartPopups.addModalWindow(this);
      
      this.modal = true;      
      this.setZIndex(FlycartPopups.maxZIndex + 1);
      FlycartPopups.unsetOverflow(this);
    }
    else    
      if (!this.element.style.zIndex) 
        this.setZIndex(FlycartPopups.maxZIndex + 1);        
    if (this.oldStyle)
      this.getContent().setStyle({overflow: this.oldStyle});
      
    this.computeBounds();
    
    this._notify("onBeforeShow");   
    if (this.options.showEffect != Element.show && this.options.showEffectOptions)
      this.options.showEffect(this.element, this.options.showEffectOptions);  
    else
      this.options.showEffect(this.element);  
      
    this._checkIEOverlapping();
    FlycartPopupUtilities.focusedWindow = this
    this._notify("onShow");
    if (!Prototype.Browser.IE)
    	$(this.element.id + '_focus_anchor').focus();
  },
  showCenter: function(modal, top, left) {
    this.centered = true;
    this.centerTop = top;
    this.centerLeft = left;

    this.show(modal);
  },
  
  isVisible: function() {
    return this.visible;
  },
  
  _center: function(top, left) {    
    var windowScroll = FlycartPopupUtilities.getWindowScroll(this.options.parent);    
    var pageSize = FlycartPopupUtilities.getPageSize(this.options.parent);    
    if (typeof top == "undefined")
      top = (pageSize.windowHeight - (this.height + this.heightN + this.heightS))/2;
    top += windowScroll.top
    
    if (typeof left == "undefined")
      left = (pageSize.windowWidth - (this.width + this.widthW + this.widthE))/2;
    left += windowScroll.left      
    this.setLocation(top, left);
    this.toFront();
  },
  
  _recenter: function(event) {     
    if (this.centered) {
      var pageSize = FlycartPopupUtilities.getPageSize(this.options.parent);
      var windowScroll = FlycartPopupUtilities.getWindowScroll(this.options.parent);    
      if (this.pageSize && this.pageSize.windowWidth == pageSize.windowWidth && this.pageSize.windowHeight == pageSize.windowHeight && 
          this.windowScroll.left == windowScroll.left && this.windowScroll.top == windowScroll.top) 
        return;
      this.pageSize = pageSize;
      this.windowScroll = windowScroll;
      if ($('overlay_modal_flycart')) 
        $('overlay_modal_flycart').setStyle({height: (pageSize.pageHeight + 'px')});
                  
      if (this.options.recenterAuto)
        this._center(this.centerTop, this.centerLeft);
      
    }
  },
  
  hide: function() {
    this.visible = false;
    if (this.modal) {
      FlycartPopups.removeModalWindow(this);
      FlycartPopups.resetOverflow();
    }
    this.oldStyle = this.getContent().getStyle('overflow') || "auto"
    this.getContent().setStyle({overflow: "hidden"});

    this.options.hideEffect(this.element, this.options.hideEffectOptions);  

     if(this.iefix) 
      this.iefix.hide();

    if (!this.doNotNotifyHide)
      this._notify("onHide");
  },

  close: function() {
    if (this.visible) {
      if (this.options.closeCallback && ! this.options.closeCallback(this)) 
        return;

      if (this.options.destroyOnClose) {
        var destroyFunc = this.destroy.bind(this);
        if (this.options.hideEffectOptions.afterFinish) {
          var func = this.options.hideEffectOptions.afterFinish;
          this.options.hideEffectOptions.afterFinish = function() {func();destroyFunc() }
        }
        else 
          this.options.hideEffectOptions.afterFinish = function() {destroyFunc() }
      }
      FlycartPopups.updateFocusedWindow();
      
      this.doNotNotifyHide = true;
      this.hide();
      this.doNotNotifyHide = false;
      if ($('product_addtocart_form') && (typeof(productAddToCartForm) != 'undefined') &&
    		  $('customer-reviews')){
    	  
    	    $('product_addtocart_form').onsubmit = function(){
			    return false;
			};
			productAddToCartForm.submit = function(){
				if (productAddToCartForm.validator.validate()){
					FlycartConfig.addtoCartProduct();					
				}
			}
      }
      this._notify("onClose");
    }
  },
  
  minimize: function() {
    if (this.resizing)
      return;
    
    var flycartPopupContent = $(this.getId() + "_flycart_mid");
    
    if (!this.minimized) {
      this.minimized = true;

      var dh = flycartPopupContent.getDimensions().height;
      this.flycartPopupContentHeight = dh;
      var h  = this.element.getHeight() - dh;

      if (this.useLeft && this.useTop && FlycartPopup.hasEffectLib && Effect.ResizeWindow) {
        new Effect.ResizeWindow(this, null, null, null, this.height -dh, {duration: FlycartPopup.resizeEffectDuration});
      } else  {
        this.height -= dh;
        this.element.setStyle({height: h + "px"});
        flycartPopupContent.hide();
      }

      if (! this.useTop) {
        var bottom = parseFloat(this.element.getStyle('bottom'));
        this.element.setStyle({bottom: (bottom + dh) + 'px'});
      }
    } 
    else {      
      this.minimized = false;
      
      var dh = this.flycartPopupContentHeight;
      this.flycartPopupContentHeight = null;
      if (this.useLeft && this.useTop && FlycartPopup.hasEffectLib && Effect.ResizeWindow) {
        new Effect.ResizeWindow(this, null, null, null, this.height + dh, {duration: FlycartPopup.resizeEffectDuration});
      }
      else {
        var h  = this.element.getHeight() + dh;
        this.height += dh;
        this.element.setStyle({height: h + "px"})
        flycartPopupContent.show();
      }
      if (! this.useTop) {
        var bottom = parseFloat(this.element.getStyle('bottom'));
        this.element.setStyle({bottom: (bottom - dh) + 'px'});
      }
      this.toFront();
    }
    this._notify("onMinimize");
    
    this._saveCookie()
  },
  
  maximize: function() {
    if (this.isMinimized() || this.resizing)
      return;
  
    if (Prototype.Browser.IE && this.heightN == 0)
      this._getWindowBorderSize();
      
    if (this.storedLocation != null) {
      this._restoreLocation();
      if(this.iefix) 
        this.iefix.hide();
    }
    else {
      this._storeLocation();
      FlycartPopups.unsetOverflow(this);
      
      var windowScroll = FlycartPopupUtilities.getWindowScroll(this.options.parent);
      var pageSize = FlycartPopupUtilities.getPageSize(this.options.parent);    
      var left = windowScroll.left;
      var top = windowScroll.top;
      
      if (this.options.parent != document.body) {
        windowScroll =  {top:0, left:0, bottom:0, right:0};
        var dim = this.options.parent.getDimensions();
        pageSize.windowWidth = dim.width;
        pageSize.windowHeight = dim.height;
        top = 0; 
        left = 0;
      }
      
      if (this.constraint) {
        pageSize.windowWidth -= Math.max(0, this.constraintPad.left) + Math.max(0, this.constraintPad.right);
        pageSize.windowHeight -= Math.max(0, this.constraintPad.top) + Math.max(0, this.constraintPad.bottom);
        left +=  Math.max(0, this.constraintPad.left);
        top +=  Math.max(0, this.constraintPad.top);
      }
      
      var width = pageSize.windowWidth - this.widthW - this.widthE;
      var height= pageSize.windowHeight - this.heightN - this.heightS;

      if (this.useLeft && this.useTop && FlycartPopup.hasEffectLib && Effect.ResizeWindow) {
        new Effect.ResizeWindow(this, top, left, width, height, {duration: FlycartPopup.resizeEffectDuration});
      }
      else {
        this.setSize(width, height);
        this.element.setStyle(this.useLeft ? {left: left} : {right: left});
        this.element.setStyle(this.useTop ? {top: top} : {bottom: top});
      }
        
      this.toFront();
      if (this.iefix) 
        this._fixIEOverlapping(); 
    }
    this._notify("onMaximize");
    this._saveCookie()
  },
  
  isMinimized: function() {
    return this.minimized;
  },
  
  isMaximized: function() {
    return (this.storedLocation != null);
  },
  
  setOpacity: function(opacity) {
    if (Element.setOpacity)
      Element.setOpacity(this.element, opacity);
  },
  
  setZIndex: function(zindex) {
    this.element.setStyle({zIndex: zindex});
    FlycartPopups.updateZindex(zindex, this);
  },

  setTitle: function(newTitle) {
    if (!newTitle || newTitle == "") 
      newTitle = "&nbsp;";
      
    Element.update(this.element.id + '_top', newTitle);
  },
   
  getTitle: function() {
    return $(this.element.id + '_top').innerHTML;
  },
  
  setStatusBar: function(element) {
    var statusBar = $(this.getId() + "_bottom");

    if (typeof(element) == "object") {
      if (this.bottombar.firstChild)
        this.bottombar.replaceChild(element, this.bottombar.firstChild);
      else
        this.bottombar.appendChild(element);
    }
    else
      this.bottombar.innerHTML = element;
  },

  _checkIEOverlapping: function() {
    if(!this.iefix && (navigator.appVersion.indexOf('MSIE')>0) && (navigator.userAgent.indexOf('Opera')<0) && (this.element.getStyle('position')=='absolute')) {
        new Insertion.After(this.element.id, '<iframe id="' + this.element.id + '_iefix" '+ 'style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" ' + 'src="javascript:false;" frameborder="0" scrolling="no"></iframe>');
        this.iefix = $(this.element.id+'_iefix');
    }
    if(this.iefix) 
      setTimeout(this._fixIEOverlapping.bind(this), 50);
  },

  _fixIEOverlapping: function() {
      Position.clone(this.element, this.iefix);
      this.iefix.style.zIndex = this.element.style.zIndex - 1;
      this.iefix.show();
  },
  
  _keyUp: function(event) {
      if (27 == event.keyCode && this.options.closeOnEsc) {
          this.close();
      }
  },

  _getWindowBorderSize: function(event) {
    var div = this._createHiddenDiv(this.options.className + "_n")
    this.heightN = Element.getDimensions(div).height;    
    div.parentNode.removeChild(div)

    var div = this._createHiddenDiv(this.options.className + "_s")
    this.heightS = Element.getDimensions(div).height;    
    div.parentNode.removeChild(div)

    var div = this._createHiddenDiv(this.options.className + "_e")
    this.widthE = Element.getDimensions(div).width;    
    div.parentNode.removeChild(div)

    var div = this._createHiddenDiv(this.options.className + "_w")
    this.widthW = Element.getDimensions(div).width;
    div.parentNode.removeChild(div);
    
    var div = document.createElement("div");
    div.className = "overlay_" + this.options.className ;
    document.body.appendChild(div);
    var that = this;
    
    setTimeout(function() {that.overlayOpacity = ($(div).getStyle("opacity")); div.parentNode.removeChild(div);}, 10);

    if (Prototype.Browser.IE) {
      this.heightS = $(this.getId() +"_flycart_bot").getDimensions().height;
      this.heightN = $(this.getId() +"_flycart_top").getDimensions().height;
    }

    if (Prototype.Browser.WebKit && Prototype.Browser.WebKitVersion < 420)
      this.setSize(this.width, this.height);
    if (this.doMaximize)
      this.maximize();
    if (this.doMinimize)
      this.minimize();
  },
 
  _createHiddenDiv: function(className) {
    var objBody = document.body;
    var win = document.createElement("div");
    win.setAttribute('id', this.element.id+ "_tmp");
    win.className = className;
    win.style.display = 'none';
    win.innerHTML = '';
    objBody.insertBefore(win, objBody.firstChild);
    return win;
  },
  
  _storeLocation: function() {
    if (this.storedLocation == null) {
      this.storedLocation = {useTop: this.useTop, useLeft: this.useLeft, 
                             top: this.element.getStyle('top'), bottom: this.element.getStyle('bottom'),
                             left: this.element.getStyle('left'), right: this.element.getStyle('right'),
                             width: this.width, height: this.height };
    }
  },
  
  _restoreLocation: function() {
    if (this.storedLocation != null) {
      this.useLeft = this.storedLocation.useLeft;
      this.useTop = this.storedLocation.useTop;
      
      if (this.useLeft && this.useTop && FlycartPopup.hasEffectLib && Effect.ResizeWindow)
        new Effect.ResizeWindow(this, this.storedLocation.top, this.storedLocation.left, this.storedLocation.width, this.storedLocation.height, {duration: FlycartPopup.resizeEffectDuration});
      else {
        this.element.setStyle(this.useLeft ? {left: this.storedLocation.left} : {right: this.storedLocation.right});
        this.element.setStyle(this.useTop ? {top: this.storedLocation.top} : {bottom: this.storedLocation.bottom});
        this.setSize(this.storedLocation.width, this.storedLocation.height);
      }
      
      FlycartPopups.resetOverflow();
      this._removeStoreLocation();
    }
  },
  
  _removeStoreLocation: function() {
    this.storedLocation = null;
  },
  
  _saveCookie: function() {
    if (this.cookie) {
      var value = "";
      if (this.useLeft)
        value += "l:" +  (this.storedLocation ? this.storedLocation.left : this.element.getStyle('left'))
      else
        value += "r:" + (this.storedLocation ? this.storedLocation.right : this.element.getStyle('right'))
      if (this.useTop)
        value += ",t:" + (this.storedLocation ? this.storedLocation.top : this.element.getStyle('top'))
      else
        value += ",b:" + (this.storedLocation ? this.storedLocation.bottom :this.element.getStyle('bottom'))
        
      value += "," + (this.storedLocation ? this.storedLocation.width : this.width);
      value += "," + (this.storedLocation ? this.storedLocation.height : this.height);
      value += "," + this.isMinimized();
      value += "," + this.isMaximized();
      FlycartPopupUtilities.setCookie(value, this.cookie)
    }
  },
  
  _createWiredElement: function() {
    if (! this.wiredElement) {
      if (Prototype.Browser.IE)
        this._getWindowBorderSize();
      var div = document.createElement("div");
      div.className = "wired_frame " + this.options.className + "_wired_frame";
      
      div.style.position = 'absolute';
      this.options.parent.insertBefore(div, this.options.parent.firstChild);
      this.wiredElement = $(div);
    }
    if (this.useLeft) 
      this.wiredElement.setStyle({left: this.element.getStyle('left')});
    else 
      this.wiredElement.setStyle({right: this.element.getStyle('right')});
      
    if (this.useTop) 
      this.wiredElement.setStyle({top: this.element.getStyle('top')});
    else 
      this.wiredElement.setStyle({bottom: this.element.getStyle('bottom')});

    var dim = this.element.getDimensions();
    this.wiredElement.setStyle({width: dim.width + "px", height: dim.height +"px"});

    this.wiredElement.setStyle({zIndex: FlycartPopups.maxZIndex+30});
    return this.wiredElement;
  },
  
  _hideWiredElement: function() {
    if (! this.wiredElement || ! this.currentDrag)
      return;
    if (this.currentDrag == this.element) 
      this.currentDrag = null;
    else {
      if (this.useLeft) 
        this.element.setStyle({left: this.currentDrag.getStyle('left')});
      else 
        this.element.setStyle({right: this.currentDrag.getStyle('right')});

      if (this.useTop) 
        this.element.setStyle({top: this.currentDrag.getStyle('top')});
      else 
        this.element.setStyle({bottom: this.currentDrag.getStyle('bottom')});

      this.currentDrag.hide();
      this.currentDrag = null;
      if (this.doResize)
        this.setSize(this.width, this.height);
    } 
  },
  
  _notify: function(eventName) {
    if (this.options[eventName])
      this.options[eventName](this);
    else
      FlycartPopups.notify(eventName, this);
  }
};

var FlycartPopups = {
  windows: [],
  modalWindows: [],
  observers: [],
  focusedWindow: null,
  maxZIndex: 0,
  overlayShowEffectOptions: {duration: 0.5},
  overlayHideEffectOptions: {duration: 0.5},

  addObserver: function(observer) {
    this.removeObserver(observer);
    this.observers.push(observer);
  },
  
  removeObserver: function(observer) {  
    this.observers = this.observers.reject( function(o) { return o==observer });
  },

  notify: function(eventName, win) {  
    this.observers.each( function(o) {if(o[eventName]) o[eventName](eventName, win);});
  },

  getWindow: function(id) {
    return this.windows.detect(function(d) { return d.getId() ==id });
  },

  getFocusedWindow: function() {
    return this.focusedWindow;
  },

  updateFocusedWindow: function() {
    this.focusedWindow = this.windows.length >=2 ? this.windows[this.windows.length-2] : null;    
  },
  
  register: function(win) {
    this.windows.push(win);
  },
    
  addModalWindow: function(win) {
    if (this.modalWindows.length == 0) {
      FlycartPopupUtilities.disableScreen(win.options.className, 'overlay_modal_flycart', win.overlayOpacity, win.getId(), win.options.parent);
    }
    else {
      if (FlycartPopup.keepMultiModalWindow) {
        $('overlay_modal_flycart').style.zIndex = FlycartPopups.maxZIndex + 1;
        FlycartPopups.maxZIndex += 1;
        FlycartPopupUtilities._hideSelect(this.modalWindows.last().getId());
      }
      else
        this.modalWindows.last().element.hide();
      FlycartPopupUtilities._showSelect(win.getId());
    }      
    this.modalWindows.push(win);    
  },
  
  removeModalWindow: function(win) {
    this.modalWindows.pop();
    
    if (this.modalWindows.length == 0)
      FlycartPopupUtilities.enableScreen();     
    else {
      if (Window.keepMultiModalWindow) {
        this.modalWindows.last().toFront();
        FlycartPopupUtilities._showSelect(this.modalWindows.last().getId());        
      }
      else
        this.modalWindows.last().element.show();
    }
  },
  
  register: function(win) {
    this.windows.push(win);
  },
  
  unregister: function(win) {
    this.windows = this.windows.reject(function(d) { return d==win });
  }, 
  closeAll: function() {  
    this.windows.each( function(w) {FlycartPopups.close(w.getId())} );
  },
  
  closeAllModalWindows: function() {
    FlycartPopupUtilities.enableScreen();     
    this.modalWindows.each( function(win) {if (win) win.close()});    
  },

  minimize: function(id, event) {
    var win = this.getWindow(id)
    if (win && win.visible)
      win.minimize();
    Event.stop(event);
  },
  
  maximize: function(id, event) {
    var win = this.getWindow(id)
    if (win && win.visible)
      win.maximize();
    Event.stop(event);
  },

  close: function(id, event) {
    var win = this.getWindow(id);
    if (win) 
      win.close();
    if (event)
      Event.stop(event);
  },
  
  blur: function(id) {
    var win = this.getWindow(id);  
    if (!win)
      return;
    if (win.options.blurClassName)
      win.changeClassName(win.options.blurClassName);
    if (this.focusedWindow == win)  
      this.focusedWindow = null;
    win._notify("onBlur");  
  },
  
  focus: function(id) {
    var win = this.getWindow(id);  
    if (!win)
      return;       
    if (this.focusedWindow)
      this.blur(this.focusedWindow.getId())

    if (win.options.focusClassName)
      win.changeClassName(win.options.focusClassName);  
    this.focusedWindow = win;
    win._notify("onFocus");
  },
  
  unsetOverflow: function(except) {    
    this.windows.each(function(d) { d.oldOverflow = d.getContent().getStyle("overflow") || "auto" ; d.getContent().setStyle({overflow: "hidden"}) });
    if (except && except.oldOverflow)
      except.getContent().setStyle({overflow: except.oldOverflow});
  },

  resetOverflow: function() {
    this.windows.each(function(d) { if (d.oldOverflow) d.getContent().setStyle({overflow: d.oldOverflow}) });
  },

  updateZindex: function(zindex, win) { 
    if (zindex > this.maxZIndex) {   
      this.maxZIndex = zindex;    
      if (this.focusedWindow) 
        this.blur(this.focusedWindow.getId())
    }
    this.focusedWindow = win;
    if (this.focusedWindow) 
      this.focus(this.focusedWindow.getId())
  }
};

var Dialog = {
  dialogId: null,
  onCompleteFunc: null,
  callFunc: null, 
  parameters: null, 
    
  confirm: function(content, parameters) {
    if (content && typeof content != "string") {
      Dialog._runAjaxRequest(content, parameters, Dialog.confirm);
      return 
    }
    content = content || "";
    
    parameters = parameters || {};
    var okLabel = parameters.okLabel ? parameters.okLabel : "Ok";
    var cancelLabel = parameters.cancelLabel ? parameters.cancelLabel : "Cancel";

    parameters = Object.extend(parameters, parameters.windowParameters || {});
    parameters.windowParameters = parameters.windowParameters || {};

    parameters.className = parameters.className || "alert";

    var okButtonClass = "class ='" + (parameters.buttonClass ? parameters.buttonClass + " " : "") + " ok_button'" 
    var cancelButtonClass = "class ='" + (parameters.buttonClass ? parameters.buttonClass + " " : "") + " cancel_button'" 
    var content = "\
      <div class='" + parameters.className + "_message'>" + content  + "</div>\
        <div class='" + parameters.className + "_buttons'>\
          <input type='button' value='" + okLabel + "' onclick='Dialog.okCallback()' " + okButtonClass + "/>\
          <input type='button' value='" + cancelLabel + "' onclick='Dialog.cancelCallback()' " + cancelButtonClass + "/>\
        </div>\
    ";
    return this._openDialog(content, parameters)
  },
  
  alert: function(content, parameters) {
    if (content && typeof content != "string") {
      Dialog._runAjaxRequest(content, parameters, Dialog.alert);
      return 
    }
    content = content || "";
    
    parameters = parameters || {};
    var okLabel = parameters.okLabel ? parameters.okLabel : "Ok";
    parameters = Object.extend(parameters, parameters.windowParameters || {});
    parameters.windowParameters = parameters.windowParameters || {};
    
    parameters.className = parameters.className || "alert";
    
    var okButtonClass = "class ='" + (parameters.buttonClass ? parameters.buttonClass + " " : "") + " ok_button'" 
    var content = "\
      <div class='" + parameters.className + "_message'>" + content  + "</div>\
        <div class='" + parameters.className + "_buttons'>\
          <input type='button' value='" + okLabel + "' onclick='Dialog.okCallback()' " + okButtonClass + "/>\
        </div>";                  
    return this._openDialog(content, parameters)
  },
  
  info: function(content, parameters) {
    if (content && typeof content != "string") {
      Dialog._runAjaxRequest(content, parameters, Dialog.info);
      return 
    }
    content = content || "";
    parameters = parameters || {};
    parameters = Object.extend(parameters, parameters.windowParameters || {});
    parameters.windowParameters = parameters.windowParameters || {};
    
    parameters.className = parameters.className || "alert";
    
    var content = "<div id='modal_dialog_message' class='" + parameters.className + "_message'>" + content  + "</div>";
    if (parameters.showProgress)
      content += "<div id='modal_dialog_progress' class='" + parameters.className + "_progress'>  </div>";

    parameters.ok = null;
    parameters.cancel = null;
    
    return this._openDialog(content, parameters)
  },
  
  setInfoMessage: function(message) {
    $('modal_dialog_message').update(message);
  },
  
  closeInfo: function() {
    FlycartPopups.close(this.dialogId);
  },
  
  _openDialog: function(content, parameters) {
    var className = parameters.className;
    
    if (! parameters.height && ! parameters.width) {
      parameters.width = FlycartPopupUtilities.getPageSize(parameters.options.parent || document.body).pageWidth / 2;
    }
    if (parameters.id)
      this.dialogId = parameters.id;
    else { 
      var t = new Date();
      this.dialogId = 'modal_dialog_' + t.getTime();
      parameters.id = this.dialogId;
    }

    if (! parameters.height || ! parameters.width) {
      var size = FlycartPopupUtilities._computeSize(content, this.dialogId, parameters.width, parameters.height, 5, className)
      if (parameters.height)
        parameters.width = size + 5
      else
        parameters.height = size + 5
    }
    parameters.effectOptions = parameters.effectOptions ;
    parameters.resizable   = parameters.resizable || false;
    parameters.minimizable = parameters.minimizable || false;
    parameters.maximizable = parameters.maximizable ||  false;
    parameters.draggable   = parameters.draggable || false;
    parameters.closable    = parameters.closable || false;

    var win = new FlycartPopup(parameters);
    win.getContent().innerHTML = content;
    
    win.showCenter(true, parameters.top, parameters.left);  
    win.setDestroyOnClose();
    
    win.cancelCallback = parameters.onCancel || parameters.cancel; 
    win.okCallback = parameters.onOk || parameters.ok;
    
    return win;    
  },
  
  _getAjaxContent: function(originalRequest)  {
      Dialog.callFunc(originalRequest.responseText, Dialog.parameters)
  },
  
  _runAjaxRequest: function(message, parameters, callFunc) {
    if (message.options == null)
      message.options = {}  
    Dialog.onCompleteFunc = message.options.onComplete;
    Dialog.parameters = parameters;
    Dialog.callFunc = callFunc;
    
    message.options.onComplete = Dialog._getAjaxContent;
    new Ajax.Request(message.url, message.options);
  },
  
  okCallback: function() {
    var win = FlycartPopups.focusedWindow;
    if (!win.okCallback || win.okCallback(win)) {
      // Remove onclick on button
      $$("#" + win.getId()+" input").each(function(element) {element.onclick=null;})
      win.close();
    }
  },

  cancelCallback: function() {
    var win = FlycartPopups.focusedWindow;
    $$("#" + win.getId()+" input").each(function(element) {element.onclick=null})
    win.close();
    if (win.cancelCallback)
      win.cancelCallback(win);
  }
}

if (Prototype.Browser.WebKit) {
  var array = navigator.userAgent.match(new RegExp(/AppleWebKit\/([\d\.\+]*)/));
  Prototype.Browser.WebKitVersion = parseFloat(array[1]);
}

var FlycartPopupUtilities = {  
  getWindowScroll: function(parent) {
    var T, L, W, H;
    parent = parent || document.body;              
    if (parent != document.body) {
      T = parent.scrollTop;
      L = parent.scrollLeft;
      W = parent.scrollWidth;
      H = parent.scrollHeight;
    } 
    else {
      var w = window;
      with (w.document) {
        if (w.document.documentElement && documentElement.scrollTop) {
          T = documentElement.scrollTop;
          L = documentElement.scrollLeft;
        } else if (w.document.body) {
          T = body.scrollTop;
          L = body.scrollLeft;
        }
        if (w.innerWidth) {
          W = w.innerWidth;
          H = w.innerHeight;
        } else if (w.document.documentElement && documentElement.clientWidth) {
          W = documentElement.clientWidth;
          H = documentElement.clientHeight;
        } else {
          W = body.offsetWidth;
          H = body.offsetHeight
        }
      }
    }
    return { top: T, left: L, width: W, height: H };
  }, 
  getPageSize: function(parent){
    parent = parent || document.body;              
    var windowWidth, windowHeight;
    var pageHeight, pageWidth;
    if (parent != document.body) {
      windowWidth = parent.getWidth();
      windowHeight = parent.getHeight();                                
      pageWidth = parent.scrollWidth;
      pageHeight = parent.scrollHeight;                                
    } 
    else {
      var xScroll, yScroll;

      if (window.innerHeight && window.scrollMaxY) {  
        xScroll = document.body.scrollWidth;
        yScroll = window.innerHeight + window.scrollMaxY;
      } else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
        xScroll = document.body.scrollWidth;
        yScroll = document.body.scrollHeight;
      } else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
        xScroll = document.body.offsetWidth;
        yScroll = document.body.offsetHeight;
      }


      if (self.innerHeight) {  // all except Explorer
        windowWidth = document.documentElement.clientWidth;//self.innerWidth;
        windowHeight = self.innerHeight;
      } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
        windowWidth = document.documentElement.clientWidth;
        windowHeight = document.documentElement.clientHeight;
      } else if (document.body) { // other Explorers
        windowWidth = document.body.clientWidth;
        windowHeight = document.body.clientHeight;
      }  

      if(yScroll < windowHeight){
        pageHeight = windowHeight;
      } else { 
        pageHeight = yScroll;
      }
      if(xScroll < windowWidth){  
        pageWidth = windowWidth;
      } else {
        pageWidth = xScroll;
      }
    }             
    return {pageWidth: pageWidth ,pageHeight: pageHeight , windowWidth: windowWidth, windowHeight: windowHeight};
  },

  disableScreen: function(className, overlayId, overlayOpacity, contentId, parent) {
    FlycartPopupUtilities.initLightbox(overlayId, className, function() {this._disableScreen(className, overlayId, overlayOpacity, contentId)}.bind(this), parent || document.body);
  },

  _disableScreen: function(className, overlayId, overlayOpacity, contentId) {
    var objOverlay = $(overlayId);

    var pageSize = FlycartPopupUtilities.getPageSize(objOverlay.parentNode);

    if (contentId && Prototype.Browser.IE) {
      FlycartPopupUtilities._hideSelect();
      FlycartPopupUtilities._showSelect(contentId);
    }  
  
    objOverlay.style.height = (pageSize.pageHeight + 'px');
    objOverlay.style.display = 'none'; 
    if (overlayId == "overlay_modal_flycart" && FlycartPopup.hasEffectLib && FlycartPopups.overlayShowEffectOptions) {
      objOverlay.overlayOpacity = overlayOpacity;
      new Effect.Appear(objOverlay, Object.extend({from: 0, to: overlayOpacity}, FlycartPopups.overlayShowEffectOptions));
    }
    else
      objOverlay.style.display = "block";
  },
  
  enableScreen: function(id) {
    id = id || 'overlay_modal_flycart';
    var objOverlay =  $(id);
    if (objOverlay) {
      if (id == "overlay_modal_flycart" && FlycartPopup.hasEffectLib && FlycartPopups.overlayHideEffectOptions)
        new Effect.Fade(objOverlay, Object.extend({from: objOverlay.overlayOpacity, to:0}, FlycartPopups.overlayHideEffectOptions));
      else {
        objOverlay.style.display = 'none';
        objOverlay.parentNode.removeChild(objOverlay);
      }
      
      if (id != "__invisible__") 
        FlycartPopupUtilities._showSelect();
    }
  },

  _hideSelect: function(id) {
    if (Prototype.Browser.IE) {
      id = id ==  null ? "" : "#" + id + " ";
      $$(id + 'select').each(function(element) {
        if (! FlycartPopupUtilities.isDefined(element.oldVisibility)) {
          element.oldVisibility = element.style.visibility ? element.style.visibility : "visible";
          element.style.visibility = "hidden";
        }
      });
    }
  },
     
  _computeSize: function(content, id, width, height, margin, className) {
    var objBody = document.body;
    var tmpObj = document.createElement("div");
    tmpObj.setAttribute('id', id);
    tmpObj.className = className + "_content";

    if (height)
      tmpObj.style.height = height + "px"
    else
      tmpObj.style.width = width + "px"
  
    tmpObj.style.position = 'absolute';
    tmpObj.style.top = '0';
    tmpObj.style.left = '0';
    tmpObj.style.display = 'none';

    tmpObj.innerHTML = content;
    objBody.insertBefore(tmpObj, objBody.firstChild);

    var size;
    if (height)
      size = $(tmpObj).getDimensions().width + margin;
    else
      size = $(tmpObj).getDimensions().height + margin;
    objBody.removeChild(tmpObj);
    return size;
  },  
  _showSelect: function(id) {
    if (Prototype.Browser.IE) {
      id = id ==  null ? "" : "#" + id + " ";
      $$(id + 'select').each(function(element) {
        if (FlycartPopupUtilities.isDefined(element.oldVisibility)) {
          try {
            element.style.visibility = element.oldVisibility;
          } catch(e) {
            element.style.visibility = "visible";
          }
          element.oldVisibility = null;
        }
        else {
          if (element.style.visibility)
            element.style.visibility = "visible";
        }
      });
    }
  },

  isDefined: function(object) {
    return typeof(object) != "undefined" && object != null;
  },

  initLightbox: function(id, className, doneHandler, parent) {

    if ($(id)) {
      Element.setStyle(id, {zIndex: FlycartPopups.maxZIndex + 1});
      FlycartPopups.maxZIndex++;
      doneHandler();
    }

    else {
      var objOverlay = document.createElement("div");
      objOverlay.setAttribute('id', id);
      objOverlay.className = "overlay_" + className
      objOverlay.style.display = 'none';
      objOverlay.style.position = 'absolute';
      objOverlay.style.top = '0';
      objOverlay.style.left = '0';
      objOverlay.style.zIndex = FlycartPopups.maxZIndex + 1;
      FlycartPopups.maxZIndex++;
      objOverlay.style.width = '100%';      
      parent.insertBefore(objOverlay, parent.firstChild);
      if (Prototype.Browser.WebKit && id == "overlay_modal_flycart") {
        setTimeout(function() {doneHandler()}, 10);
      }
      else
        doneHandler();
    }    
  },
  
  setCookie: function(value, parameters) {
    document.cookie= parameters[0] + "=" + escape(value) +
      ((parameters[1]) ? "; expires=" + parameters[1].toGMTString() : "") +
      ((parameters[2]) ? "; path=" + parameters[2] : "") +
      ((parameters[3]) ? "; domain=" + parameters[3] : "") +
      ((parameters[4]) ? "; secure" : "");
  },

  getCookie: function(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
      begin = dc.indexOf(prefix);
      if (begin != 0) return null;
    } else {
      begin += 2;
    }
    var end = document.cookie.indexOf(";", begin);
    if (end == -1) {
      end = dc.length;
    }
    return unescape(dc.substring(begin + prefix.length, end));
  },
 
}