export default async (container, options) => {
  const productService = container.resolve('productService');
  
  console.log('🔍 CHECKING PRODUCT IMAGES...\n');
  
  try {
    // Get all products with their images
    const allProducts = await productService.list({}, {
      relations: ['images']
    });
    
    const totalProducts = allProducts.length;
    const productsWithImages = allProducts.filter(p => p.images && p.images.length > 0);
    const productsWithoutImages = allProducts.filter(p => !p.images || p.images.length === 0);
    
    console.log('📊 IMAGE ANALYSIS RESULTS:');
    console.log('='.repeat(50));
    console.log('🔢 TOTAL PRODUCTS:', totalProducts);
    console.log('✅ PRODUCTS WITH IMAGES:', productsWithImages.length);
    console.log('❌ PRODUCTS WITHOUT IMAGES:', productsWithoutImages.length);
    console.log('📈 IMAGE COVERAGE:', Math.round((productsWithImages.length/totalProducts)*100) + '%');
    
    const totalImages = productsWithImages.reduce((acc, p) => acc + p.images.length, 0);
    console.log('🖼️  TOTAL IMAGES IN SYSTEM:', totalImages);
    console.log('📊 AVERAGE IMAGES PER PRODUCT:', Math.round((totalImages/productsWithImages.length) * 100) / 100);
    
    console.log('\n❌ SAMPLE PRODUCTS WITHOUT IMAGES:');
    console.log('-'.repeat(50));
    productsWithoutImages.slice(0, 15).forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} (ID: ${product.id})`);
    });
    
    // Check if images have proper URLs
    console.log('\n🔍 SAMPLE IMAGE URLs (First 3 products with images):');
    console.log('-'.repeat(50));
    productsWithImages.slice(0, 3).forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}:`);
      product.images.forEach((img, imgIndex) => {
        console.log(`   Image ${imgIndex + 1}: ${img.url || 'NO URL'}`);
      });
    });
    
    // Count products by image count
    console.log('\n📈 IMAGE DISTRIBUTION:');
    console.log('-'.repeat(50));
    const imageDistribution = {};
    allProducts.forEach(p => {
      const imgCount = p.images ? p.images.length : 0;
      imageDistribution[imgCount] = (imageDistribution[imgCount] || 0) + 1;
    });
    
    Object.keys(imageDistribution).sort((a, b) => Number(a) - Number(b)).forEach(count => {
      console.log(`Products with ${count} images: ${imageDistribution[count]}`);
    });
    
  } catch (error) {
    console.error('Error checking images:', error);
  }
};;