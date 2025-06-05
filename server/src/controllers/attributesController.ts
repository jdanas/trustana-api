import { Request, Response } from "express";
import { getDb } from "../database/postgres";

interface AttributeQueryParams {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  categoryIds?: string;
  linkTypes?: string;
  keyword?: string;
  notApplicable?: string;
}

interface AttributeRow {
  id: number;
  name: string;
  type: string;
  is_required: boolean;
  is_global: boolean;
  created_at: Date;
  updated_at: Date;
  link_type?: string;
  category_name?: string;
  category_path?: string;
  product_count?: number;
}

export const getAttributes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "10",
      sortBy = "name",
      sortOrder = "asc",
      keyword,
    } = req.query as AttributeQueryParams;

    const db = getDb();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build the base query
    const baseQuery = `
      SELECT DISTINCT 
        a.id,
        a.name,
        a.type,
        a.is_required,
        a.is_global,
        a.created_at,
        a.updated_at,
        ca.link_type,
        c.name as category_name,
        c.path as category_path,
        COUNT(DISTINCT pa.product_id) as product_count
      FROM attributes a
    `;

    const joins: string[] = [];
    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramCount = 0;

    // Add product count join
    joins.push(`
      LEFT JOIN category_attributes ca ON a.id = ca.attribute_id
      LEFT JOIN categories c ON ca.category_id = c.id
      LEFT JOIN product_attributes pa ON a.id = pa.attribute_id
    `);

    // Handle keyword search
    if (keyword) {
      whereConditions.push(
        `(a.name ILIKE $${++paramCount} OR a.type ILIKE $${++paramCount})`
      );
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // Construct the complete query
    let query = baseQuery + joins.join(" ");
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }
    query += ` GROUP BY a.id, a.name, a.type, a.is_required, a.is_global, a.created_at, a.updated_at, ca.link_type, c.name, c.path`;

    // Add sorting
    const validSortFields = ["name", "type", "created_at", "product_count"];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : "name";
    const actualSortOrder = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

    if (actualSortBy === "product_count") {
      query += ` ORDER BY COUNT(DISTINCT pa.product_id) ${actualSortOrder}`;
    } else {
      query += ` ORDER BY a.${actualSortBy} ${actualSortOrder}`;
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    // Add pagination
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limitNum, offset);

    // Execute the main query
    const result = await db.query(query, params);
    const attributes = result.rows as AttributeRow[];

    res.json({
      data: attributes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching attributes:", error);
    res.status(500).json({ error: "Failed to fetch attributes" });
  }
};
