import { Request, Response } from "express";
import { getDb } from "../database/postgres";

interface CategoryQueryParams {
  includeAttributeCount?: string;
  includeProductCount?: string;
}

interface CategoryRow {
  id: number;
  name: string;
  path: string;
  parent_id?: number;
  created_at: Date;
  updated_at: Date;
  attribute_count?: number;
  product_count?: number;
}

interface CategoryTreeNode {
  id: number;
  name: string;
  path: string;
  parent_id?: number;
  created_at: Date;
  updated_at: Date;
  attribute_count?: number;
  product_count?: number;
  children: CategoryTreeNode[];
}

export const getCategoryTree = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { includeAttributeCount = "false", includeProductCount = "false" } =
      req.query as CategoryQueryParams;

    const db = getDb();

    // Build the base query
    let query = `
      SELECT 
        c.id,
        c.name,
        c.path,
        c.parent_id,
        c.created_at,
        c.updated_at
    `;

    // Add attribute count if requested
    if (includeAttributeCount === "true") {
      query += `, COUNT(DISTINCT ca.attribute_id) as attribute_count`;
    }

    // Add product count if requested
    if (includeProductCount === "true") {
      query += `, COUNT(DISTINCT p.id) as product_count`;
    }

    query += ` FROM categories c`;

    // Add joins if counts are requested
    const joins: string[] = [];
    if (includeAttributeCount === "true") {
      joins.push("LEFT JOIN category_attributes ca ON c.id = ca.category_id");
    }
    if (includeProductCount === "true") {
      joins.push("LEFT JOIN products p ON c.id = p.category_id");
    }

    if (joins.length > 0) {
      query += ` ${joins.join(" ")}`;
    }

    query += ` GROUP BY c.id, c.name, c.path, c.parent_id, c.created_at, c.updated_at`;
    query += ` ORDER BY c.path`;

    const result = await db.query(query);
    const categories = result.rows as CategoryRow[];

    // Build the tree structure
    const categoryMap = new Map<number, CategoryTreeNode>();
    const rootCategories: CategoryTreeNode[] = [];

    // First pass: create all nodes
    for (const category of categories) {
      const node: CategoryTreeNode = {
        id: category.id,
        name: category.name,
        path: category.path,
        parent_id: category.parent_id,
        created_at: category.created_at,
        updated_at: category.updated_at,
        children: [],
      };

      if (includeAttributeCount === "true") {
        node.attribute_count = category.attribute_count || 0;
      }

      if (includeProductCount === "true") {
        node.product_count = category.product_count || 0;
      }

      categoryMap.set(category.id, node);
    }

    // Second pass: build the tree
    for (const category of categories) {
      const node = categoryMap.get(category.id)!;

      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    }

    res.json({
      data: rootCategories,
    });
  } catch (error) {
    console.error("Error fetching category tree:", error);
    res.status(500).json({ error: "Failed to fetch category tree" });
  }
};
