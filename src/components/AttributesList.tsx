import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../lib/api';
import type { AttributesQueryParams, AttributeWithDetails } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface AttributesListProps {
  selectedCategories?: number[];
}

export function AttributesList({ selectedCategories = [] }: AttributesListProps) {
  const [queryParams, setQueryParams] = useState<AttributesQueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [linkTypeFilter, setLinkTypeFilter] = useState<string[]>([]);

  // Update query params when selected categories change
  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
      categoryNodes: selectedCategories.length > 0 ? selectedCategories.map(String) : undefined,
      page: 1 // Reset to first page when categories change
    }));
  }, [selectedCategories]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['attributes', queryParams],
    queryFn: () => apiClient.getAttributes(queryParams)
  });

  const handleSearch = () => {
    setQueryParams(prev => ({
      ...prev,
      keyword: keyword.trim() || undefined,
      page: 1
    }));
  };

  const handleLinkTypeToggle = (linkType: string) => {
    const newFilter = linkTypeFilter.includes(linkType)
      ? linkTypeFilter.filter(t => t !== linkType)
      : [...linkTypeFilter, linkType];
    
    setLinkTypeFilter(newFilter);
    setQueryParams(prev => ({
      ...prev,
      linkType: newFilter.length > 0 ? newFilter as ('direct' | 'inherited' | 'global')[] : undefined,
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setQueryParams(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (field: string) => {
    setQueryParams(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const getLinkTypeBadgeColor = (linkType?: string) => {
    switch (linkType) {
      case 'direct': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inherited': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'global': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatAttributeType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-4">
            Error loading attributes: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Attributes</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search attributes..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {showFilters && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <h4 className="font-medium mb-3">Link Type Filter</h4>
              <div className="flex gap-2 flex-wrap">
                {['direct', 'inherited', 'global'].map(linkType => (
                  <Button
                    key={linkType}
                    variant={linkTypeFilter.includes(linkType) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLinkTypeToggle(linkType)}
                  >
                    {linkType.charAt(0).toUpperCase() + linkType.slice(1)}
                  </Button>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Filtering for {selectedCategories.length} selected categor{selectedCategories.length === 1 ? 'y' : 'ies'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Attributes Table */}
        {!isLoading && data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <Button variant="ghost" size="sm" onClick={() => handleSortChange('name')}>
                        Name {queryParams.sortBy === 'name' && (queryParams.sortOrder === 'asc' ? '↑' : '↓')}
                      </Button>
                    </th>
                    <th className="text-left p-2">
                      <Button variant="ghost" size="sm" onClick={() => handleSortChange('type')}>
                        Type {queryParams.sortBy === 'type' && (queryParams.sortOrder === 'asc' ? '↑' : '↓')}
                      </Button>
                    </th>
                    <th className="text-left p-2">Link Type</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">
                      <Button variant="ghost" size="sm" onClick={() => handleSortChange('product_count')}>
                        Products {queryParams.sortBy === 'product_count' && (queryParams.sortOrder === 'asc' ? '↑' : '↓')}
                      </Button>
                    </th>
                    <th className="text-left p-2">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((attribute: AttributeWithDetails) => (
                    <tr key={attribute.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2 font-medium">{attribute.name}</td>
                      <td className="p-2">
                        <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          {formatAttributeType(attribute.type)}
                        </span>
                      </td>
                      <td className="p-2">
                        {attribute.linkType && (
                          <span className={`inline-block px-2 py-1 text-xs rounded ${getLinkTypeBadgeColor(attribute.linkType)}`}>
                            {attribute.linkType}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                        {attribute.categoryPath || 'Global'}
                      </td>
                      <td className="p-2">{attribute.productCount}</td>
                      <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                        {attribute.options && attribute.options.length > 0 ? (
                          <div className="max-w-32 truncate" title={attribute.options.join(', ')}>
                            {attribute.options.slice(0, 2).join(', ')}
                            {attribute.options.length > 2 && '...'}
                          </div>
                        ) : (
                          'No options'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} attributes
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={data.pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={data.pagination.page >= data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && data && data.data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No attributes found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
