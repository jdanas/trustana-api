import { Request, Response } from "express";
import { db } from "../database/init";
import { CategoryTreeNode } from "../models/types";

interface CategoryTreeQuery {
  includeAttributeCount?: boolean;
  includeProductCount?: boolean;
}

export const getCategoryTree = (
  req: Request<object, object, object, CategoryTreeQuery>,
  res: Response
) => {
  try {
    const { includeAttributeCount = false, includeProductCount = false } =
      req.query;

    // Build the base query
    let query = `
      SELECT 
        c.id,
        c.name,
        c.parent_id,
        c.level,
        c.path
    `;

    if (includeAttributeCount) {
      query += `,
        COUNT(DISTINCT ca.attribute_id) as attribute_count
      `;
    }

    if (includeProductCount) {
      query += `,
        COUNT(DISTINCT p.id) as product_count
      `;
    }

    query += `
      FROM categories c
    `;

    if (includeAttributeCount) {
      query += `
        LEFT JOIN category_attributes ca ON c.id = ca.category_id AND ca.link_type = 'direct'
      `;
    }

    if (includeProductCount) {
      query += `
        LEFT JOIN products p ON c.id = p.category_id
      `;
    }

    query += `
      GROUP BY c.id, c.name, c.parent_id, c.level, c.path
      ORDER BY c.level, c.name
    `;

    // Execute query synchronously with better-sqlite3
    const rows = db.prepare(query).all() as Array<{
      id: number;
      name: string;
      parent_id: number | null;
      level: number;
      path: string;
      attribute_count?: number;
      product_count?: number;
    }>;

    // Convert flat array to tree structure
    const categoryMap = new Map<number, CategoryTreeNode>();
    const rootCategories: CategoryTreeNode[] = [];

    // First pass: create all nodes
    rows.forEach((row) => {
      const node: CategoryTreeNode = {
        id: row.id,
        name: row.name,
        parentId: row.parent_id,
        level: row.level,
        children: [],
        ...(includeAttributeCount && {
          attributeCount: row.attribute_count || 0,
        }),
        ...(includeProductCount && { productCount: row.product_count || 0 }),
      };
      categoryMap.set(row.id, node);
    });

    // Second pass: build tree structure
    categoryMap.forEach((node) => {
      if (node.parentId === null) {
        rootCategories.push(node);
      } else {
        const parent = categoryMap.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    // Sort children at each level
    const sortChildren = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach((node) => sortChildren(node.children));
    };

    sortChildren(rootCategories);

    res.json({
      data: rootCategories,
      total: categoryMap.size,
    });
  } catch (error) {
    console.error("Error fetching category tree:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
