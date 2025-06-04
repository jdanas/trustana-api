export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  path: string; // Materialized path for tree queries
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attribute {
  id: number;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multi-select';
  description?: string;
  options?: string[]; // For select/multi-select types
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryAttribute {
  id: number;
  categoryId: number;
  attributeId: number;
  linkType: 'direct' | 'inherited' | 'global';
  createdAt: Date;
}

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttributeValue {
  id: number;
  productId: number;
  attributeId: number;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface CategoryTreeNode {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  children: CategoryTreeNode[];
  attributeCount?: number;
  productCount?: number;
}

export interface AttributeWithDetails extends Attribute {
  linkType?: 'direct' | 'inherited' | 'global';
  categoryPath?: string;
  productCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
