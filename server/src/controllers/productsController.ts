import { Request, Response } from "express";
import { getDb } from "../database/postgres";

interface ProductQueryParams {
  categoryId?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  keyword?: string;
}

export const getProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      categoryId,
      page = "1",
      limit = "10",
      sortBy = "name",
      sortOrder = "asc",
      keyword,
    } = req.query as ProductQueryParams;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const db = getDb();
    const params: unknown[] = [];

    // Build the base query
    let baseQuery = `
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    // Add category filtering
    if (categoryId) {
      const categoryIds = categoryId.split(",");
      const placeholders = categoryIds.map((_, index) => `$${params.length + index + 1}`).join(",");
      params.push(...categoryIds);
      baseQuery += ` AND p.category_id IN (${placeholders})`;
    }

    // Add keyword search
    if (keyword) {
      params.push(`%${keyword}%`);
      baseQuery += ` AND p.name ILIKE $${params.length}`;
    }

    // Count total products matching the criteria
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Build the main query with selection
    const selectQuery = `
      SELECT 
        p.id,
        p.name,
        p.category_id,
        c.name as category_name,
        c.path as category_path,
        p.created_at,
        p.updated_at
      ${baseQuery}
    `;

    // Add sorting and pagination
    const sortField = sortBy === "category" ? "c.name" : `p.${sortBy}`;
    const sortDirection = sortOrder === "desc" ? "DESC" : "ASC";
    const finalQuery = `${selectQuery} ORDER BY ${sortField} ${sortDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    params.push(limitNumber, offset);

    const result = await db.query(finalQuery, params);

    res.json({
      data: result.rows,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

export default { getProducts };
