-- Create the database schema for Trustana API

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attributes table
CREATE TABLE IF NOT EXISTS attributes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    is_global BOOLEAN DEFAULT FALSE,
    options JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Category-Attribute relationships
CREATE TABLE IF NOT EXISTS category_attributes (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    link_type VARCHAR(50) DEFAULT 'direct',
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, attribute_id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product-Attribute values
CREATE TABLE IF NOT EXISTS product_attributes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, attribute_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path);
CREATE INDEX IF NOT EXISTS idx_category_attributes_category_id ON category_attributes(category_id);
CREATE INDEX IF NOT EXISTS idx_category_attributes_attribute_id ON category_attributes(attribute_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_attribute_id ON product_attributes(attribute_id);

-- Insert sample data
INSERT INTO categories (name, path, parent_id) VALUES
('Electronics', 'Electronics', NULL),
('Computers', 'Electronics/Computers', 1),
('Laptops', 'Electronics/Computers/Laptops', 2),
('Desktops', 'Electronics/Computers/Desktops', 2),
('Smartphones', 'Electronics/Smartphones', 1),
('Home & Garden', 'Home & Garden', NULL),
('Furniture', 'Home & Garden/Furniture', 6),
('Lighting', 'Home & Garden/Lighting', 6)
ON CONFLICT (path) DO NOTHING;

INSERT INTO attributes (name, type, description, is_global, is_required) VALUES
('Brand', 'text', 'Product brand name', true, true),
('Price', 'number', 'Product price in USD', true, true),
('Color', 'select', 'Product color', true, false),
('Weight', 'number', 'Product weight in pounds', true, false),
('Screen Size', 'number', 'Screen size in inches', false, false),
('RAM', 'select', 'Memory size', false, false),
('Storage', 'select', 'Storage capacity', false, false),
('CPU', 'text', 'Processor model', false, false),
('Battery Life', 'number', 'Battery life in hours', false, false),
('Operating System', 'select', 'Operating system', false, false)
ON CONFLICT DO NOTHING;

-- Link attributes to categories
INSERT INTO category_attributes (category_id, attribute_id, link_type, is_required) VALUES
-- Electronics attributes
(1, 1, 'direct', true),  -- Brand
(1, 2, 'direct', true),  -- Price
(1, 3, 'direct', false), -- Color
(1, 4, 'direct', false), -- Weight

-- Computer-specific attributes
(2, 5, 'direct', false), -- Screen Size
(2, 6, 'direct', false), -- RAM
(2, 7, 'direct', false), -- Storage
(2, 8, 'direct', false), -- CPU

-- Laptop-specific attributes
(3, 9, 'direct', false), -- Battery Life
(3, 10, 'direct', false), -- Operating System

-- Smartphone attributes
(5, 5, 'direct', true),  -- Screen Size
(5, 9, 'direct', false), -- Battery Life
(5, 10, 'direct', false) -- Operating System
ON CONFLICT (category_id, attribute_id) DO NOTHING;
