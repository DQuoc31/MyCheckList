import React, { useState } from 'react';
import { ITask, Priority, TaskStatus } from '@mychecklist/shared';
import { CheckSquare, Square, Trash2, Plus, Clock, Tag, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
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

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [newTags, setNewTags] = useState('');
  const [newSubItems, setNewSubItems] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedTaskIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleSubTask = async (taskId: string, subId: string) => {
    try {
      await TaskAPI.toggleSubTask(taskId, subId);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa task này?')) return;
    try {
      await TaskAPI.delete(taskId);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleAddSubItemInput = () => {
    setNewSubItems(prev => [...prev, '']);
  };

  const handleSubItemChange = (index: number, val: string) => {
    const updated = [...newSubItems];
    updated[index] = val;
    setNewSubItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const checklist = newSubItems
        .filter(item => item.trim().length > 0)
        .map(title => ({ title, completed: false }));

      const tags = newTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await TaskAPI.create({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        tags,
        checklist
      });

      setNewTitle('');
      setNewDesc('');
      setNewPriority('MEDIUM');
      setNewTags('');
      setNewSubItems(['']);
      onCloseCreateModal();
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi tạo task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'ALL') return true;
    return task.status === filterStatus;
  });

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return <span className="badge badge-urgent">Gấp (Urgent)</span>;
      case 'HIGH': return <span className="badge badge-high">Cao (High)</span>;
      case 'MEDIUM': return <span className="badge badge-medium">Trung bình</span>;
      default: return <span className="badge badge-low">Thấp (Low)</span>;
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
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.25rem' }}>
            Danh Sách Checklist & Sub-tasks
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Quản lý công việc đa cấp
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: filterStatus === st ? 'var(--accent-primary)' : 'transparent',
                color: filterStatus === st ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              {st === 'ALL' ? 'Tất cả' : st === 'TODO' ? 'Cần làm' : st === 'IN_PROGRESS' ? 'Đang làm' : 'Đã xong'}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredTasks.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Chưa có task nào trong danh mục này.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const taskId = task.id || task._id || '';
            const checklist = task.checklist || [];
            const completedCount = checklist.filter(c => c.completed).length;
            const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;
            const isExpanded = expandedTaskIds[taskId] ?? true;

            return (
              <div key={taskId} className="glass-card" style={{ padding: '1.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {getPriorityBadge(task.priority)}
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                        {task.title}
                      </h3>
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => toggleExpand(taskId)}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button className="btn-icon" style={{ color: 'var(--accent-danger)' }} onClick={() => handleDeleteTask(taskId)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Sub-tasks section */}
                {isExpanded && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      <span>Tiến độ sub-tasks</span>
                      <span style={{ fontWeight: 600, color: progressPercent === 100 ? 'var(--accent-success)' : '#fff' }}>
                        {completedCount} / {checklist.length} ({progressPercent}%)
                      </span>
                    </div>
                    <div className="progress-container" style={{ marginBottom: '1rem' }}>
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>

                    {/* Sub-items list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {checklist.map(subItem => (
                        <div
                          key={subItem.id}
                          onClick={() => handleToggleSubTask(taskId, subItem.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.5rem 0.75rem',
                            background: subItem.completed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: subItem.completed ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid transparent'
                          }}
                        >
                          {subItem.completed ? (
                            <CheckSquare size={16} color="var(--accent-success)" />
                          ) : (
                            <Square size={16} color="var(--text-dim)" />
                          )}
                          <span style={{
                            fontSize: '0.875rem',
                            color: subItem.completed ? 'var(--text-dim)' : 'var(--text-main)',
                            textDecoration: subItem.completed ? 'line-through' : 'none'
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

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={onCloseCreateModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.25rem' }}>
              Tạo Checklist Task Mới
            </h3>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Tên công việc *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Xây dựng Monorepo với Express API"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Mô tả chi tiết</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '70px', resize: 'vertical' }}
                  placeholder="Nội dung cần thực hiện..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Mức độ ưu tiên</label>
                  <select
                    className="form-input"
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as Priority)}
                  >
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="HIGH">Cao (High)</option>
                    <option value="URGENT">Khẩn cấp (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Tags (phân cách dấu phẩy)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Học tâp, Thể thao, Giải trí"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Danh sách Sub-tasks (Checklist Items)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {newSubItems.map((item, idx) => (
                    <input
                      key={idx}
                      type="text"
                      className="form-input"
                      placeholder={`Bước ${idx + 1}...`}
                      value={item}
                      onChange={e => handleSubItemChange(idx, e.target.value)}
                    />
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                    onClick={handleAddSubItemInput}
                  >
                    <Plus size={14} /> Thêm Sub-item
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onCloseCreateModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Task Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
