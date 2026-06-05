const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = require('../config/db');

const categorySeeds = [
  { name: 'Electronics', slug: 'electronics', description: 'Latest gadgets and electronic devices' },
  { name: 'Fashion', slug: 'fashion', description: 'Trendy clothing and accessories' },
  { name: 'Home & Living', slug: 'home-living', description: 'Beautiful home decor and furniture' },
  { name: 'Beauty', slug: 'beauty', description: 'Skincare, makeup and beauty products' },
  { name: 'Books', slug: 'books', description: 'Books across all genres' },
  { name: 'Sports', slug: 'sports', description: 'Sports equipment and activewear' },
  { name: 'Smartphones', slug: 'smartphones', description: 'Latest smartphones', parentSlug: 'electronics' },
  { name: 'Laptops', slug: 'laptops', description: 'Notebooks and laptops', parentSlug: 'electronics' },
  { name: 'Headphones', slug: 'headphones', description: 'Audio devices', parentSlug: 'electronics' },
  { name: 'Men Clothing', slug: 'men-clothing', description: 'Men fashion', parentSlug: 'fashion' },
  { name: 'Women Clothing', slug: 'women-clothing', description: 'Women fashion', parentSlug: 'fashion' },
  { name: 'Furniture', slug: 'furniture', description: 'Home furniture', parentSlug: 'home-living' }
];

const imageSets = {
  electronics: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&auto=format&fit=crop&q=80'
  ],
  fashion: [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop&q=80'
  ],
  home: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=900&auto=format&fit=crop&q=80'
  ],
  beauty: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570194065650-d99fb4b38c34?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=900&auto=format&fit=crop&q=80'
  ],
  books: [
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=900&auto=format&fit=crop&q=80'
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&auto=format&fit=crop&q=80'
  ]
};

const productGroups = [
  {
    categorySlug: 'smartphones',
    brand: 'V Mobile',
    imageSet: 'electronics',
    basePrice: 11999,
    priceStep: 2500,
    names: [
      'Astra X1 5G Smartphone',
      'Nova Edge 5G Smartphone',
      'Pixel Max AMOLED Phone',
      'Orbit Lite Dual SIM Phone',
      'Zenith Pro Camera Phone',
      'Pulse Mini Smartphone',
      'Titan Ultra 5G Phone',
      'Metro One Android Phone',
      'Glide Fold Smart Phone',
      'Aura Plus Battery Phone'
    ]
  },
  {
    categorySlug: 'laptops',
    brand: 'V Computing',
    imageSet: 'electronics',
    basePrice: 34999,
    priceStep: 6500,
    names: [
      'SwiftBook Air 14 Laptop',
      'Creator Pro 15 Laptop',
      'GameCore RTX Laptop',
      'OfficeMate Slim Laptop',
      'UltraBook Touch 13 Laptop',
      'Studio Max Workstation',
      'Student Go 11 Laptop',
      'Business Elite Notebook',
      'Vision OLED Laptop',
      'TravelMate Ryzen Laptop'
    ]
  },
  {
    categorySlug: 'headphones',
    brand: 'V Audio',
    imageSet: 'electronics',
    basePrice: 799,
    priceStep: 950,
    names: [
      'SonicPods Wireless Earbuds',
      'BassLine Over Ear Headphones',
      'ClearCall Bluetooth Headset',
      'Studio ANC Headphones',
      'SportBeat Neckband',
      'AirTune True Wireless Buds',
      'Podcast USB Microphone',
      'MiniBoom Portable Speaker',
      'CinemaBar Soundbar',
      'SleepSound Earbuds'
    ]
  },
  {
    categorySlug: 'electronics',
    brand: 'V Tech',
    imageSet: 'electronics',
    basePrice: 999,
    priceStep: 1250,
    names: [
      'SmartFit Fitness Watch',
      'ChargeHub 65W Adapter',
      'PowerMax 20000mAh Power Bank',
      'StreamStick 4K Media Player',
      'HomeCam WiFi Camera',
      'GlowDesk LED Lamp',
      'Type C Fast Cable Pack',
      'ProTab 10 Tablet',
      'ClickPro Wireless Mouse',
      'KeyLite Mechanical Keyboard'
    ]
  },
  {
    categorySlug: 'men-clothing',
    brand: 'V Wear',
    imageSet: 'fashion',
    basePrice: 699,
    priceStep: 420,
    names: [
      'Classic Oxford Shirt',
      'Slim Fit Chino Pants',
      'Urban Denim Jacket',
      'Everyday Cotton T Shirt',
      'Weekend Polo Shirt',
      'Tailored Formal Blazer',
      'Relaxed Cargo Joggers',
      'Merino Blend Sweater',
      'Athletic Track Pants',
      'Linen Summer Shirt'
    ]
  },
  {
    categorySlug: 'women-clothing',
    brand: 'V Style',
    imageSet: 'fashion',
    basePrice: 799,
    priceStep: 480,
    names: [
      'Floral Midi Dress',
      'High Rise Straight Jeans',
      'Soft Knit Cardigan',
      'Satin Office Blouse',
      'Everyday Cotton Kurti',
      'Pleated A Line Skirt',
      'Active Yoga Leggings',
      'Layered Winter Coat',
      'Casual Denim Shirt',
      'Festive Embroidered Top'
    ]
  },
  {
    categorySlug: 'fashion',
    brand: 'V Accessories',
    imageSet: 'fashion',
    basePrice: 499,
    priceStep: 350,
    names: [
      'Leather Travel Wallet',
      'Canvas City Backpack',
      'Minimal Analog Watch',
      'Polarized Aviator Sunglasses',
      'Braided Casual Belt',
      'Quilted Sling Bag',
      'Running Knit Sneakers',
      'Silk Touch Scarf',
      'Laptop Messenger Bag',
      'Premium Crew Socks Pack'
    ]
  },
  {
    categorySlug: 'furniture',
    brand: 'V Home',
    imageSet: 'home',
    basePrice: 2499,
    priceStep: 2200,
    names: [
      'Nordic Lounge Chair',
      'Compact Study Desk',
      'Oak Finish Coffee Table',
      'Modular Fabric Sofa',
      'Ergo Mesh Office Chair',
      'Queen Storage Bed Frame',
      'Four Shelf Bookcase',
      'Round Dining Table',
      'Minimal TV Console',
      'Bedside Drawer Unit'
    ]
  },
  {
    categorySlug: 'home-living',
    brand: 'V Living',
    imageSet: 'home',
    basePrice: 399,
    priceStep: 520,
    names: [
      'Aroma Ceramic Diffuser',
      'Cotton Bedsheet Set',
      'Velvet Cushion Covers',
      'Marble Print Dinner Set',
      'Bamboo Storage Basket',
      'Warm White Floor Lamp',
      'Non Stick Cookware Set',
      'Luxury Bath Towel Set',
      'Indoor Planter Pair',
      'Wall Art Frame Set'
    ]
  },
  {
    categorySlug: 'beauty',
    brand: 'V Glow',
    imageSet: 'beauty',
    basePrice: 249,
    priceStep: 320,
    names: [
      'Vitamin C Face Serum',
      'Hydrating Gel Moisturizer',
      'Matte Finish Lipstick Set',
      'Daily Sunscreen SPF 50',
      'Charcoal Deep Clean Mask',
      'Rose Water Face Mist',
      'Hair Repair Oil Blend',
      'Makeup Brush Kit',
      'Aloe Cleanser Foam',
      'Signature Eau De Parfum'
    ]
  },
  {
    categorySlug: 'books',
    brand: 'V Reads',
    imageSet: 'books',
    basePrice: 199,
    priceStep: 180,
    names: [
      'Modern JavaScript Handbook',
      'The Startup Playbook',
      'Mindful Living Guide',
      'Indian Home Cooking',
      'Personal Finance Basics',
      'Mystery at Hill House',
      'World History Illustrated',
      'Children Story Collection',
      'Data Science Essentials',
      'Productivity Daily Planner'
    ]
  },
  {
    categorySlug: 'sports',
    brand: 'V Active',
    imageSet: 'sports',
    basePrice: 349,
    priceStep: 550,
    names: [
      'Pro Grip Yoga Mat',
      'Adjustable Dumbbell Pair',
      'Training Resistance Bands',
      'Running Hydration Bottle',
      'Cricket Leather Ball Pack',
      'Football Match Size 5',
      'Badminton Racket Set',
      'Cycling Safety Helmet',
      'Gym Duffel Bag',
      'Quick Dry Sports Tee'
    ]
  }
];

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const money = (value) => Number(value.toFixed(2));

const buildProducts = () => {
  let globalIndex = 0;

  return productGroups.flatMap(group => group.names.map((name, groupIndex) => {
    globalIndex += 1;
    const price = money(group.basePrice + group.priceStep * groupIndex + (globalIndex % 4) * 99);
    const discountPercent = [12, 15, 18, 20, 22, 25][globalIndex % 6];
    const comparePrice = money(price * (1 + discountPercent / 100));
    const imageSet = imageSets[group.imageSet];
    const primaryImage = imageSet[groupIndex % imageSet.length];
    const secondaryImage = imageSet[(groupIndex + 2) % imageSet.length];
    const salesCount = (globalIndex * 13) % 240;
    const rating = money(3.8 + ((globalIndex % 12) * 0.09));
    const reviewCount = 12 + ((globalIndex * 17) % 340);
    const tags = [...new Set([
      group.categorySlug,
      group.categorySlug.replace(/-/g, ' '),
      group.brand,
      ...name.split(/\s+/).map(term => term.replace(/[^a-z0-9]/gi, '').toLowerCase()).filter(term => term.length > 2)
    ])].slice(0, 12);

    return {
      name,
      slug: slugify(name),
      description: `${name} from ${group.brand} is selected for V Shop customers with reliable quality, practical features and a polished everyday experience.`,
      shortDescription: `Premium ${name.toLowerCase()} with dependable quality and modern styling.`,
      price,
      comparePrice,
      costPrice: money(price * 0.62),
      sku: `VS-${group.categorySlug.toUpperCase().replace(/-/g, '')}-${String(groupIndex + 1).padStart(3, '0')}`,
      categorySlug: group.categorySlug,
      brand: group.brand,
      stockQuantity: 18 + ((globalIndex * 7) % 85),
      lowStockThreshold: 5 + (groupIndex % 6),
      images: [primaryImage, secondaryImage],
      specifications: [
        { name: 'Brand', value: group.brand },
        { name: 'Collection', value: group.categorySlug.replace(/-/g, ' ') },
        { name: 'Warranty', value: group.imageSet === 'books' ? '7 day replacement' : '1 year service support' }
      ],
      isFeatured: globalIndex % 7 === 0 || groupIndex === 0,
      status: 'active',
      discountPercent,
      taxRate: group.imageSet === 'books' ? 0 : 18,
      salesCount,
      rating,
      reviewCount,
      tags,
      popularityScore: money(Math.min(95, 35 + (salesCount * 0.12) + (rating * 5) + (reviewCount * 0.03)))
    };
  }));
};

const assertDbConfig = () => {
  const hasConnectionString = Boolean(process.env.DATABASE_URL);
  const hasDiscreteConfig = Boolean(
    (process.env.PGHOST || process.env.DB_HOST)
    && (process.env.PGUSER || process.env.DB_USER)
    && (process.env.PGDATABASE || process.env.DB_NAME)
  );

  if (!hasConnectionString && !hasDiscreteConfig) {
    throw new Error('Missing PostgreSQL database environment variables. Set DATABASE_URL or PGHOST, PGUSER and PGDATABASE.');
  }
};

const upsertCategory = async (connection, category, parentId = null) => {
  const result = await connection.query(
    `INSERT INTO categories (name, slug, description, parent_id, is_active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      parent_id = EXCLUDED.parent_id,
      is_active = true
     RETURNING id`,
    [category.name, category.slug, category.description, parentId]
  );

  return result.rows[0].id;
};

const seedCategories = async (connection) => {
  const categoryIds = new Map();

  for (const category of categorySeeds.filter(item => !item.parentSlug)) {
    categoryIds.set(category.slug, await upsertCategory(connection, category));
  }

  for (const category of categorySeeds.filter(item => item.parentSlug)) {
    categoryIds.set(category.slug, await upsertCategory(connection, category, categoryIds.get(category.parentSlug)));
  }

  return categoryIds;
};

const insertProductImages = async (connection, productId, product) => {
  const existingImages = await connection.query(
    'SELECT COUNT(*)::int as count FROM product_images WHERE product_id = $1',
    [productId]
  );

  if (existingImages.rows[0].count > 0) return;

  for (let index = 0; index < product.images.length; index += 1) {
    await connection.query(
      `INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, product.images[index], product.name, index === 0, index]
    );
  }
};

const seedProducts = async () => {
  assertDbConfig();

  const connection = await db.getClient();

  try {
    await connection.query('BEGIN');

    const categoryIds = await seedCategories(connection);
    const products = buildProducts();

    for (const product of products) {
      const categoryId = categoryIds.get(product.categorySlug);
      if (!categoryId) {
        throw new Error(`Missing category for slug: ${product.categorySlug}`);
      }

      const result = await connection.query(
        `INSERT INTO products (
          name, slug, description, short_description, price, compare_price, cost_price, sku,
          category_id, brand, tags, stock_quantity, low_stock_threshold, images, specifications,
          is_featured, is_active, status, discount_percent, tax_rate, sales_count, rating, review_count,
          popularity_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          short_description = EXCLUDED.short_description,
          price = EXCLUDED.price,
          compare_price = EXCLUDED.compare_price,
          cost_price = EXCLUDED.cost_price,
          category_id = EXCLUDED.category_id,
          brand = EXCLUDED.brand,
          tags = EXCLUDED.tags,
          stock_quantity = EXCLUDED.stock_quantity,
          low_stock_threshold = EXCLUDED.low_stock_threshold,
          images = EXCLUDED.images,
          specifications = EXCLUDED.specifications,
          is_featured = EXCLUDED.is_featured,
          is_active = true,
          status = EXCLUDED.status,
          discount_percent = EXCLUDED.discount_percent,
          tax_rate = EXCLUDED.tax_rate,
          sales_count = EXCLUDED.sales_count,
          rating = EXCLUDED.rating,
          review_count = EXCLUDED.review_count,
          popularity_score = EXCLUDED.popularity_score
        RETURNING id`,
        [
          product.name,
          product.slug,
          product.description,
          product.shortDescription,
          product.price,
          product.comparePrice,
          product.costPrice,
          product.sku,
          categoryId,
          product.brand,
          product.tags,
          product.stockQuantity,
          product.lowStockThreshold,
          JSON.stringify(product.images),
          JSON.stringify(product.specifications),
          product.isFeatured,
          product.status,
          product.discountPercent,
          product.taxRate,
          product.salesCount,
          product.rating,
          product.reviewCount,
          product.popularityScore
        ]
      );

      await insertProductImages(connection, result.rows[0].id, product);
    }

    await connection.query('COMMIT');
    console.log(`Seeded ${products.length} products with image galleries.`);
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
};

seedProducts().catch(error => {
  console.error('Product seed failed:', error.message);
  process.exit(1);
});
