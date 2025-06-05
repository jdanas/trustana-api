import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CategoryTree } from "./components/CategoryTree";
import { AttributesList } from "./components/AttributesList";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const clearSelectedCategories = () => {
    setSelectedCategories([]);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Trustana Product Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage product categories and attributes with advanced filtering
              and pagination
            </p>
          </header>

          {selectedCategories.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    {selectedCategories.length} categor
                    {selectedCategories.length === 1 ? "y" : "ies"} selected
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Attributes are filtered based on your selection
                  </p>
                </div>
                <button
                  onClick={clearSelectedCategories}
                  className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <CategoryTree
                onCategorySelect={handleCategorySelect}
                selectedCategories={selectedCategories}
              />
            </div>
            <div>
              <AttributesList selectedCategories={selectedCategories} />
            </div>
          </div>

          <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>Trustana MVP - Product Categories & Attributes Management</p>
            <p className="mt-1">
              Built with React, TypeScript, Postgres, all Dockerize
            </p>
          </footer>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
