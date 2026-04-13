// Real API Testing Script for User Authentication
const https = require('https');
const http = require('http');

const MEDUSA_URL = 'http://localhost:9000';
const PUBLISHABLE_KEY = 'pk_f8b6e5e814ea97ec6e132c556a380d0d28871bcd91a11e5e6008c58dddd3746b';

// Test User Data
const testUser = {
  email: `test${Date.now()}@marqasouq.com`,
  password: 'TestPass123!',
  first_name: 'John',
  last_name: 'Tester',
  phone: '+96511234567'
};

console.log('🧪 TESTING REAL USER AUTHENTICATION FLOW');
console.log('Test User:', testUser);
console.log('='.repeat(50));

// Helper function to make API calls
function apiCall(method, endpoint, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = `${MEDUSA_URL}${endpoint}`;
    console.log(`📡 ${method} ${url}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': PUBLISHABLE_KEY,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers,
    };
    
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${method} ${endpoint}: ${res.statusCode}`);
            resolve(response);
          } else {
            console.log(`❌ ${method} ${endpoint}: ${res.statusCode} - ${body}`);
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          console.log(`❌ ${method} ${endpoint}: Parse error - ${body}`);
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${method} ${endpoint}: Network error - ${error.message}`);
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test 1: Register User
async function testRegisterUser() {
  console.log('\n🔐 TEST 1: USER REGISTRATION');
  try {
    const result = await apiCall('POST', '/store/customers', {
      email: testUser.email,
      password: testUser.password,
      first_name: testUser.first_name,
      last_name: testUser.last_name,
      phone: testUser.phone
    });
    
    console.log('✅ User registration successful!');
    console.log('Customer ID:', result.customer?.id);
    return result;
  } catch (error) {
    console.log('❌ User registration failed:', error.message);
    throw error;
  }
}

// Test 2: Login User
async function testLoginUser() {
  console.log('\n🔑 TEST 2: USER LOGIN');
  try {
    const result = await apiCall('POST', '/store/auth/customer/emailpass', {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ User login successful!');
    console.log('Token received:', result.token ? 'Yes' : 'No');
    return result.token;
  } catch (error) {
    console.log('❌ User login failed:', error.message);
    throw error;
  }
}

// Test 3: Get Customer Profile
async function testGetCustomer(token) {
  console.log('\n👤 TEST 3: GET CUSTOMER PROFILE');
  try {
    const result = await apiCall('GET', '/store/customers/me', null, token);
    
    console.log('✅ Customer profile retrieved!');
    console.log('Customer:', result.customer?.email);
    return result;
  } catch (error) {
    console.log('❌ Get customer failed:', error.message);
    throw error;
  }
}

// Test 4: Test Products API (for browsing)
async function testProductsAPI() {
  console.log('\n🛍️ TEST 4: PRODUCTS API');
  try {
    const result = await apiCall('GET', '/store/products?limit=5');
    
    console.log('✅ Products API working!');
    console.log('Products found:', result.products?.length || 0);
    return result;
  } catch (error) {
    console.log('❌ Products API failed:', error.message);
    throw error;
  }
}

// Test 5: Test Categories API
async function testCategoriesAPI() {
  console.log('\n🏷️ TEST 5: CATEGORIES API');
  try {
    const result = await apiCall('GET', '/store/product-categories?limit=5');
    
    console.log('✅ Categories API working!');
    console.log('Categories found:', result.product_categories?.length || 0);
    return result;
  } catch (error) {
    console.log('❌ Categories API failed:', error.message);
    throw error;
  }
}

// Run All Tests
async function runTests() {
  const results = {
    registration: false,
    login: false,
    profile: false,
    products: false,
    categories: false
  };
  
  try {
    // Test Registration
    await testRegisterUser();
    results.registration = true;
    
    // Test Login
    const token = await testLoginUser();
    results.login = !!token;
    
    // Test Customer Profile
    if (token) {
      await testGetCustomer(token);
      results.profile = true;
    }
    
    // Test Products API
    await testProductsAPI();
    results.products = true;
    
    // Test Categories API
    await testCategoriesAPI();
    results.categories = true;
    
  } catch (error) {
    console.log('\n❌ Test sequence failed:', error.message);
  }
  
  // Results Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n📈 OVERALL: ${passedCount}/${totalCount} tests passed (${Math.round(passedCount/totalCount*100)}%)`);
  
  if (passedCount === totalCount) {
    console.log('🎉 ALL API TESTS PASSED! Backend is ready!');
  } else {
    console.log('⚠️ Some tests failed. Check backend configuration.');
  }
}

runTests().catch(console.error);