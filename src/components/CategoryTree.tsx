import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { apiClient } from "../lib/api";
import type { CategoryTreeNode } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";

interface CategoryTreeProps {
  onCategorySelect?: (categoryId: number) => void;
  selectedCategories?: number[];
}

export function CategoryTree({
  onCategorySelect,
  selectedCategories = [],
}: CategoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(
    new Set([1, 2])
  ); // Expand root nodes by default
  const [showCounts, setShowCounts] = useState(true); // Show counts by default

  const { data, isLoading, error } = useQuery({
    queryKey: ["categoryTree", showCounts],
    queryFn: () =>
      apiClient.getCategoryTree({
        includeAttributeCount: showCounts,
        includeProductCount: showCounts,
      }),
  });

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCategoryClick = (categoryId: number) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  const renderTreeNode = (node: CategoryTreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedCategories.includes(node.id);

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer ${
            isSelected ? "bg-blue-100 dark:bg-blue-900" : ""
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <div
            className="flex items-center flex-1"
            onClick={() => handleCategoryClick(node.id)}
          >
            {hasChildren ? (
              <button
                className="mr-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <div className="mr-2">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500" />
                )
              ) : (
                <Folder className="h-4 w-4 text-gray-500" />
              )}
            </div>

            <span className="flex-1 text-sm font-medium">{node.name}</span>

            {showCounts && (
              <div className="text-xs text-gray-500 ml-2">
                {node.attributeCount !== undefined && (
                  <span className="mr-2">A: {node.attributeCount}</span>
                )}
                {node.productCount !== undefined && (
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    P: {node.productCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-4">
            Error loading category tree:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Category Tree</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCounts(!showCounts)}
          >
            {showCounts ? "Hide Counts" : "Show Counts"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          {data?.data.map((node) => renderTreeNode(node))}
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Total categories: {data?.total || 0}
        </div>
      </CardContent>
    </Card>
  );
}
