'use client';

import { useState } from 'react';
import {
  ChevronRight, ChevronDown, FileText, Folder, FolderOpen,
  MoreHorizontal, Plus, Trash2, Edit3, Loader2,
} from 'lucide-react';
import { PageNode, PlanePage, deletePage, updatePage } from '@/lib/plane-api';
import { getSettings } from '@/lib/settings';
import { CreatePageModal } from '@/components/CreatePageModal';

interface PageNodeProps {
  page: PageNode;
  selectedPageId: string | null;
  onSelectPage: (page: PageNode) => void;
  allPages: PlanePage[];
  onRefresh: () => void;
  depth?: number;
}

function PageNodeComponent({
  page,
  selectedPageId,
  onSelectPage,
  allPages,
  onRefresh,
  depth = 0,
}: PageNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const hasChildren = page.children.length > 0;
  const isSelected = selectedPageId === page.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) setExpanded(v => !v);
  };

  const startRename = () => {
    setMenuOpen(false);
    setRenameName(page.name);
    setRenaming(true);
  };

  const saveRename = async () => {
    if (!renameName.trim() || renameName === page.name) {
      setRenaming(false);
      return;
    }
    setRenameSaving(true);
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      await updatePage(planeBaseUrl, workspaceSlug, apiKey, page.id, { name: renameName.trim() });
      onRefresh();
    } catch {
      // silent — next refresh will restore the real name
    } finally {
      setRenameSaving(false);
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm(`"${page.name}" verwijderen?`)) return;
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      await deletePage(planeBaseUrl, workspaceSlug, apiKey, page.id);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verwijderen mislukt');
    }
  };

  return (
    <div className="select-none">
      <div
        className={`
          group relative flex items-center gap-1.5 py-1 px-2 cursor-pointer rounded-lg
          transition-colors duration-100
          ${isSelected
            ? 'bg-indigo-50 text-indigo-900'
            : 'text-gray-700 hover:bg-gray-50'
          }
        `}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
        onClick={() => !renaming && onSelectPage(page)}
      >
        {/* Expand toggle */}
        <button
          onClick={handleToggle}
          className="p-0.5 rounded hover:bg-black/5 shrink-0"
          tabIndex={-1}
        >
          {hasChildren ? (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <span className="w-3.5 h-3.5 block" />
          )}
        </button>

        {/* Icon */}
        {hasChildren ? (
          expanded
            ? <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            : <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
        ) : (
          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
        )}

        {/* Name or rename input */}
        {renaming ? (
          <input
            autoFocus
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={e => {
              if (e.key === 'Enter') saveRename();
              if (e.key === 'Escape') setRenaming(false);
            }}
            onClick={e => e.stopPropagation()}
            className="flex-1 min-w-0 text-sm px-1 py-0.5 border border-indigo-400 rounded focus:outline-none bg-white"
          />
        ) : (
          <span className="flex-1 min-w-0 text-sm truncate">
            {page.name}
            {renameSaving && <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />}
          </span>
        )}

        {/* Hover actions */}
        {hovered && !renaming && (
          <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowCreate(true)}
              className="p-1 rounded hover:bg-black/10 text-gray-400 hover:text-indigo-600"
              title="Subpagina aanmaken"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 rounded hover:bg-black/10 text-gray-400 hover:text-gray-700"
              title="Meer opties"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Context menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40">
            <button
              onClick={startRename}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-400" />
              Hernoemen
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Verwijderen
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {page.children
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(child => (
              <PageNodeComponent
                key={child.id}
                page={child}
                selectedPageId={selectedPageId}
                onSelectPage={onSelectPage}
                allPages={allPages}
                onRefresh={onRefresh}
                depth={depth + 1}
              />
            ))}
        </div>
      )}

      {showCreate && (
        <CreatePageModal
          allPages={allPages}
          defaultParentId={page.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setExpanded(true);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

interface PageTreeProps {
  pages: PageNode[];
  selectedPageId: string | null;
  onSelectPage: (page: PageNode) => void;
  allPages: PlanePage[];
  onRefresh: () => void;
}

export function PageTree({ pages, selectedPageId, onSelectPage, allPages, onRefresh }: PageTreeProps) {
  return (
    <div className="py-1">
      {pages.map(page => (
        <PageNodeComponent
          key={page.id}
          page={page}
          selectedPageId={selectedPageId}
          onSelectPage={onSelectPage}
          allPages={allPages}
          onRefresh={onRefresh}
          depth={0}
        />
      ))}
    </div>
  );
}
