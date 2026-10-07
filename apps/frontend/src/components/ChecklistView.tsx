import React, { useState, useMemo } from 'react';
import { ITask, Priority, TaskStatus } from '@mychecklist/shared';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus, 
  Clock, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Edit3,
  X,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Calendar,
  LayoutGrid,
  Search,
  Filter,
  MoreHorizontal,
  Flame,
  ArrowUp,
  ArrowDown,
  Equal
} from 'lucide-react';
import { TaskAPI } from '../services/api';

interface ChecklistViewProps {
  tasks: ITask[];
  onRefresh: () => void;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
}

type ViewMode = 'board' | 'list';

interface KanbanColumnConfig {
  id: TaskStatus;
  title: string;
  badgeColor: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: 'TODO', title: 'To Do', badgeColor: '#15803d' },
  { id: 'IN_PROGRESS', title: 'In Progress', badgeColor: '#d97706' },
  { id: 'ARCHIVED', title: 'Lưu trữ (Archived)', badgeColor: '#64748b' },
  { id: 'COMPLETED', title: 'Done', badgeColor: '#16a34a' }
];

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  tasks,
  onRefresh,
  showCreateModal,
  onCloseCreateModal
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Modal states
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const [defaultCreateStatus, setDefaultCreateStatus] = useState<TaskStatus>('TODO');
  const isModalVisible = showCreateModal || isLocalModalOpen;

  // Custom Delete Confirm Popup State
  const [deleteTargetTask, setDeleteTargetTask] = useState<ITask | null>(null);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('MEDIUM');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('TODO');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskTags, setTaskTags] = useState('');
  const [taskSubItems, setTaskSubItems] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date format helpers
  const formatForDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const pad = (n: number) => String(n).padStart(2, '0');
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const h = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${y}-${m}-${day}T${h}:${min}`;
    } catch {
      return '';
    }
  };

  const formatDisplayDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const isTaskOverdue = (task: ITask) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    try {
      return new Date(task.dueDate).getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const getDeadlineUrgency = (task: ITask): 'OVERDUE' | 'DUE_SOON' | 'NORMAL' | 'NONE' => {
    if (!task.dueDate || task.status === 'COMPLETED') return 'NONE';
    try {
      const dueTime = new Date(task.dueDate).getTime();
      const diffMs = dueTime - Date.now();
      if (diffMs < 0) return 'OVERDUE';
      if (diffMs <= 24 * 60 * 60 * 1000) return 'DUE_SOON';
      return 'NORMAL';
    } catch {
      return 'NONE';
    }
  };

  const formatRemainingTime = (dueDate: string): string => {
    try {
      const diffMs = new Date(dueDate).getTime() - Date.now();
      if (diffMs <= 0) return 'Đã quá hạn';
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours === 0) return `Còn ${minutes}p`;
      if (hours < 24) return `Còn ${hours}h ${minutes}p`;
      const days = Math.floor(hours / 24);
      return `Còn ${days}d`;
    } catch {
      return '';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCloseModal = () => {
    setIsLocalModalOpen(false);
    setEditingTask(null);
    onCloseCreateModal();
  };

  const handleOpenEditModal = (task: ITask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setTaskTitle(task.title || '');
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority || 'MEDIUM');
    setTaskStatus(task.status || 'TODO');
    setTaskDueDate(task.dueDate ? formatForDateTimeLocal(task.dueDate) : '');
    setTaskTags((task.tags || []).join(', '));
    const subs = (task.checklist || []).map(c => c.title);
    setTaskSubItems(subs.length > 0 ? subs : ['']);
    setIsLocalModalOpen(true);
  };

  const handleOpenCreateModal = (initialStatus: TaskStatus = 'TODO') => {
    setEditingTask(null);
    setDefaultCreateStatus(initialStatus);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskStatus(initialStatus);
    setTaskDueDate('');
    setTaskTags('');
    setTaskSubItems(['']);
    setIsLocalModalOpen(true);
  };

  // Quick Task Status update
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await TaskAPI.update(taskId, { status: newStatus });
      onRefresh();
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      alert(`Lỗi cập nhật trạng thái: ${err.message}`);
    }
  };

  // Quick toggle main task complete
  const handleToggleMainTaskComplete = async (task: ITask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const taskId = task.id || task._id;
    if (!taskId) return;
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    await handleUpdateStatus(taskId, newStatus);
  };

  // Toggle sub-task
  const handleToggleSubTask = async (taskId: string, subId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await TaskAPI.toggleSubTask(taskId, subId);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  // Prompt delete modal
  const promptDeleteTask = (task: ITask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTargetTask(task);
  };

  // Confirm delete
  const confirmDeleteTask = async () => {
    if (!deleteTargetTask) return;
    const taskId = deleteTargetTask.id || deleteTargetTask._id;
    if (!taskId) return;

    try {
      await TaskAPI.delete(taskId);
      if (editingTask && (editingTask.id === taskId || editingTask._id === taskId)) {
        handleCloseModal();
      }
      setDeleteTargetTask(null);
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi xóa task: ${err.message}`);
    }
  };

  const handleAddSubItemInput = () => {
    setTaskSubItems(prev => [...prev, '']);
  };

  const handleRemoveSubItemInput = (index: number) => {
    setTaskSubItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubItemChange = (index: number, val: string) => {
    const updated = [...taskSubItems];
    updated[index] = val;
    setTaskSubItems(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const checklist = taskSubItems
        .filter(item => item.trim().length > 0)
        .map(title => ({ title, completed: false }));

      const tags = taskTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const parsedDueDate = taskDueDate ? new Date(taskDueDate).toISOString() : undefined;

      let finalStatus = taskStatus;
      if (parsedDueDate && new Date(parsedDueDate).getTime() < Date.now() && (finalStatus === 'TODO' || finalStatus === 'IN_PROGRESS')) {
        finalStatus = 'ARCHIVED';
      }

      if (editingTask) {
        const taskId = editingTask.id || editingTask._id;
        if (!taskId) throw new Error('Không tìm thấy ID task');

        const existingChecklist = editingTask.checklist || [];
        const mergedChecklist = taskSubItems
          .filter(item => item.trim().length > 0)
          .map(title => {
            const matched = existingChecklist.find(c => c.title.trim().toLowerCase() === title.trim().toLowerCase());
            return {
              title: title.trim(),
              completed: matched ? matched.completed : false
            };
          });

        await TaskAPI.update(taskId, {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          priority: taskPriority,
          status: finalStatus,
          dueDate: parsedDueDate,
          tags,
          checklist: mergedChecklist
        });
      } else {
        await TaskAPI.create({
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          priority: taskPriority,
          status: finalStatus,
          dueDate: parsedDueDate,
          tags,
          checklist
        });
      }

      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi lưu task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (taskId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (columnStatus: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnStatus) {
      setDragOverColumn(columnStatus);
    }
  };

  const handleDragLeave = (columnStatus: TaskStatus, e: React.DragEvent) => {
    // Only reset if leaving the column container entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === columnStatus) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (columnStatus: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find(t => (t.id === taskId || t._id === taskId));
    if (!task || task.status === columnStatus) return;

    // Optimistically update & trigger API call
    await handleUpdateStatus(taskId, columnStatus);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  // Extract unique tags for filter
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => (t.tags || []).forEach(tag => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  // Filter tasks based on search, priority, tag
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (task.title || '').toLowerCase().includes(q);
        const matchDesc = (task.description || '').toLowerCase().includes(q);
        const matchTags = (task.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }

      // Priority filter
      if (selectedPriorityFilter !== 'ALL' && task.priority !== selectedPriorityFilter) {
        return false;
      }

      // Tag filter
      if (selectedTagFilter !== 'ALL' && !(task.tags || []).includes(selectedTagFilter)) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedPriorityFilter, selectedTagFilter]);

  // Group tasks by status for Kanban Board
  const columnsData = useMemo(() => {
    const map: Record<TaskStatus, ITask[]> = {
      TODO: [],
      IN_PROGRESS: [],
      ARCHIVED: [],
      COMPLETED: []
    };

    filteredTasks.forEach(task => {
      let st: TaskStatus = task.status || 'TODO';
      if (!map[st]) st = 'TODO';
      map[st].push(task);
    });

    return map;
  }, [filteredTasks]);

  // Render priority icon (like Jira/Linear: =, ↑, ⚡)
  const renderPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return <span title="Khẩn cấp (Urgent)" style={{ display: 'inline-flex', alignItems: 'center' }}><Flame size={14} style={{ color: '#ef4444' }} /></span>;
      case 'HIGH':
        return <span title="Cao (High)" style={{ display: 'inline-flex', alignItems: 'center' }}><ArrowUp size={14} style={{ color: '#f97316' }} /></span>;
      case 'MEDIUM':
        return <span title="Trung bình (Medium)" style={{ display: 'inline-flex', alignItems: 'center' }}><Equal size={14} style={{ color: '#d97706' }} /></span>;
      case 'LOW':
      default:
        return <span title="Thấp (Low)" style={{ display: 'inline-flex', alignItems: 'center' }}><ArrowDown size={14} style={{ color: '#64748b' }} /></span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 'calc(100vh - 120px)' }}>
      {/* Top Toolbar: Jira/Linear style header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem',
        background: '#ffffff',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Left: Search & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '999px',
            padding: '0.4rem 0.9rem',
            minWidth: '220px',
            maxWidth: '320px',
            flex: 1
          }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search board..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdown Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: selectedPriorityFilter !== 'ALL' || selectedTagFilter !== 'ALL' ? 'rgba(21, 128, 61, 0.12)' : 'var(--bg-secondary)',
                border: `1px solid ${selectedPriorityFilter !== 'ALL' || selectedTagFilter !== 'ALL' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                color: selectedPriorityFilter !== 'ALL' || selectedTagFilter !== 'ALL' ? 'var(--accent-primary)' : 'var(--text-main)',
                padding: '0.42rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Filter size={14} />
              <span>Filter</span>
              <ChevronDown size={13} />
            </button>

            {showFilterDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '6px',
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  minWidth: '220px',
                  zIndex: 40,
                  boxShadow: 'var(--shadow-popover)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Ưu tiên (Priority)
                  </label>
                  <select
                    value={selectedPriorityFilter}
                    onChange={e => setSelectedPriorityFilter(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                  >
                    <option value="ALL">Tất cả mức độ</option>
                    <option value="URGENT">🔥 Khẩn cấp (Urgent)</option>
                    <option value="HIGH">↑ Cao (High)</option>
                    <option value="MEDIUM">= Trung bình (Medium)</option>
                    <option value="LOW">↓ Thấp (Low)</option>
                  </select>
                </div>

                {allTags.length > 0 && (
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Nhãn (Tag)
                    </label>
                    <select
                      value={selectedTagFilter}
                      onChange={e => setSelectedTagFilter(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                    >
                      <option value="ALL">Tất cả nhãn</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPriorityFilter('ALL');
                      setSelectedTagFilter('ALL');
                      setShowFilterDropdown(false);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: View Mode Toggle & Primary Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'board' ? '#ffffff' : 'transparent',
                color: viewMode === 'board' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'board' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
              title="Kanban Board View"
            >
              <LayoutGrid size={14} />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'list' ? '#ffffff' : 'transparent',
                color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
              title="List View"
            >
              <ListTodo size={14} />
              <span>List</span>
            </button>
          </div>

          {/* Primary Create Button */}
          <button
            onClick={() => handleOpenCreateModal('TODO')}
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Tạo Task</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. KANBAN BOARD VIEW (Drag & Drop Supported) */}
      {/* ========================================================================= */}
      {viewMode === 'board' ? (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '1rem',
            alignItems: 'flex-start'
          }}
        >
          {KANBAN_COLUMNS.map((column) => {
            const colTasks = columnsData[column.id] || [];
            const isDragOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(column.id, e)}
                onDragLeave={(e) => handleDragLeave(column.id, e)}
                onDrop={(e) => handleDrop(column.id, e)}
                style={{
                  background: isDragOver ? 'rgba(21, 128, 61, 0.08)' : '#f4f7f5',
                  border: isDragOver ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  minHeight: '520px',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box'
                }}
              >
                {/* Column Header: Title & Task Count */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.2rem 0.35rem',
                  marginBottom: '0.2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <h3 style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      margin: 0
                    }}>
                      {column.title}
                    </h3>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      background: 'rgba(0,0,0,0.05)',
                      padding: '1px 6px',
                      borderRadius: '999px'
                    }}>
                      {colTasks.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal(column.id)}
                    className="btn-icon"
                    title={`Thêm task vào ${column.title}`}
                    style={{ padding: '3px', color: 'var(--text-muted)' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Quick Add Dashed Button (Top of column, matching Jira screenshot) */}
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(column.id)}
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: '8px',
                    border: '1.5px dashed var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                    e.currentTarget.style.background = 'rgba(21, 128, 61, 0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Plus size={15} />
                </button>

                {/* Column Task Cards Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                  {colTasks.map((task, idx) => {
                    const taskId = task.id || task._id || '';
                    const checklist = task.checklist || [];
                    const completedCount = checklist.filter(c => c.completed).length;
                    const isCompleted = task.status === 'COMPLETED';
                    const isOverdue = isTaskOverdue(task);
                    const urgency = getDeadlineUrgency(task);
                    const isDueSoon = urgency === 'DUE_SOON';
                    const isBeingDragged = draggedTaskId === taskId;
                    const isExpanded = expandedTaskIds[taskId] ?? false;

                    return (
                      <div
                        key={taskId}
                        draggable
                        onDragStart={(e) => handleDragStart(taskId, e)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleOpenEditModal(task)}
                        style={{
                          background: '#ffffff',
                          borderRadius: '8px',
                          border: isDueSoon
                            ? '1px solid rgba(217, 119, 6, 0.4)'
                            : isOverdue
                              ? '1px solid rgba(220, 38, 38, 0.4)'
                              : '1px solid var(--border-color)',
                          boxShadow: isBeingDragged 
                            ? '0 12px 28px rgba(0,0,0,0.15)' 
                            : '0 1px 3px rgba(0,0,0,0.06)',
                          padding: '0.85rem 0.95rem',
                          cursor: 'grab',
                          opacity: isBeingDragged ? 0.45 : 1,
                          transform: isBeingDragged ? 'scale(1.02)' : 'none',
                          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem'
                        }}
                        onMouseEnter={e => {
                          if (!isBeingDragged) {
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(20, 83, 45, 0.1)';
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isBeingDragged) {
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                            e.currentTarget.style.borderColor = isDueSoon 
                              ? 'rgba(217, 119, 6, 0.4)' 
                              : isOverdue 
                                ? 'rgba(220, 38, 38, 0.4)' 
                                : 'var(--border-color)';
                          }
                        }}
                      >
                        {/* Tags Pill Row */}
                        {(task.tags && task.tags.length > 0) && (
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {task.tags.map((tag, tIdx) => (
                              <span 
                                key={tIdx} 
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(21, 128, 61, 0.08)',
                                  color: 'var(--accent-primary)',
                                  fontWeight: 600
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Title (Multi-line Jira Style) */}
                        <div style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: isCompleted ? 'var(--text-dim)' : 'var(--text-main)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          lineHeight: 1.4,
                          wordBreak: 'break-word'
                        }}>
                          {task.title}
                        </div>

                        {/* Description snippet if present */}
                        {task.description && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.35,
                            maxHeight: '2.7em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {task.description}
                          </div>
                        )}

                        {/* Deadline badge if present */}
                        {task.dueDate && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.72rem',
                            fontWeight: isOverdue || isDueSoon ? 700 : 500,
                            color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : 'var(--text-muted)'
                          }}>
                            <Clock size={11} />
                            <span>{formatDisplayDateTime(task.dueDate)}</span>
                            {isDueSoon && <span>({formatRemainingTime(task.dueDate)})</span>}
                          </div>
                        )}

                        {/* Subtasks summary bar if has subtasks */}
                        {checklist.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                              <span>Subtasks</span>
                              <span>{completedCount}/{checklist.length}</span>
                            </div>
                            <div className="progress-container" style={{ height: '4px' }}>
                              <div 
                                className="progress-fill" 
                                style={{ 
                                  width: `${Math.round((completedCount / checklist.length) * 100)}%`,
                                  background: completedCount === checklist.length ? 'var(--accent-success)' : 'var(--accent-primary)'
                                }} 
                              />
                            </div>
                          </div>
                        )}

                        {/* Bottom Row (Checkbox, Subtasks count, Priority) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '0.45rem',
                          borderTop: '1px solid rgba(0,0,0,0.05)',
                          fontSize: '0.75rem'
                        }}>
                          {/* Left: Checkbox Button */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={(e) => handleToggleMainTaskComplete(task, e)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: isCompleted ? 'var(--accent-success)' : 'var(--accent-primary)' }}
                              title={isCompleted ? 'Hoàn thành' : 'Đánh dấu hoàn thành'}
                            >
                              {isCompleted ? <CheckSquare size={16} color="var(--accent-success)" /> : <Square size={16} color="#94a3b8" />}
                            </button>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isCompleted ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                              {isCompleted ? 'Xong' : 'Chưa xong'}
                            </span>
                          </div>

                          {/* Right: Story Points / Subtasks + Priority Icon */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            {/* Checklist count / Story point badge */}
                            {checklist.length > 0 && (
                              <span 
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: 'var(--text-muted)',
                                  background: 'rgba(0,0,0,0.05)',
                                  padding: '1px 5px',
                                  borderRadius: '4px'
                                }}
                                title={`${completedCount} trên ${checklist.length} sub-tasks đã xong`}
                              >
                                {checklist.length}
                              </span>
                            )}

                            {/* Priority Icon (= / ↑ / ⚡) */}
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {renderPriorityIcon(task.priority)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. LIST VIEW (Alternative view mode) */
        /* ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredTasks.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ marginBottom: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>Không tìm thấy công việc phù hợp.</p>
              <button onClick={() => handleOpenCreateModal('TODO')} className="btn btn-primary">
                <Plus size={15} /> Tạo task mới ngay
              </button>
            </div>
          ) : (
            filteredTasks.map((task, idx) => {
              const taskId = task.id || task._id || '';
              const checklist = task.checklist || [];
              const completedCount = checklist.filter(c => c.completed).length;
              const isCompleted = task.status === 'COMPLETED';
              const isExpanded = expandedTaskIds[taskId] ?? false;
              const isOverdue = isTaskOverdue(task);
              const urgency = getDeadlineUrgency(task);
              const isDueSoon = urgency === 'DUE_SOON';

              return (
                <div
                  key={taskId}
                  className="glass-card"
                  style={{
                    padding: '1rem 1.25rem',
                    borderLeft: `4px solid ${isCompleted ? '#16a34a' : isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#15803d'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleMainTaskComplete(task, e)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
                      >
                        {isCompleted ? <CheckSquare size={20} color="var(--accent-success)" /> : <Square size={20} color="#64748b" />}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(21, 128, 61, 0.1)',
                            color: 'var(--accent-primary)',
                            fontWeight: 700
                          }}>
                            {task.status}
                          </span>
                        </div>
                        <h4 style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: isCompleted ? 'var(--text-dim)' : 'var(--text-main)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          margin: 0
                        }}>
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={(e) => handleOpenEditModal(task, e)} className="btn-icon">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={(e) => promptDeleteTask(task, e)} className="btn-icon" style={{ color: 'var(--accent-danger)' }}>
                        <Trash2 size={16} />
                      </button>
                      {checklist.length > 0 && (
                        <button onClick={() => toggleExpand(taskId)} className="btn-icon">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-items in list view */}
                  {checklist.length > 0 && isExpanded && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {checklist.map(sub => (
                        <div
                          key={sub.id}
                          onClick={(e) => handleToggleSubTask(taskId, sub.id, e)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 0.6rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.825rem'
                          }}
                        >
                          {sub.completed ? <CheckSquare size={15} color="var(--accent-success)" /> : <Square size={15} color="#64748b" />}
                          <span style={{ textDecoration: sub.completed ? 'line-through' : 'none', color: sub.completed ? 'var(--text-dim)' : 'var(--text-main)' }}>
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {isModalVisible && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: editingTask ? 'rgba(217, 119, 6, 0.12)' : 'rgba(21, 128, 61, 0.12)',
                  border: `1px solid ${editingTask ? 'rgba(217, 119, 6, 0.25)' : 'rgba(21, 128, 61, 0.25)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: editingTask ? '#b45309' : '#15803d'
                }}>
                  {editingTask ? <Edit3 size={18} /> : <Plus size={18} />}
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 800, margin: 0 }}>
                  {editingTask ? 'Chỉnh Sửa Task' : 'Tạo Task Mới'}
                </h3>
              </div>

              <button onClick={handleCloseModal} className="btn-icon" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tên công việc / Issue Title *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: feat(Course): separate Zoom room creation..."
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Mô tả chi tiết
                </label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '65px', resize: 'vertical' }}
                  placeholder="Nội dung, tiêu chí nghiệm thu (Acceptance criteria)..."
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                />
              </div>

              {/* Status & Priority Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Trạng thái (Column)
                  </label>
                  <select
                    className="form-input"
                    value={taskStatus}
                    onChange={e => setTaskStatus(e.target.value as TaskStatus)}
                  >
                    <option value="TODO">📋 To Do</option>
                    <option value="IN_PROGRESS">⚡ In Progress</option>
                    <option value="ARCHIVED">📦 Lưu trữ (Archived)</option>
                    <option value="COMPLETED">✅ Done</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Mức độ ưu tiên
                  </label>
                  <select
                    className="form-input"
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as Priority)}
                  >
                    <option value="LOW">↓ Thấp (Low)</option>
                    <option value="MEDIUM">= Trung bình (Medium)</option>
                    <option value="HIGH">↑ Cao (High)</option>
                    <option value="URGENT">⚡ Khẩn cấp (Urgent)</option>
                  </select>
                </div>
              </div>

              {/* Deadline (Hạn chót) */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  📅 Hạn chót (Deadline)
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tags / Component (phân cách dấu phẩy)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Course, Zoom, Backend, Frontend"
                  value={taskTags}
                  onChange={e => setTaskTags(e.target.value)}
                />
              </div>

              {/* Sub-tasks checklist */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Sub-tasks / Checklist Items
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {taskSubItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder={`Sub-task ${idx + 1}...`}
                        value={item}
                        onChange={e => handleSubItemChange(idx, e.target.value)}
                      />
                      {taskSubItems.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: 'var(--text-dim)', padding: '4px' }}
                          onClick={() => handleRemoveSubItemInput(idx)}
                          title="Xóa bước này"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', alignSelf: 'flex-start', marginTop: '0.2rem' }}
                    onClick={handleAddSubItemInput}
                  >
                    <Plus size={14} /> Thêm Sub-task
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                {editingTask ? (
                  <button
                    type="button"
                    className="btn"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#dc2626',
                      fontSize: '0.825rem'
                    }}
                    onClick={() => promptDeleteTask(editingTask)}
                  >
                    <Trash2 size={14} /> Xóa task
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : (editingTask ? 'Cập Nhật Task' : 'Lưu Task Mới')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deleteTargetTask && (
        <div className="modal-overlay" onClick={() => setDeleteTargetTask(null)} style={{ zIndex: 1100 }}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '430px',
              textAlign: 'center',
              padding: '1.75rem',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              boxShadow: 'var(--shadow-popover)'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(220, 38, 38, 0.12)',
              border: '2px solid rgba(220, 38, 38, 0.25)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '0.6rem' }}>
              Xác nhận xóa Task?
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa task <strong style={{ color: 'var(--text-main)' }}>"{deleteTargetTask.title}"</strong>? Hành động này không thể hoàn tác.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minWidth: '110px' }}
                onClick={() => setDeleteTargetTask(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{
                  minWidth: '130px',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#fff',
                  fontWeight: 600,
                  boxShadow: '0 0 15px rgba(220, 38, 38, 0.3)'
                }}
                onClick={confirmDeleteTask}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
