import { Request, Response } from 'express';
import { db } from '../database/init';
import { AttributeWithDetails, PaginatedResponse } from '../models/types';

interface AttributesQuery {
  categoryNodes?: string[];
  linkType?: ('direct' | 'inherited' | 'global')[];
  notApplicable?: boolean;
  keyword?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getAttributes = async (req: Request<object, object, object, AttributesQuery>, res: Response) => {
  try {
    const {
      categoryNodes,
      linkType,
      notApplicable = false,
      keyword,
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const baseQuery = `
      SELECT DISTINCT 
        a.id,
        a.name,
        a.type,
        a.description,
        a.options,
        a.created_at,
        a.updated_at,
        ca.link_type,
        c.name as category_name,
        c.path as category_path,
        COUNT(DISTINCT p.id) as product_count
      FROM attributes a
    `;

    let joins = '';
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    // Handle category filtering
    if (categoryNodes && categoryNodes.length > 0) {
      joins += `
        LEFT JOIN category_attributes ca ON a.id = ca.attribute_id
        LEFT JOIN categories c ON ca.category_id = c.id
      `;

      if (notApplicable) {
        // Find attributes NOT applicable to the specified categories
        const placeholders = categoryNodes.map(() => '?').join(',');
        whereConditions.push(`a.id NOT IN (
          SELECT DISTINCT ca2.attribute_id 
          FROM category_attributes ca2 
          JOIN categories c2 ON ca2.category_id = c2.id
          WHERE c2.id IN (${placeholders})
          OR c2.path LIKE CONCAT((SELECT path FROM categories WHERE id IN (${placeholders})), '/%')
        )`);
        params.push(...categoryNodes, ...categoryNodes);
      } else {
        // Find attributes applicable to the specified categories
        const categoryConditions: string[] = [];
        
        categoryNodes.forEach(categoryId => {
          // Direct and inherited attributes
          categoryConditions.push(`
            (ca.category_id = ? OR 
             ca.category_id IN (
               SELECT id FROM categories 
               WHERE ? LIKE CONCAT(path, '/%')
             ))
          `);
          params.push(categoryId, categoryId);
        });

        if (categoryConditions.length > 0) {
          whereConditions.push(`(${categoryConditions.join(' OR ')} OR ca.link_type = 'global')`);
        }

        // Filter by link type if specified
        if (linkType && linkType.length > 0) {
          const linkPlaceholders = linkType.map(() => '?').join(',');
          whereConditions.push(`ca.link_type IN (${linkPlaceholders})`);
          params.push(...linkType);
        }
      }
    } else {
      // No category filter - show all attributes
      joins += `
        LEFT JOIN category_attributes ca ON a.id = ca.attribute_id
        LEFT JOIN categories c ON ca.category_id = c.id
      `;
    }

    // Add product count join
    joins += `
      LEFT JOIN product_attribute_values pav ON a.id = pav.attribute_id
      LEFT JOIN products p ON pav.product_id = p.id
    `;

    // Keyword search
    if (keyword) {
      whereConditions.push(`(a.name LIKE ? OR a.description LIKE ?)`);
      const keywordParam = `%${keyword}%`;
      params.push(keywordParam, keywordParam);
    }

    // Build the complete query
    let query = baseQuery + joins;
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    query += ` GROUP BY a.id, ca.link_type, c.name, c.path`;

    // Add sorting
    const validSortFields = ['name', 'type', 'created_at', 'product_count'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
    const actualSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${actualSortBy} ${actualSortOrder}`;

    // Get total count for pagination
    const countQuery = `SELECT COUNT(DISTINCT a.id) as total FROM (${query}) as subquery`;
    
    return new Promise<void>((resolve, reject) => {
      db.get(countQuery, params, (err, countResult: { total: number }) => {
        if (err) {
          reject(err);
          return;
        }

        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // Add pagination
        const paginatedQuery = query + ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        db.all(paginatedQuery, params, (err, rows: Array<{
          id: number;
          name: string;
          type: string;
          description?: string;
          options?: string;
          created_at: string;
          updated_at: string;
          link_type?: string;
          category_name?: string;
          category_path?: string;
          product_count: number;
        }>) => {
          if (err) {
            reject(err);
            return;
          }

          const attributes: AttributeWithDetails[] = rows.map(row => ({
            id: row.id,
            name: row.name,
            type: row.type as 'text' | 'number' | 'boolean' | 'select' | 'multi-select',
            description: row.description,
            options: row.options ? JSON.parse(row.options) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            linkType: row.link_type as 'direct' | 'inherited' | 'global' | undefined,
            categoryPath: row.category_path,
            productCount: row.product_count || 0
          }));

          const response: PaginatedResponse<AttributeWithDetails> = {
            data: attributes,
            pagination: {
              page,
              limit,
              total,
              totalPages
            }
          };

          res.json(response);
          resolve();
        });
      });
    });
  } catch (error) {
    console.error('Error fetching attributes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
