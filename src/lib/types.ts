export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  path: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attribute {
  id: number;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multi-select';
  description?: string;
  options?: string[];
  createdAt: Date;
  updatedAt: Date;
}

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

export interface CategoryTreeResponse {
  data: CategoryTreeNode[];
  total: number;
}

export interface AttributesQueryParams {
  categoryNodes?: string[];
  linkType?: ('direct' | 'inherited' | 'global')[];
  notApplicable?: boolean;
  keyword?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryTreeQueryParams {
  includeAttributeCount?: boolean;
  includeProductCount?: boolean;
}
