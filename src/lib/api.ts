import axios from "axios";
import type {
  AttributesQueryParams,
  CategoryTreeQueryParams,
  PaginatedResponse,
  AttributeWithDetails,
  CategoryTreeResponse,
  Product,
  ProductsQueryParams,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiClient = {
  // Get attributes with optional filtering, pagination, and sorting
  getAttributes: (
    params?: AttributesQueryParams
  ): Promise<PaginatedResponse<AttributeWithDetails>> => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    return api
      .get(`/attributes?${searchParams.toString()}`)
      .then((res) => res.data);
  },

  // Get category tree with optional counts
  getCategoryTree: (
    params?: CategoryTreeQueryParams
  ): Promise<CategoryTreeResponse> => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return api
      .get(`/categories/tree?${searchParams.toString()}`)
      .then((res) => res.data);
  },

  // Health check
  healthCheck: (): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
  }> => {
    return api.get("/health").then((res) => res.data);
  },

  // Get products with optional filtering, pagination, and sorting
  getProducts: (
    params?: ProductsQueryParams
  ): Promise<PaginatedResponse<Product>> => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    return api
      .get(`/products?${searchParams.toString()}`)
      .then((res) => res.data);
  },
};

export default apiClient;
