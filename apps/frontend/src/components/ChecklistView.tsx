import React, { useState } from 'react';
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
  PlayCircle,
  Archive,
  ListTodo,
  Calendar
} from 'lucide-react';
import { TaskAPI } from '../services/api';

interface ChecklistViewProps {
  tasks: ITask[];
  onRefresh: () => void;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  tasks,
  onRefresh,
  showCreateModal,
  onCloseCreateModal
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Modal states
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
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
        month: '2-digit',
        year: 'numeric'
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

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskStatus('TODO');
    setTaskDueDate('');
    setTaskTags('');
    setTaskSubItems(['']);
    setIsLocalModalOpen(true);
  };

  // Quick Task Status update
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus, e?: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
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

      // Auto-set to ARCHIVED if user enters an overdue deadline and status was TODO/IN_PROGRESS
      let finalStatus = taskStatus;
      if (parsedDueDate && new Date(parsedDueDate).getTime() < Date.now() && (finalStatus === 'TODO' || finalStatus === 'IN_PROGRESS')) {
        finalStatus = 'ARCHIVED';
      }

      if (editingTask) {
        const taskId = editingTask.id || editingTask._id;
        if (!taskId) throw new Error('Không tìm thấy ID task');

        // Preserve existing subtask completion states if titles match
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

  const effectiveStatus = (task: ITask): TaskStatus => {
    if (task.status === 'COMPLETED') return 'COMPLETED';
    if (isTaskOverdue(task)) return 'ARCHIVED';
    return task.status || 'TODO';
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'ALL') return true;
    const effStatus = effectiveStatus(task);
    return effStatus === filterStatus;
  });

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return <span className="badge badge-urgent">Gấp (Urgent)</span>;
      case 'HIGH': return <span className="badge badge-high">Cao (High)</span>;
      case 'MEDIUM': return <span className="badge badge-medium">Trung bình</span>;
      default: return <span className="badge badge-low">Thấp (Low)</span>;
    }
  };

  const getStatusColor = (status?: TaskStatus) => {
    switch (status) {
      case 'IN_PROGRESS': return '#f59e0b';
      case 'COMPLETED': return '#10b981';
      case 'ARCHIVED': return '#94a3b8';
      case 'TODO':
      default: return '#818cf8';
    }
  };

  const getStatusBg = (status?: TaskStatus) => {
    switch (status) {
      case 'IN_PROGRESS': return 'rgba(245, 158, 11, 0.15)';
      case 'COMPLETED': return 'rgba(16, 185, 129, 0.15)';
      case 'ARCHIVED': return 'rgba(148, 163, 184, 0.15)';
      case 'TODO':
      default: return 'rgba(99, 102, 241, 0.15)';
    }
  };

  const getStatusBorder = (status?: TaskStatus) => {
    switch (status) {
      case 'IN_PROGRESS': return '1px solid rgba(245, 158, 11, 0.35)';
      case 'COMPLETED': return '1px solid rgba(16, 185, 129, 0.35)';
      case 'ARCHIVED': return '1px solid rgba(148, 163, 184, 0.35)';
      case 'TODO':
      default: return '1px solid rgba(99, 102, 241, 0.35)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListTodo size={24} style={{ color: 'var(--accent-primary)' }} />
            Danh Sách Checklist & Sub-tasks
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Quản lý tiến độ, thời hạn deadline và trạng thái công việc
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Filter Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '0.35rem', 
            background: 'rgba(0,0,0,0.3)', 
            padding: '4px', 
            borderRadius: 'var(--radius-md)',
            overflowX: 'auto',
            maxWidth: '100%'
          }}>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'TODO', label: '📋 Cần làm' },
              { id: 'IN_PROGRESS', label: '⚡ Đang làm' },
              { id: 'COMPLETED', label: '✅ Đã xong' },
              { id: 'ARCHIVED', label: '📦 Lưu trữ / Quá hạn' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: filterStatus === tab.id ? 'var(--accent-primary)' : 'transparent',
                  color: filterStatus === tab.id ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', whiteSpace: 'nowrap' }}
          >
            <Plus size={15} /> Thêm Task
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredTasks.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ marginBottom: '0.75rem' }}>Chưa có task nào trong danh mục này.</p>
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
            >
              <Plus size={14} /> Tạo task mới ngay
            </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const taskId = task.id || task._id || '';
            const checklist = task.checklist || [];
            const completedCount = checklist.filter(c => c.completed).length;
            const isCompleted = task.status === 'COMPLETED';
            const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : (isCompleted ? 100 : 0);
            const isExpanded = expandedTaskIds[taskId] ?? true;
            const isOverdue = isTaskOverdue(task);
            const effStatus = effectiveStatus(task);

            return (
              <div 
                key={taskId} 
                className="glass-card" 
                style={{ 
                  padding: '1.25rem', 
                  position: 'relative',
                  borderLeft: `4px solid ${isOverdue ? '#ef4444' : getStatusColor(task.status)}`,
                  opacity: isCompleted ? 0.85 : (isOverdue ? 0.9 : 1),
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  {/* Left: Quick Completion Checkbox & Task Information */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    {/* Main Task Checkbox Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleMainTaskComplete(task, e)}
                      className="btn-icon"
                      style={{ 
                        padding: '2px', 
                        marginTop: '2px', 
                        color: isCompleted ? 'var(--accent-success)' : 'var(--text-dim)',
                        flexShrink: 0
                      }}
                      title={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                    >
                      {isCompleted ? <CheckSquare size={22} color="var(--accent-success)" /> : <Square size={22} />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Priority, Status Selector, and Badges Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        {getPriorityBadge(task.priority)}

                        {/* Interactive Status Selector Dropdown (Clean, robust, no background glitches) */}
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                          <select
                            value={effStatus}
                            onChange={(e) => handleUpdateStatus(taskId, e.target.value as TaskStatus, e)}
                            style={{
                              padding: '2px 24px 2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : getStatusBorder(task.status),
                              background: isOverdue ? 'rgba(239, 68, 68, 0.15)' : getStatusBg(task.status),
                              color: isOverdue ? '#f87171' : getStatusColor(task.status),
                              outline: 'none',
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              MozAppearance: 'none'
                            }}
                            title="Nhấn để đổi trạng thái công việc"
                          >
                            <option value="TODO" style={{ background: '#0f172a', color: '#818cf8' }}>📋 Cần làm (TODO)</option>
                            <option value="IN_PROGRESS" style={{ background: '#0f172a', color: '#f59e0b' }}>⚡ Đang làm (IN_PROGRESS)</option>
                            <option value="COMPLETED" style={{ background: '#0f172a', color: '#10b981' }}>✅ Đã xong (COMPLETED)</option>
                            <option value="ARCHIVED" style={{ background: '#0f172a', color: '#94a3b8' }}>📦 Lưu trữ (ARCHIVED)</option>
                          </select>
                          <ChevronDown 
                            size={12} 
                            style={{ 
                              position: 'absolute', 
                              right: '6px', 
                              pointerEvents: 'none', 
                              color: isOverdue ? '#f87171' : getStatusColor(task.status) 
                            }} 
                          />
                        </div>

                        {/* Overdue Warning Badge */}
                        {isOverdue && (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <AlertTriangle size={11} /> Đã quá hạn
                          </span>
                        )}
                      </div>

                      <h3 style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: 600, 
                        color: isCompleted ? 'rgba(255, 255, 255, 0.65)' : '#fff', 
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        wordBreak: 'break-word',
                        marginBottom: task.description ? '0.35rem' : '0.5rem'
                      }}>
                        {task.title}
                      </h3>

                      {task.description && (
                        <p style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-muted)', 
                          marginBottom: '0.65rem', 
                          wordBreak: 'break-word',
                          lineHeight: '1.4'
                        }}>
                          {task.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {/* Deadline badge */}
                        {task.dueDate && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: isOverdue ? '#f87171' : 'var(--text-muted)',
                            border: isOverdue ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)'
                          }}>
                            <Calendar size={12} style={{ color: isOverdue ? '#ef4444' : '#818cf8' }} />
                            <span>{isOverdue ? 'Hạn chót (Đã quá): ' : 'Hạn chót: '}{formatDisplayDateTime(task.dueDate)}</span>
                          </span>
                        )}

                        {(task.tags || []).map((tag, i) => (
                          <span key={i} className="tag-pill">
                            <Tag size={12} /> {tag}
                          </span>
                        ))}

                        {task.estimatedMinutes && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={13} /> {task.estimatedMinutes} phút
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => handleOpenEditModal(task, e)}
                      title="Chỉnh sửa task"
                    >
                      <Edit3 size={17} />
                    </button>
                    <button 
                      className="btn-icon" 
                      style={{ color: 'var(--accent-danger)' }} 
                      onClick={(e) => promptDeleteTask(task, e)}
                      title="Xóa task"
                    >
                      <Trash2 size={17} />
                    </button>
                    {checklist.length > 0 && (
                      <button 
                        className="btn-icon" 
                        onClick={() => toggleExpand(taskId)}
                        title={isExpanded ? 'Thu gọn sub-tasks' : 'Mở rộng sub-tasks'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Sub-tasks section */}
                {checklist.length > 0 && isExpanded && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      <span>Tiến độ sub-tasks</span>
                      <span style={{ fontWeight: 600, color: progressPercent === 100 ? 'var(--accent-success)' : '#fff' }}>
                        {completedCount} / {checklist.length} ({progressPercent}%)
                      </span>
                    </div>
                    <div className="progress-container" style={{ marginBottom: '0.85rem' }}>
                      <div className="progress-fill" style={{ width: `${progressPercent}%`, background: progressPercent === 100 ? 'var(--accent-success)' : undefined }} />
                    </div>

                    {/* Sub-items list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {checklist.map(subItem => (
                        <div
                          key={subItem.id}
                          onClick={(e) => handleToggleSubTask(taskId, subItem.id, e)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.55rem 0.75rem',
                            background: subItem.completed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: subItem.completed ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(255, 255, 255, 0.03)'
                          }}
                        >
                          {subItem.completed ? (
                            <CheckSquare size={17} color="var(--accent-success)" style={{ flexShrink: 0 }} />
                          ) : (
                            <Square size={17} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                          )}
                          <span style={{
                            fontSize: '0.85rem',
                            color: subItem.completed ? 'var(--text-dim)' : 'var(--text-main)',
                            textDecoration: subItem.completed ? 'line-through' : 'none',
                            wordBreak: 'break-word'
                          }}>
                            {subItem.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

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
                  background: editingTask ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  border: `1px solid ${editingTask ? 'rgba(245, 158, 11, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: editingTask ? '#f59e0b' : '#818cf8'
                }}>
                  {editingTask ? <Edit3 size={18} /> : <Plus size={18} />}
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700, margin: 0 }}>
                  {editingTask ? 'Chỉnh Sửa Checklist Task' : 'Tạo Checklist Task Mới'}
                </h3>
              </div>

              <button onClick={handleCloseModal} className="btn-icon" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tên công việc *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Xây dựng Monorepo với Express API"
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
                  placeholder="Nội dung và mục tiêu cần thực hiện..."
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                />
              </div>

              {/* Status & Priority Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Trạng thái công việc
                  </label>
                  <select
                    className="form-input"
                    value={taskStatus}
                    onChange={e => setTaskStatus(e.target.value as TaskStatus)}
                  >
                    <option value="TODO">📋 Cần làm (TODO)</option>
                    <option value="IN_PROGRESS">⚡ Đang làm (IN_PROGRESS)</option>
                    <option value="COMPLETED">✅ Đã xong (COMPLETED)</option>
                    <option value="ARCHIVED">📦 Lưu trữ (ARCHIVED)</option>
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
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="HIGH">Cao (High)</option>
                    <option value="URGENT">Khẩn cấp (Urgent)</option>
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
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '3px', display: 'block' }}>
                  💡 Nếu công việc quá hạn chót mà chưa hoàn thành, hệ thống sẽ tự động chuyển vào mục <strong>Lưu trữ (Archived)</strong>.
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tags (phân cách dấu phẩy)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Học tập, Dự án, Công việc"
                  value={taskTags}
                  onChange={e => setTaskTags(e.target.value)}
                />
              </div>

              {/* Sub-tasks checklist */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Danh sách Sub-tasks (Checklist Items)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {taskSubItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder={`Bước ${idx + 1}...`}
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
                    <Plus size={14} /> Thêm Sub-item
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {editingTask ? (
                  <button
                    type="button"
                    className="btn"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
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
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '0.6rem' }}>
              Xác nhận xóa Checklist Task?
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa task <strong style={{ color: '#fff' }}>"{deleteTargetTask.title}"</strong>? Hành động này không thể hoàn tác.
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
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  fontWeight: 600,
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
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
