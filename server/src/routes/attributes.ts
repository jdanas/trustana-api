import express, { Router } from 'express';
import { getAttributes } from '../controllers/attributesController';

const router: Router = express.Router();

// GET /api/attributes
router.get('/', getAttributes);

export default router;
