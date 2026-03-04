"""
Odoo Integration Middleware for MedusaJS E-Commerce Platform
This module handles synchronization between Odoo ERP and MedusaJS
"""

import requests
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class OdooConnector:
    """Main class for Odoo ERP integration"""
    
    def __init__(self):
        self.odoo_url = os.getenv('ODOO_URL', 'http://localhost:8069')
        self.odoo_db = os.getenv('ODOO_DB', 'marqa_souq')
        self.odoo_username = os.getenv('ODOO_USERNAME', 'admin')
        self.odoo_password = os.getenv('ODOO_PASSWORD', 'admin')
        
        self.medusa_url = os.getenv('MEDUSA_URL', 'http://localhost:9000')
        self.medusa_api_key = os.getenv('MEDUSA_API_KEY', '')
        
        self.session = requests.Session()
        self.logger = self._setup_logging()
        
    def _setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('odoo_integration.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
    
    def authenticate_odoo(self) -> bool:
        """Authenticate with Odoo ERP system"""
        try:
            auth_url = f"{self.odoo_url}/web/session/authenticate"
            auth_data = {
                'jsonrpc': '2.0',
                'method': 'call',
                'params': {
                    'db': self.odoo_db,
                    'login': self.odoo_username,
                    'password': self.odoo_password
                }
            }
            
            response = self.session.post(auth_url, json=auth_data)
            result = response.json()
            
            if result.get('error'):
                self.logger.error(f"Odoo authentication failed: {result['error']}")
                return False
                
            self.logger.info("Successfully authenticated with Odoo")
            return True
            
        except Exception as e:
            self.logger.error(f"Odoo authentication error: {str(e)}")
            return False
    
    def sync_products_to_medusa(self) -> Dict:
        """Sync products from Odoo to MedusaJS"""
        try:
            # Get products from Odoo
            odoo_products = self._get_odoo_products()
            
            synced_count = 0
            errors = []
            
            for product in odoo_products:
                try:
                    medusa_product = self._convert_odoo_to_medusa_product(product)
                    success = self._create_or_update_medusa_product(medusa_product)
                    
                    if success:
                        synced_count += 1
                    else:
                        errors.append(f"Failed to sync product {product.get('name')}")
                        
                except Exception as e:
                    errors.append(f"Error processing product {product.get('name')}: {str(e)}")
            
            return {
                'status': 'completed',
                'synced_count': synced_count,
                'total_products': len(odoo_products),
                'errors': errors,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Product sync error: {str(e)}")
            return {
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def sync_inventory_to_medusa(self) -> Dict:
        """Sync inventory levels from Odoo to MedusaJS"""
        try:
            inventory_updates = self._get_odoo_inventory()
            updated_count = 0
            errors = []
            
            for update in inventory_updates:
                try:
                    success = self._update_medusa_inventory(update)
                    if success:
                        updated_count += 1
                    else:
                        errors.append(f"Failed to update inventory for SKU {update.get('sku')}")
                        
                except Exception as e:
                    errors.append(f"Error updating inventory for {update.get('sku')}: {str(e)}")
            
            return {
                'status': 'completed',
                'updated_count': updated_count,
                'total_updates': len(inventory_updates),
                'errors': errors,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Inventory sync error: {str(e)}")
            return {
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def sync_order_to_odoo(self, order_data: Dict) -> Dict:
        """Sync order from MedusaJS to Odoo"""
        try:
            odoo_order = self._convert_medusa_to_odoo_order(order_data)
            success = self._create_odoo_order(odoo_order)
            
            if success:
                return {
                    'status': 'success',
                    'order_id': order_data.get('id'),
                    'odoo_order_id': success,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'status': 'failed',
                    'error': 'Failed to create order in Odoo',
                    'order_id': order_data.get('id'),
                    'timestamp': datetime.now().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Order sync error: {str(e)}")
            return {
                'status': 'failed',
                'error': str(e),
                'order_id': order_data.get('id'),
                'timestamp': datetime.now().isoformat()
            }
    
    def _get_odoo_products(self) -> List[Dict]:
        """Fetch products from Odoo"""
        # This method will contain Odoo API calls to fetch products
        # Implementation depends on Odoo's REST API or XML-RPC
        pass
    
    def _get_odoo_inventory(self) -> List[Dict]:
        """Fetch inventory levels from Odoo"""
        # This method will contain Odoo API calls to fetch inventory
        pass
    
    def _convert_odoo_to_medusa_product(self, odoo_product: Dict) -> Dict:
        """Convert Odoo product format to MedusaJS format"""
        return {
            'title': odoo_product.get('name'),
            'subtitle': odoo_product.get('description_sale'),
            'description': odoo_product.get('description'),
            'handle': self._generate_handle(odoo_product.get('name')),
            'is_giftcard': False,
            'status': 'published' if odoo_product.get('active') else 'draft',
            'images': self._process_product_images(odoo_product.get('image_ids', [])),
            'options': self._process_product_options(odoo_product),
            'variants': self._process_product_variants(odoo_product),
            'weight': odoo_product.get('weight', 0),
            'tags': self._process_product_tags(odoo_product),
            'categories': self._process_product_categories(odoo_product)
        }
    
    def _convert_medusa_to_odoo_order(self, medusa_order: Dict) -> Dict:
        """Convert MedusaJS order format to Odoo format"""
        return {
            'name': medusa_order.get('display_id'),
            'partner_id': self._get_or_create_customer(medusa_order.get('customer')),
            'order_line': self._process_order_lines(medusa_order.get('items', [])),
            'amount_total': medusa_order.get('total', 0) / 100,  # Convert from cents
            'currency_id': self._get_currency_id(medusa_order.get('currency_code')),
            'date_order': medusa_order.get('created_at'),
            'state': self._convert_order_status(medusa_order.get('status'))
        }
    
    def _generate_handle(self, name: str) -> str:
        """Generate URL-friendly handle from product name"""
        import re
        handle = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
        handle = re.sub(r'\s+', '-', handle.strip())
        return handle
    
    def _create_or_update_medusa_product(self, product_data: Dict) -> bool:
        """Create or update product in MedusaJS"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.medusa_api_key}'
            }
            
            # Check if product exists
            existing_product = self._find_medusa_product_by_handle(product_data['handle'])
            
            if existing_product:
                # Update existing product
                url = f"{self.medusa_url}/admin/products/{existing_product['id']}"
                response = self.session.post(url, json=product_data, headers=headers)
            else:
                # Create new product
                url = f"{self.medusa_url}/admin/products"
                response = self.session.post(url, json=product_data, headers=headers)
            
            if response.status_code in [200, 201]:
                self.logger.info(f"Successfully synced product: {product_data['title']}")
                return True
            else:
                self.logger.error(f"Failed to sync product: {response.text}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error syncing product: {str(e)}")
            return False
    
    def start_sync_scheduler(self):
        """Start the synchronization scheduler"""
        import schedule
        import time
        
        # Schedule product sync every 6 hours
        schedule.every(6).hours.do(self.sync_products_to_medusa)
        
        # Schedule inventory sync every hour
        schedule.every(1).hours.do(self.sync_inventory_to_medusa)
        
        self.logger.info("Synchronization scheduler started")
        
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

if __name__ == "__main__":
    # Example usage
    connector = OdooConnector()
    
    if connector.authenticate_odoo():
        print("✅ Odoo authentication successful")
        
        # Example: Sync products
        result = connector.sync_products_to_medusa()
        print(f"Product sync result: {result}")
    else:
        print("❌ Odoo authentication failed")