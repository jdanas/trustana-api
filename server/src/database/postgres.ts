import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "trustana_db",
  password: process.env.DB_PASSWORD || "password",
  port: parseInt(process.env.DB_PORT || "5432"),
});

export const getDb = () => pool;

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log("Initializing PostgreSQL database...");

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        path TEXT NOT NULL,
        parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attributes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attributes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL DEFAULT 'text',
        is_required BOOLEAN DEFAULT FALSE,
        is_global BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create category_attributes junction table for many-to-many relationship
    await pool.query(`
      CREATE TABLE IF NOT EXISTS category_attributes (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
        link_type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (link_type IN ('direct', 'inherited')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category_id, attribute_id)
      )
    `);

    // Create products table (for the assignment requirements)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create product_attributes table for product attribute values
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_attributes (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, attribute_id)
      )
    `);

    // Create indexes for better performance
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)"
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_category_attributes_category_id ON category_attributes(category_id)"
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_category_attributes_attribute_id ON category_attributes(attribute_id)"
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)"
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON product_attributes(product_id)"
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_product_attributes_attribute_id ON product_attributes(attribute_id)"
    );

    console.log("Database tables created successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log("Seeding database...");

    // Check if data already exists
    const existingCategories = await pool.query(
      "SELECT COUNT(*) FROM categories"
    );
    if (parseInt(existingCategories.rows[0].count) > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Seed categories (hierarchical structure)
    const categories = [
      { name: "Electronics", path: "electronics", parent_id: null },
      { name: "Food & Beverages", path: "food-beverages", parent_id: null },
      { name: "Clothing", path: "clothing", parent_id: null },
    ];

    const categoryIds: Record<string, number> = {};

    for (const category of categories) {
      const result = await pool.query(
        "INSERT INTO categories (name, path, parent_id) VALUES ($1, $2, $3) RETURNING id",
        [category.name, category.path, category.parent_id]
      );
      categoryIds[category.name] = result.rows[0].id;
    }

    // Seed subcategories
    const subcategories = [
      {
        name: "Smartphones",
        path: "electronics/smartphones",
        parent_id: categoryIds["Electronics"],
      },
      {
        name: "Laptops",
        path: "electronics/laptops",
        parent_id: categoryIds["Electronics"],
      },
      {
        name: "Beverages",
        path: "food-beverages/beverages",
        parent_id: categoryIds["Food & Beverages"],
      },
      {
        name: "Snacks",
        path: "food-beverages/snacks",
        parent_id: categoryIds["Food & Beverages"],
      },
      {
        name: "T-Shirts",
        path: "clothing/t-shirts",
        parent_id: categoryIds["Clothing"],
      },
      {
        name: "Jeans",
        path: "clothing/jeans",
        parent_id: categoryIds["Clothing"],
      },
    ];

    for (const subcategory of subcategories) {
      const result = await pool.query(
        "INSERT INTO categories (name, path, parent_id) VALUES ($1, $2, $3) RETURNING id",
        [subcategory.name, subcategory.path, subcategory.parent_id]
      );
      categoryIds[subcategory.name] = result.rows[0].id;
    }

    // Add more specific subcategories
    const specificCategories = [
      {
        name: "Flavoured Drinks",
        path: "food-beverages/beverages/flavoured-drinks",
        parent_id: categoryIds["Beverages"],
      },
      {
        name: "Coffee",
        path: "food-beverages/beverages/coffee",
        parent_id: categoryIds["Beverages"],
      },
    ];

    for (const specific of specificCategories) {
      const result = await pool.query(
        "INSERT INTO categories (name, path, parent_id) VALUES ($1, $2, $3) RETURNING id",
        [specific.name, specific.path, specific.parent_id]
      );
      categoryIds[specific.name] = result.rows[0].id;
    }

    // Seed attributes
    const attributes = [
      { name: "Color", type: "select", is_required: false, is_global: true },
      { name: "Brand", type: "text", is_required: true, is_global: true },
      { name: "Price", type: "number", is_required: true, is_global: true },
      {
        name: "Screen Size",
        type: "number",
        is_required: false,
        is_global: false,
      },
      {
        name: "Storage Capacity",
        type: "select",
        is_required: false,
        is_global: false,
      },
      { name: "Flavour", type: "select", is_required: false, is_global: false },
      {
        name: "Caffeine Content",
        type: "number",
        is_required: false,
        is_global: false,
      },
      { name: "Size", type: "select", is_required: false, is_global: false },
      { name: "Material", type: "text", is_required: false, is_global: false },
      { name: "Weight", type: "number", is_required: false, is_global: false },
    ];

    const attributeIds: Record<string, number> = {};

    for (const attribute of attributes) {
      const result = await pool.query(
        "INSERT INTO attributes (name, type, is_required, is_global) VALUES ($1, $2, $3, $4) RETURNING id",
        [
          attribute.name,
          attribute.type,
          attribute.is_required,
          attribute.is_global,
        ]
      );
      attributeIds[attribute.name] = result.rows[0].id;
    }

    // Seed category-attribute relationships (direct links)
    const categoryAttributeLinks = [
      {
        category: "Electronics",
        attribute: "Screen Size",
        link_type: "direct",
      },
      { category: "Electronics", attribute: "Weight", link_type: "direct" },
      {
        category: "Smartphones",
        attribute: "Storage Capacity",
        link_type: "direct",
      },
      { category: "Beverages", attribute: "Flavour", link_type: "direct" },
      {
        category: "Flavoured Drinks",
        attribute: "Caffeine Content",
        link_type: "direct",
      },
      { category: "Clothing", attribute: "Size", link_type: "direct" },
      { category: "Clothing", attribute: "Material", link_type: "direct" },
    ];

    for (const link of categoryAttributeLinks) {
      await pool.query(
        "INSERT INTO category_attributes (category_id, attribute_id, link_type) VALUES ($1, $2, $3)",
        [
          categoryIds[link.category],
          attributeIds[link.attribute],
          link.link_type,
        ]
      );
    }

    // Seed some sample products
    const products = [
      { name: "iPhone 15", category: "Smartphones" },
      { name: "MacBook Pro", category: "Laptops" },
      { name: "Coca Cola", category: "Flavoured Drinks" },
      { name: "Espresso", category: "Coffee" },
      { name: "Cotton T-Shirt", category: "T-Shirts" },
      { name: "Denim Jeans", category: "Jeans" },
    ];

    for (const product of products) {
      await pool.query(
        "INSERT INTO products (name, category_id) VALUES ($1, $2)",
        [product.name, categoryIds[product.category]]
      );
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Closing database connection...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Closing database connection...");
  await pool.end();
  process.exit(0);
});
