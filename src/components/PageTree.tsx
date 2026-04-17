'use client';

import { useState } from 'react';
import {
  ChevronRight, ChevronDown, FileText, Folder, FolderOpen,
  MoreHorizontal, Plus, Trash2, Edit3, Loader2, GripVertical,
} from 'lucide-react';
import {
  DndContext, DragEndEvent, closestCenter,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageNode, PlanePage } from '@/lib/plane-api';
import { WikiApi } from '@/lib/wiki-api';
import { CreatePageModal } from '@/components/CreatePageModal';

// ── Sibling group with DnD ────────────────────────────────────────────────────

function SiblingGroup({ pages, selectedPageId, onSelectPage, allPages, onRefresh, api, depth }: {
  pages: PageNode[];
  selectedPageId: string | null;
  onSelectPage: (page: PageNode) => void;
  allPages: PlanePage[];
  onRefresh: (selectId?: string) => void;
  api: WikiApi;
  depth: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sorted = [...pages].sort((a, b) => a.sort_order - b.sort_order);
    const oldIdx = sorted.findIndex(p => p.id === active.id);
    const newIdx = sorted.findIndex(p => p.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(sorted, oldIdx, newIdx);
    const prev = reordered[newIdx - 1];
    const next = reordered[newIdx + 1];

    let newSortOrder: number;
    if (!prev) newSortOrder = (next?.sort_order ?? 10000) - 10000;
    else if (!next) newSortOrder = (prev?.sort_order ?? 0) + 10000;
    else newSortOrder = (prev.sort_order + next.sort_order) / 2;

    try {
      await api.update(active.id as string, { sort_order: newSortOrder });
      onRefresh();
    } catch {
      // ignore — refresh will restore correct order
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
        {pages.map(page => (
          <PageNodeComponent
            key={page.id}
            page={page}
            selectedPageId={selectedPageId}
            onSelectPage={onSelectPage}
            allPages={allPages}
            onRefresh={onRefresh}
            api={api}
            depth={depth}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

// ── Single page node ──────────────────────────────────────────────────────────

function PageNodeComponent({ page, selectedPageId, onSelectPage, allPages, onRefresh, api, depth = 0 }: {
  page: PageNode;
  selectedPageId: string | null;
  onSelectPage: (page: PageNode) => void;
  allPages: PlanePage[];
  onRefresh: (selectId?: string) => void;
  api: WikiApi;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? ('relative' as const) : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  const hasChildren = page.children.length > 0;
  const isSelected = selectedPageId === page.id;

  const startRename = () => { setMenuOpen(false); setRenameName(page.name); setRenaming(true); };

  const saveRename = async () => {
    if (!renameName.trim() || renameName === page.name) { setRenaming(false); return; }
    setRenameSaving(true);
    try {
      await api.update(page.id, { name: renameName.trim() });
      onRefresh();
    } catch {
      // silently revert on next refresh
    } finally {
      setRenameSaving(false);
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm(`"${page.name}" verwijderen?`)) return;
    try {
      await api.delete(page.id);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verwijderen mislukt');
    }
  };

  return (
    <div ref={setNodeRef} style={dragStyle} className="select-none">
      <div
        className={`group relative flex items-center gap-1 py-1 px-1 cursor-pointer rounded-lg transition-colors duration-100 ${
          isSelected ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700 hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
        onClick={() => !renaming && onSelectPage(page)}
      >
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 touch-none p-0.5"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3" />
        </span>

        {/* Expand toggle */}
        <button
          onClick={e => { e.stopPropagation(); if (hasChildren) setExpanded(v => !v); }}
          className="p-0.5 rounded hover:bg-black/5 shrink-0"
          tabIndex={-1}
        >
          {hasChildren
            ? expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            : <span className="w-3.5 h-3.5 block" />
          }
        </button>

        {/* Icon */}
        {hasChildren
          ? expanded
            ? <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            : <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
          : <FileText className="w-4 h-4 text-gray-400 shrink-0" />
        }

        {/* Name / rename */}
        {renaming ? (
          <input
            autoFocus
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenaming(false); }}
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
            <button onClick={() => setShowCreate(true)} className="p-1 rounded hover:bg-black/10 text-gray-400 hover:text-indigo-600" title="Subpagina aanmaken">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setMenuOpen(v => !v)} className="p-1 rounded hover:bg-black/10 text-gray-400 hover:text-gray-700" title="Meer opties">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Context menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40">
            <button onClick={startRename} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Edit3 className="w-3.5 h-3.5 text-gray-400" /> Hernoemen
            </button>
            <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" /> Verwijderen
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <SiblingGroup
          pages={page.children}
          selectedPageId={selectedPageId}
          onSelectPage={onSelectPage}
          allPages={allPages}
          onRefresh={onRefresh}
          api={api}
          depth={depth + 1}
        />
      )}

      {showCreate && (
        <CreatePageModal
          allPages={allPages}
          defaultParentId={page.id}
          createFn={api.create}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); setExpanded(true); onRefresh(id); }}
        />
      )}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

interface PageTreeProps {
  pages: PageNode[];
  selectedPageId: string | null;
  onSelectPage: (page: PageNode) => void;
  allPages: PlanePage[];
  onRefresh: (selectId?: string) => void;
  api: WikiApi;
}

export function PageTree({ pages, selectedPageId, onSelectPage, allPages, onRefresh, api }: PageTreeProps) {
  return (
    <div className="py-1">
      <SiblingGroup
        pages={pages}
        selectedPageId={selectedPageId}
        onSelectPage={onSelectPage}
        allPages={allPages}
        onRefresh={onRefresh}
        api={api}
        depth={0}
      />
    </div>
  );
}
