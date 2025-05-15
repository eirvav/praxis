'use client';

import { Search, LayoutGrid, List, ChevronsUpDown, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type FilterType = 'course' | 'semester';
export type ModuleStatus = 'all' | 'not-started' | 'completed';
export type SortBy = 'date' | 'name';
export type ViewMode = 'grid' | 'list';
export type UserRole = 'teacher' | 'student';

export interface FilterItem {
  type: FilterType;
  value: string;
  label: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface PopoverFilterSection {
  title: string;
  type: FilterType;
  options: FilterOption[];
  layout?: 'grid' | 'list';
}

interface ModuleFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  moduleStatus: ModuleStatus;
  setModuleStatus: (status: ModuleStatus) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedFilters: FilterItem[];
  setSelectedFilters: (filters: FilterItem[]) => void;
  filterSections: PopoverFilterSection[];
  onFilterChange?: (type: FilterType, value: string | null) => void;
  onClearFilters?: () => void;
  role?: UserRole;
}

export const ModuleFilters = ({
  searchQuery,
  setSearchQuery,
  moduleStatus,
  setModuleStatus,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  selectedFilters,
  setSelectedFilters,
  filterSections,
  onFilterChange,
  role = 'student',
}: ModuleFiltersProps) => {
  
  // Add a filter tag
  const addFilter = (type: FilterType, value: string, label: string) => {
    if (!selectedFilters.some(filter => filter.type === type && filter.value === value)) {
      const newFilters = [...selectedFilters, { type, value, label }];
      setSelectedFilters(newFilters);
      
      // Notify parent of filter change
      if (onFilterChange) {
        onFilterChange(type, value);
      }
    }
  };

  // Remove a filter tag
  const removeFilter = (type: FilterType, value: string) => {
    const newFilters = selectedFilters.filter(filter => !(filter.type === type && filter.value === value));
    setSelectedFilters(newFilters);
    
    // Notify parent of filter change
    if (onFilterChange) {
      onFilterChange(type, null);
    }
  };

  const getStatusButtons = () => {
    if (role === 'teacher') {
      return (
        <>
          <Button 
            variant={moduleStatus === 'all' ? "default" : "outline"}
            size="sm"
            className={moduleStatus === 'all' ? "bg-primaryStyling hover:bg-indigo-700 rounded-full " : "rounded-full"}
            onClick={() => setModuleStatus('all')}
          >
            All Modules
          </Button>
          <Button 
            variant={moduleStatus === 'not-started' ? "default" : "outline"}
            size="sm"
            className={moduleStatus === 'not-started' ? "bg-amber-500 hover:bg-amber-600 rounded-full " : "rounded-full"}
            onClick={() => setModuleStatus('not-started')}
          >
            Not Graded
          </Button>
          <Button 
            variant={moduleStatus === 'completed' ? "default" : "outline"}
            size="sm"
            className={moduleStatus === 'completed' ? "bg-green-600 hover:bg-green-700 rounded-full " : "rounded-full"}
            onClick={() => setModuleStatus('completed')}
          >
            Graded
          </Button>
        </>
      );
    }

    return (
      <>
        <Button 
          variant={moduleStatus === 'all' ? "default" : "outline"}
          size="sm"
          className={moduleStatus === 'all' ? "bg-primaryStyling hover:bg-indigo-700 rounded-full " : "rounded-full"}
          onClick={() => setModuleStatus('all')}
        >
          All Modules
        </Button>
        <Button 
          variant={moduleStatus === 'not-started' ? "default" : "outline"}
          size="sm"
          className={moduleStatus === 'not-started' ? "bg-amber-500 hover:bg-amber-600 rounded-full " : "rounded-full"}
          onClick={() => setModuleStatus('not-started')}
        >
          Not Started
        </Button>
        <Button 
          variant={moduleStatus === 'completed' ? "default" : "outline"}
          size="sm"
          className={moduleStatus === 'completed' ? "bg-green-600 hover:bg-green-700 rounded-full " : "rounded-full"}
          onClick={() => setModuleStatus('completed')}
        >
          Completed
        </Button>
      </>
    );
  };

  return (
    <>
      {/* Status filter pills */}
      <div className="rounded-lg flex gap-2 mb-6">
        {getStatusButtons()}
      </div>

      {/* Filter Controls Row */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Search field */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 h-10 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Add Filter Button */}
          {filterSections.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-10 px-4 cursor-pointer">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="flex flex-col gap-4">
                  <div className="space-y-4">
                    {filterSections.map((section) => (
                      <div key={section.type}>
                        <div className="font-medium mb-2">{section.title}</div>
                        <div className={cn(
                          section.layout === 'grid' ? "grid grid-cols-2 gap-1" : "space-y-1"
                        )}>
                          {section.options.map(option => (
                            <button
                              key={`${section.type}-${option.value}`}
                              onClick={() => addFilter(section.type, option.value, option.label)}
                              className={cn(
                                "text-left px-3 py-2 text-sm rounded-md transition-colors w-full",
                                selectedFilters.some(f => f.type === section.type && f.value === option.value)
                                  ? "bg-primaryStyling text-white hover:bg-primaryStyling/90"
                                  : "hover:bg-slate-50"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        {section !== filterSections[filterSections.length - 1] && (
                          <div className="border-t my-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {selectedFilters.map(filter => (
              <Badge 
                key={`${filter.type}-${filter.value}`}
                variant="outline"
                className="rounded-full px-3 py-1.5 bg-white flex items-center gap-1 border-slate-200"
              >
                {filter.label}
                <button 
                  className="ml-1 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 h-4 w-4 flex items-center justify-center"
                  onClick={() => removeFilter(filter.type, filter.value)}
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-4 cursor-pointer">
                <ChevronsUpDown className="h-4 w-4 mr-2" />
                Sort by: {sortBy === 'date' ? 'Date' : 'Name'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem 
                onClick={() => setSortBy('name')}
                className={cn(
                  "cursor-pointer",
                  sortBy === 'name' && "bg-slate-100"
                )}
              >
                Name
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('date')}
                className={cn(
                  "cursor-pointer",
                  sortBy === 'date' && "bg-slate-100"
                )}
              >
                Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View toggle */}
          <div className="flex items-center border rounded-lg divide-x overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={cn(
                "h-10 px-3 rounded-none border-none",
                viewMode === 'grid' 
                  ? "bg-primaryStyling hover:bg-primaryStyling/90 cursor-pointer" 
                  : "hover:bg-slate-50 cursor-pointer"
              )}
            >
              <LayoutGrid className={cn(
                "h-4 w-4",
                viewMode === 'grid' ? "text-white" : "text-slate-600"
              )} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-10 px-3 rounded-none border-none",
                viewMode === 'list' 
                  ? "bg-primaryStyling hover:bg-primaryStyling/90 cursor-pointer" 
                  : "hover:bg-slate-50 cursor-pointer"
              )}
            >
              <List className={cn(
                "h-4 w-4",
                viewMode === 'list' ? "text-white" : "text-slate-600"
              )} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModuleFilters; 