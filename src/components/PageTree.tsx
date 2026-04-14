'use client';

import { useState } from 'react';
import { PageNode } from '@/lib/plane-api';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';

interface PageNodeProps {
  page: PageNode;
  selectedPageId: string | null;
  onSelectPage: (page: PageNode) => void;
  depth?: number;
}

export function PageNodeComponent({ 
  page, 
  selectedPageId, 
  onSelectPage, 
  depth = 0 
}: PageNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = page.children && page.children.length > 0;
  const isSelected = selectedPageId === page.id;
  const isRoot = page.parent_id === null;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onSelectPage(page);
  };

  // Determine icon based on state
  const getIcon = () => {
    if (hasChildren) {
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
      );
    }
    return <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />;
  };

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-md
          transition-colors duration-150
          ${isSelected ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'}
          ${isRoot ? 'font-semibold' : ''}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse toggle */}
        <button
          onClick={handleToggle}
          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            )
          ) : (
            <span className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Page icon */}
        {getIcon()}

        {/* Page name */}
        <span className="text-sm truncate flex-1">
          {page.name}
        </span>

        {/* Children count badge */}
        {hasChildren && (
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {page.children.length}
          </span>
        )}
      </div>

      {/* Render children */}
      {isExpanded && hasChildren && (
        <div className="border-l border-gray-200 ml-4">
          {page.children
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(child => (
              <PageNodeComponent
                key={child.id}
                page={child}
                selectedPageId={selectedPageId}
                onSelectPage={onSelectPage}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

interface PageTreeProps {
  pages: PageNode[];
  selectedPageId: string | null;
  onSelectPage: (page: PageNode) => void;
}

export function PageTree({ pages, selectedPageId, onSelectPage }: PageTreeProps) {
  return (
    <div className="py-2">
      {pages.map(page => (
        <PageNodeComponent
          key={page.id}
          page={page}
          selectedPageId={selectedPageId}
          onSelectPage={onSelectPage}
          depth={0}
        />
      ))}
    </div>
  );
}
