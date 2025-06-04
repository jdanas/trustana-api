import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "../../database.sqlite");

export const db = new Database(dbPath);
console.log("Connected to SQLite database");

// Initialize database tables
export const initializeDatabase = (): void => {
  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      path TEXT NOT NULL,
      level INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories (id)
    )
  `);

  // Attributes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'select', 'multi-select')),
      description TEXT,
      options TEXT, -- JSON array for select options
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Category-Attribute relationships
  db.exec(`
    CREATE TABLE IF NOT EXISTS category_attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      attribute_id INTEGER NOT NULL,
      link_type TEXT NOT NULL CHECK (link_type IN ('direct', 'inherited', 'global')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (attribute_id) REFERENCES attributes (id),
      UNIQUE(category_id, attribute_id)
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // Product attribute values
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_attribute_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      attribute_id INTEGER NOT NULL,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (attribute_id) REFERENCES attributes (id),
      UNIQUE(product_id, attribute_id)
    )
  `);

  console.log("Database tables initialized successfully");
};

// Seed sample data
export const seedDatabase = (): void => {
  // Check if data already exists
  const countResult = db
    .prepare("SELECT COUNT(*) as count FROM categories")
    .get() as { count: number };

  if (countResult.count > 0) {
    console.log("Database already seeded");
    return;
  }

  console.log("Seeding database with sample data...");

  // Insert categories
  const categories = [
    { id: 1, name: "Beverages", parent_id: null, path: "/1", level: 0 },
    { id: 2, name: "Food", parent_id: null, path: "/2", level: 0 },
    { id: 3, name: "Drinks", parent_id: 1, path: "/1/3", level: 1 },
    { id: 4, name: "Hot Drinks", parent_id: 3, path: "/1/3/4", level: 2 },
    { id: 5, name: "Cold Drinks", parent_id: 3, path: "/1/3/5", level: 2 },
    {
      id: 6,
      name: "Flavoured Drinks",
      parent_id: 5,
      path: "/1/3/5/6",
      level: 3,
    },
    { id: 7, name: "Snacks", parent_id: 2, path: "/2/7", level: 1 },
    { id: 8, name: "Chips", parent_id: 7, path: "/2/7/8", level: 2 },
  ];

  const categoryStmt = db.prepare(`
    INSERT INTO categories (id, name, parent_id, path, level)
    VALUES (?, ?, ?, ?, ?)
  `);

  categories.forEach((cat) => {
    categoryStmt.run(cat.id, cat.name, cat.parent_id, cat.path, cat.level);
  });

  // Insert attributes
  const attributes = [
    {
      id: 1,
      name: "Color",
      type: "select",
      options: '["Red", "Blue", "Green", "Yellow", "Black", "White"]',
    },
    {
      id: 2,
      name: "Flavour",
      type: "select",
      options: '["Vanilla", "Chocolate", "Strawberry", "Orange", "Lemon"]',
    },
    {
      id: 3,
      name: "Size",
      type: "select",
      options: '["Small", "Medium", "Large", "Extra Large"]',
    },
    { id: 4, name: "Weight", type: "number", options: null },
    { id: 5, name: "Brand", type: "text", options: null },
    { id: 6, name: "Organic", type: "boolean", options: null },
    {
      id: 7,
      name: "Temperature",
      type: "select",
      options: '["Hot", "Cold", "Room Temperature"]',
    },
    {
      id: 8,
      name: "Sweetness Level",
      type: "select",
      options: '["No Sugar", "Low", "Medium", "High"]',
    },
  ];

  const attrStmt = db.prepare(`
    INSERT INTO attributes (id, name, type, options)
    VALUES (?, ?, ?, ?)
  `);

  attributes.forEach((attr) => {
    attrStmt.run(attr.id, attr.name, attr.type, attr.options);
  });

  // Insert category-attribute relationships
  const categoryAttributes = [
    // Direct links
    { category_id: 6, attribute_id: 1, link_type: "direct" }, // Flavoured Drinks -> Color
    { category_id: 6, attribute_id: 2, link_type: "direct" }, // Flavoured Drinks -> Flavour
    { category_id: 4, attribute_id: 7, link_type: "direct" }, // Hot Drinks -> Temperature
    { category_id: 8, attribute_id: 3, link_type: "direct" }, // Chips -> Size

    // Inherited (will be computed dynamically)
    { category_id: 3, attribute_id: 5, link_type: "direct" }, // Drinks -> Brand
    { category_id: 1, attribute_id: 6, link_type: "direct" }, // Beverages -> Organic

    // Global attributes
    { category_id: 1, attribute_id: 4, link_type: "global" }, // Weight (global)
  ];

  const catAttrStmt = db.prepare(`
    INSERT INTO category_attributes (category_id, attribute_id, link_type)
    VALUES (?, ?, ?)
  `);

  categoryAttributes.forEach((ca) => {
    catAttrStmt.run(ca.category_id, ca.attribute_id, ca.link_type);
  });

  // Insert sample products
  const products = [
    { id: 1, name: "Orange Juice", category_id: 6 },
    { id: 2, name: "Lemon Soda", category_id: 6 },
    { id: 3, name: "Coffee", category_id: 4 },
    { id: 4, name: "Tea", category_id: 4 },
    { id: 5, name: "Potato Chips", category_id: 8 },
    { id: 6, name: "Corn Chips", category_id: 8 },
  ];

  const prodStmt = db.prepare(`
    INSERT INTO products (id, name, category_id)
    VALUES (?, ?, ?)
  `);

  products.forEach((prod) => {
    prodStmt.run(prod.id, prod.name, prod.category_id);
  });

  // Insert sample product attribute values
  const productValues = [
    { product_id: 1, attribute_id: 1, value: "Orange" }, // Orange Juice -> Color
    { product_id: 1, attribute_id: 2, value: "Orange" }, // Orange Juice -> Flavour
    { product_id: 1, attribute_id: 4, value: "500" }, // Orange Juice -> Weight
    { product_id: 2, attribute_id: 1, value: "Yellow" }, // Lemon Soda -> Color
    { product_id: 2, attribute_id: 2, value: "Lemon" }, // Lemon Soda -> Flavour
    { product_id: 5, attribute_id: 3, value: "Large" }, // Potato Chips -> Size
    { product_id: 5, attribute_id: 4, value: "150" }, // Potato Chips -> Weight
  ];

  const valueStmt = db.prepare(`
    INSERT INTO product_attribute_values (product_id, attribute_id, value)
    VALUES (?, ?, ?)
  `);

  productValues.forEach((val) => {
    valueStmt.run(val.product_id, val.attribute_id, val.value);
  });

  console.log("Database seeded successfully");
};
