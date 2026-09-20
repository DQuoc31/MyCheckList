import React, { useState, useMemo } from 'react';
import { 
  ITransaction, 
  TimeOfDaySlot, 
  TransactionType, 
  TIME_SLOTS, 
  CreateTransactionDto, 
  UpdateTransactionDto 
} from '@mychecklist/shared';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Sun, 
  Sunrise, 
  Sunset, 
  Moon, 
  Calendar, 
  Clock, 
  Filter, 
  X, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  Tag,
  Check
} from 'lucide-react';
import { TransactionAPI } from '../services/api';

interface FinancesViewProps {
  transactions: ITransaction[];
  onRefresh: () => void;
  showCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

const CATEGORIES = {
  EXPENSE: [
    'Ăn uống',
    'Di chuyển / Xăng xe',
    'Mua sắm',
    'Hóa đơn & Tiện ích',
    'Giải trí',
    'Học tập & Phát triển',
    'Sức khỏe & Thể thao',
    'Gia đình & Con cái',
    'Khác'
  ],
  INCOME: [
    'Tiền lương',
    'Thưởng / Phụ cấp',
    'Freelance / Dự án',
    'Đầu tư & Tiết kiệm',
    'Quà tặng / Trúng thưởng',
    'Kinh doanh',
    'Khác'
  ]
};

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const getSlotIcon = (slot: TimeOfDaySlot) => {
  switch (slot) {
    case 'MORNING': return Sunrise;
    case 'AFTERNOON': return Sun;
    case 'EVENING': return Sunset;
    case 'NIGHT': return Moon;
  }
};

export const FinancesView: React.FC<FinancesViewProps> = ({
  transactions,
  onRefresh,
  showCreateModal = false,
  onCloseCreateModal
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isAllDates, setIsAllDates] = useState<boolean>(false);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<TimeOfDaySlot | 'ALL'>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ITransaction | null>(null);

  // Form State
  const [formType, setFormType] = useState<TransactionType>('EXPENSE');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState('Ăn uống');
  const [formTimeSlot, setFormTimeSlot] = useState<TimeOfDaySlot>('MORNING');
  const [formDate, setFormDate] = useState(todayStr);
  const [formTime, setFormTime] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isModalVisible = showCreateModal || internalModalOpen || !!editingItem;

  const autoDetectSlot = (timeStr?: string): TimeOfDaySlot => {
    let hour = new Date().getHours();
    if (timeStr && timeStr.includes(':')) {
      const parsed = parseInt(timeStr.split(':')[0], 10);
      if (!isNaN(parsed)) hour = parsed;
    }
    if (hour >= 5 && hour < 11) return 'MORNING';
    if (hour >= 11 && hour < 17) return 'AFTERNOON';
    if (hour >= 17 && hour < 22) return 'EVENING';
    return 'NIGHT';
  };

  const handleOpenCreate = (slotPreset?: TimeOfDaySlot) => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const detected = slotPreset || autoDetectSlot(currentTime);

    setEditingItem(null);
    setFormType('EXPENSE');
    setFormTitle('');
    setFormAmount('');
    setFormCategory('Ăn uống');
    setFormTimeSlot(detected);
    setFormDate(selectedDate);
    setFormTime(currentTime);
    setFormNote('');
    setFormError('');
    setInternalModalOpen(true);
  };

  const handleOpenEdit = (item: ITransaction) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormAmount(item.amount.toString());
    setFormCategory(item.category || 'Khác');
    setFormTimeSlot(item.timeSlot || 'MORNING');
    setFormDate(item.date || todayStr);
    setFormTime(item.time || '');
    setFormNote(item.note || '');
    setFormError('');
    setInternalModalOpen(true);
  };

  const handleCloseModal = () => {
    setInternalModalOpen(false);
    setEditingItem(null);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Vui lòng nhập tên khoản thu/chi');
      return;
    }
    const numAmount = parseFloat(formAmount.replace(/[^0-9]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Vui lòng nhập số tiền hợp lệ (> 0đ)');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      if (editingItem && editingItem.id) {
        const dto: UpdateTransactionDto = {
          title: formTitle.trim(),
          amount: numAmount,
          type: formType,
          category: formCategory,
          timeSlot: formTimeSlot,
          date: formDate,
          time: formTime,
          note: formNote
        };
        await TransactionAPI.update(editingItem.id, dto);
      } else {
        const dto: CreateTransactionDto = {
          title: formTitle.trim(),
          amount: numAmount,
          type: formType,
          category: formCategory,
          timeSlot: formTimeSlot,
          date: formDate,
          time: formTime,
          note: formNote
        };
        await TransactionAPI.create(dto);
      }

      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra khi lưu giao dịch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
    try {
      await TransactionAPI.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa giao dịch');
    }
  };

  // Filtered transactions for the current view
  const filteredByDate = useMemo(() => {
    if (isAllDates) return transactions;
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate, isAllDates]);

  // Summary Metrics
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const slots: Record<TimeOfDaySlot, { income: number; expense: number; count: number }> = {
      MORNING: { income: 0, expense: 0, count: 0 },
      AFTERNOON: { income: 0, expense: 0, count: 0 },
      EVENING: { income: 0, expense: 0, count: 0 },
      NIGHT: { income: 0, expense: 0, count: 0 }
    };

    filteredByDate.forEach(t => {
      const amt = Number(t.amount) || 0;
      const slot = (t.timeSlot && slots[t.timeSlot]) ? t.timeSlot : 'MORNING';
      slots[slot].count += 1;

      if (t.type === 'INCOME') {
        income += amt;
        slots[slot].income += amt;
      } else {
        expense += amt;
        slots[slot].expense += amt;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
      slots
    };
  }, [filteredByDate]);

  // Display list filtered by search and slot filters
  const displayTransactions = useMemo(() => {
    return filteredByDate.filter(t => {
      if (selectedSlotFilter !== 'ALL' && t.timeSlot !== selectedSlotFilter) return false;
      if (selectedTypeFilter !== 'ALL' && t.type !== selectedTypeFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchCategory = (t.category || '').toLowerCase().includes(query);
        const matchNote = (t.note || '').toLowerCase().includes(query);
        if (!matchTitle && !matchCategory && !matchNote) return false;
      }
      return true;
    });
  }, [filteredByDate, selectedSlotFilter, selectedTypeFilter, searchQuery]);

  const changeDateBy = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
    setIsAllDates(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={24} color="var(--accent-primary)" /> Quản Lý Thu Chi Theo Khung Giờ
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tính toán dòng tiền tự động theo từng khoảng thời gian trong ngày (Sáng, Chiều, Tối, Đêm)
          </p>
        </div>

        {/* Date Selector & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
            <button
              onClick={() => changeDateBy(-1)}
              className="btn-icon"
              title="Ngày trước"
              style={{ padding: '0.25rem' }}
            >
              &larr;
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsAllDates(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontFamily: 'var(--font-family)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <button
              onClick={() => changeDateBy(1)}
              className="btn-icon"
              title="Ngày sau"
              style={{ padding: '0.25rem' }}
            >
              &rarr;
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedDate(todayStr);
              setIsAllDates(false);
            }}
            className={`btn ${selectedDate === todayStr && !isAllDates ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            Hôm nay
          </button>

          <button
            onClick={() => setIsAllDates(!isAllDates)}
            className={`btn ${isAllDates ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            Tất cả ngày
          </button>

          <button
            onClick={() => handleOpenCreate()}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Thêm Giao Dịch
          </button>
        </div>
      </div>

      {/* Overview Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Tổng Thu Nhập
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-success)' }}>
            {formatVND(summary.income)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            {isAllDates ? 'Tất cả các ngày' : `Ngày: ${selectedDate}`}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Tổng Chi Tiêu
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-danger)' }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-danger)' }}>
            {formatVND(summary.expense)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            {filteredByDate.length} giao dịch ghi nhận
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: `4px solid ${summary.balance >= 0 ? 'var(--accent-primary)' : 'var(--accent-warning)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Cân Đối Ròng (Thu - Chi)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: summary.balance >= 0 ? '#fff' : 'var(--accent-warning)' }}>
            {summary.balance > 0 ? `+${formatVND(summary.balance)}` : formatVND(summary.balance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: summary.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', marginTop: '0.25rem', fontWeight: 500 }}>
            {summary.balance >= 0 ? '✓ Đang thặng dư tích cực' : '⚠ Chi vượt quá thu'}
          </div>
        </div>
      </div>

      {/* 4 Time Slot Breakdown Cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>
            Chi Tiết Thu Chi Theo 4 Khoảng Thời Gian Trong Ngày
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Nhấn vào ca để lọc danh sách
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {(Object.keys(TIME_SLOTS) as TimeOfDaySlot[]).map((slotKey) => {
            const config = TIME_SLOTS[slotKey];
            const Icon = getSlotIcon(slotKey);
            const slotData = summary.slots[slotKey];
            const isSelected = selectedSlotFilter === slotKey;
            const netSlotBalance = slotData.income - slotData.expense;

            return (
              <div
                key={slotKey}
                onClick={() => setSelectedSlotFilter(isSelected ? 'ALL' : slotKey)}
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  position: 'relative',
                  border: isSelected ? `2px solid ${config.color}` : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(31, 41, 55, 0.95)' : 'var(--bg-card)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  boxShadow: isSelected ? `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 15px ${config.color}33` : 'var(--shadow-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: `${config.color}22`,
                      color: config.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{config.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{config.timeRange}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCreate(slotKey);
                    }}
                    title={`Thêm giao dịch vào ${config.label}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0.5rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Thu:</span>
                    <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{formatVND(slotData.income)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Chi:</span>
                    <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>{formatVND(slotData.expense)}</span>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Chênh lệch:</span>
                    <span style={{ color: netSlotBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 700 }}>
                      {netSlotBalance > 0 ? `+${formatVND(netSlotBalance)}` : formatVND(netSlotBalance)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                  <span>{slotData.count} giao dịch</span>
                  {isSelected && (
                    <span style={{ color: config.color, fontWeight: 600 }}>Đang lọc &bull;</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Filter size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Tìm theo tên khoản chi, danh mục, ghi chú..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn-icon" style={{ padding: '0.2rem' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Khung giờ:</span>
          <select
            value={selectedSlotFilter}
            onChange={(e) => setSelectedSlotFilter(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            <option value="ALL">Tất cả khung giờ</option>
            <option value="MORNING">Ca Sáng (05:00 - 11:00)</option>
            <option value="AFTERNOON">Ca Trưa / Chiều (11:00 - 17:00)</option>
            <option value="EVENING">Ca Tối (17:00 - 22:00)</option>
            <option value="NIGHT">Ca Đêm (22:00 - 05:00)</option>
          </select>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Loại:</span>
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            <option value="ALL">Tất cả loại</option>
            <option value="EXPENSE">Khoản Chi (-)</option>
            <option value="INCOME">Khoản Thu (+)</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {displayTransactions.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Wallet size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.5rem' }}>Chưa có giao dịch nào trong khoảng thời gian này</p>
            <p style={{ fontSize: '0.85rem' }}>Nhấn "+ Thêm Giao Dịch" để ghi chép các khoản thu chi trong ngày</p>
            <button
              onClick={() => handleOpenCreate()}
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
            >
              <Plus size={16} /> Thêm Giao Dịch Ngay
            </button>
          </div>
        ) : (
          displayTransactions.map((tx) => {
            const slotConfig = TIME_SLOTS[tx.timeSlot] || TIME_SLOTS.MORNING;
            const SlotIcon = getSlotIcon(tx.timeSlot);
            const isIncome = tx.type === 'INCOME';

            return (
              <div
                key={tx.id || tx._id}
                className="glass-card"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderLeft: `4px solid ${isIncome ? 'var(--accent-success)' : 'var(--accent-danger)'}`
                }}
              >
                {/* Left: Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '200px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isIncome ? 'var(--accent-success)' : 'var(--accent-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                        {tx.title}
                      </span>
                      <span className="tag-pill" style={{ fontSize: '0.7rem' }}>
                        <Tag size={10} /> {tx.category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: slotConfig.color }}>
                        <SlotIcon size={12} /> {slotConfig.label} ({tx.time || slotConfig.timeRange})
                      </span>
                      <span>&bull;</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} /> {tx.date}
                      </span>
                      {tx.note && (
                        <>
                          <span>&bull;</span>
                          <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: isIncome ? 'var(--accent-success)' : 'var(--accent-danger)'
                    }}>
                      {isIncome ? `+${formatVND(tx.amount)}` : `-${formatVND(tx.amount)}`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {isIncome ? 'Thu nhập' : 'Chi tiêu'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleOpenEdit(tx)}
                      className="btn-icon"
                      title="Sửa"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id || tx._id)}
                      className="btn-icon"
                      title="Xóa"
                      style={{ color: 'var(--accent-danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalVisible && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>
                {editingItem ? 'Chỉnh Sửa Giao Dịch Thu Chi' : 'Thêm Giao Dịch Thu Chi Mới'}
              </h3>
              <button onClick={handleCloseModal} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-danger)',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Type Switcher: Chi Tiêu vs Thu Nhập */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('EXPENSE');
                    setFormCategory(CATEGORIES.EXPENSE[0]);
                  }}
                  style={{
                    padding: '0.6rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: formType === 'EXPENSE' ? 'var(--accent-danger)' : 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <TrendingDown size={16} /> Khoản Chi (-)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormType('INCOME');
                    setFormCategory(CATEGORIES.INCOME[0]);
                  }}
                  style={{
                    padding: '0.6rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: formType === 'INCOME' ? 'var(--accent-success)' : 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <TrendingUp size={16} /> Khoản Thu (+)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Số tiền (VNĐ) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ví dụ: 50000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '1.2rem', fontWeight: 700, paddingLeft: '2.5rem' }}
                    required
                    autoFocus
                  />
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ₫
                  </span>
                </div>
                {formAmount && !isNaN(Number(formAmount)) && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '0.25rem', fontWeight: 500 }}>
                    {formatVND(Number(formAmount))}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Tên khoản giao dịch *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ăn sáng phở bò, Mua quà tặng, Tiền lương..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Time Slot Selection (4 Slots) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Khung thời gian trong ngày *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const detected = autoDetectSlot(formTime);
                      setFormTimeSlot(detected);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Tự động nhận diện
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {(Object.keys(TIME_SLOTS) as TimeOfDaySlot[]).map((slotKey) => {
                    const config = TIME_SLOTS[slotKey];
                    const Icon = getSlotIcon(slotKey);
                    const isSelected = formTimeSlot === slotKey;

                    return (
                      <div
                        key={slotKey}
                        onClick={() => setFormTimeSlot(slotKey)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? `2px solid ${config.color}` : '1px solid var(--border-color)',
                          background: isSelected ? `${config.color}15` : 'rgba(0, 0, 0, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon size={16} color={config.color} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                            {config.label}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {config.timeRange}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category & Date/Time Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Danh mục
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="form-input"
                  >
                    {CATEGORIES[formType].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Ngày ghi nhận
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Giờ (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => {
                      setFormTime(e.target.value);
                      if (e.target.value) {
                        setFormTimeSlot(autoDetectSlot(e.target.value));
                      }
                    }}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Ghi chú thêm
                  </label>
                  <input
                    type="text"
                    placeholder="Địa điểm, lý do..."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang lưu...' : (editingItem ? 'Cập Nhật' : 'Thêm Giao Dịch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
