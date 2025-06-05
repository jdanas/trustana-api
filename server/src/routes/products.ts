import express, { Router } from "express";
import { getProducts } from "../controllers/productsController";

const router: Router = express.Router();

// GET /api/products
router.get("/", getProducts);

export default router;
