import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { apiClient } from "../lib/api";
import type { ProductsQueryParams } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface ProductsListProps {
  selectedCategories?: number[];
}

export function ProductsList({ selectedCategories = [] }: ProductsListProps) {
  const [queryParams, setQueryParams] = useState<ProductsQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  });
  const [keyword, setKeyword] = useState("");

  // Update query params when selected categories change
  useEffect(() => {
    setQueryParams((prev) => ({
      ...prev,
      categoryId:
        selectedCategories.length > 0
          ? selectedCategories.join(",")
          : undefined,
      page: 1, // Reset to first page when categories change
    }));
  }, [selectedCategories]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => apiClient.getProducts(queryParams),
    // Don't fetch if no categories selected
    enabled: selectedCategories.length > 0,
  });

  const handleSearch = () => {
    setQueryParams((prev) => ({
      ...prev,
      keyword: keyword.trim() || undefined,
      page: 1,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleSortChange = (field: string) => {
    setQueryParams((prev) => {
      const newSortOrder =
        prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc";
      return {
        ...prev,
        sortBy: field,
        sortOrder: newSortOrder,
      };
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span>Products</span>
            {selectedCategories.length > 0 && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({selectedCategories.length} categories selected)
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 w-full"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {selectedCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="mb-1">No categories selected</p>
            <p className="text-sm">
              Select one or more categories to view products
            </p>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin h-8 w-8 mx-auto mb-2 border-2 border-gray-300 dark:border-gray-700 border-t-blue-600 rounded-full" />
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="mb-1">Failed to load products</p>
            <p className="text-sm">Please try again later</p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="mb-1">No products found</p>
            <p className="text-sm">
              Try selecting different categories or changing your search
            </p>
          </div>
        ) : (
          <>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange("name")}
                    >
                      <div className="flex items-center">
                        <span>Name</span>
                        {queryParams.sortBy === "name" && (
                          <span className="ml-1">
                            {queryParams.sortOrder === "asc" ? "↓" : "↑"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange("category")}
                    >
                      <div className="flex items-center">
                        <span>Category</span>
                        {queryParams.sortBy === "category" && (
                          <span className="ml-1">
                            {queryParams.sortOrder === "asc" ? "↓" : "↑"}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {data?.data.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.categoryName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing{" "}
                  {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
                  {Math.min(
                    data.pagination.page * data.pagination.limit,
                    data.pagination.total
                  )}{" "}
                  of {data.pagination.total} products
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={data.pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={
                      data.pagination.page === data.pagination.totalPages
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
