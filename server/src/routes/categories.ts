import express, { Router } from 'express';
import { getCategoryTree } from '../controllers/categoriesController';

const router: Router = express.Router();

// GET /api/categories/tree
router.get('/tree', getCategoryTree);

export default router;
