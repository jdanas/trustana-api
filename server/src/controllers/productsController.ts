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

    // Build the query
    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        c.name as category_name,
        c.path as category_path,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    // Add category filtering
    if (categoryId) {
      const categoryIds = categoryId.split(",");

      // Find all subcategories of the selected categories
      query += ` AND (
        EXISTS (
          SELECT 1 FROM categories sub
          WHERE p.category_id = sub.id
          AND (`;

      const conditions: string[] = [];

      for (let i = 0; i < categoryIds.length; i++) {
        params.push(`${categoryIds[i]}`);
        conditions.push(
          `sub.path LIKE (SELECT CONCAT(path, '%') FROM categories WHERE id = $${params.length})`
        );
      }

      query += conditions.join(" OR ");
      query += `))`;
    }

    // Add keyword search
    if (keyword) {
      params.push(`%${keyword}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    // Count total products matching the criteria
    const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered_products`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add sorting and pagination
    query += ` ORDER BY ${sortBy === "category" ? "c.name" : `p.${sortBy}`} ${
      sortOrder === "desc" ? "DESC" : "ASC"
    }`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNumber, offset);

    const result = await db.query(query, params);

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
