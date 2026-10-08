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
  CalendarDays,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Layers,
  PieChart,
  Flame
} from 'lucide-react';
import { TransactionAPI } from '../services/api';

interface FinancesViewProps {
  transactions: ITransaction[];
  onRefresh: () => void;
  showCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

type FinanceViewTab = 'DAY' | 'MONTH';
type MonthSubView = 'CALENDAR' | 'TABLE';
type TableSortField = 'DATE_ASC' | 'DATE_DESC' | 'EXPENSE_DESC' | 'INCOME_DESC' | 'BALANCE_DESC' | 'COUNT_DESC';

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

const formatCompactVND = (amount: number): string => {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B₫`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M₫`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k₫`;
  }
  return `${amount}₫`;
};

const getSlotIcon = (slot: TimeOfDaySlot) => {
  switch (slot) {
    case 'MORNING': return Sunrise;
    case 'AFTERNOON': return Sun;
    case 'EVENING': return Sunset;
    case 'NIGHT': return Moon;
  }
};

const WEEKDAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const FULL_WEEKDAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

interface IDayFinanceRecord {
  date: string;
  dayNumber: number;
  weekday: string;
  fullWeekday: string;
  income: number;
  expense: number;
  balance: number;
  count: number;
  transactions: ITransaction[];
  categories: Record<string, number>;
}

interface IMonthlyFinanceStats {
  dailyMap: Record<string, IDayFinanceRecord>;
  daysList: IDayFinanceRecord[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  avgDailyExpense: number;
  avgOverallDailyExpense: number;
  savingsRate: number;
  activeDaysCount: number;
  maxExpense: number;
  maxExpenseDay: IDayFinanceRecord | null;
  maxIncome: number;
  maxIncomeDay: IDayFinanceRecord | null;
  categoryStats: {
    EXPENSE: Record<string, number>;
    INCOME: Record<string, number>;
  };
  slotStats: Record<TimeOfDaySlot, { income: number; expense: number; count: number }>;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  transactions,
  onRefresh,
  showCreateModal = false,
  onCloseCreateModal
}) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // View mode: DAY vs MONTH
  const [activeTab, setActiveTab] = useState<FinanceViewTab>('DAY');
  const [monthSubView, setMonthSubView] = useState<MonthSubView>('CALENDAR');
  const [tableSort, setTableSort] = useState<TableSortField>('DATE_ASC');

  // Day View State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isAllDates, setIsAllDates] = useState<boolean>(false);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<TimeOfDaySlot | 'ALL'>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Month View State
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedMonthDay, setSelectedMonthDay] = useState<string>(todayStr);
  const [chartMetric, setChartMetric] = useState<'BOTH' | 'EXPENSE' | 'INCOME'>('BOTH');

  // Modals
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

  const handleOpenCreate = (slotPreset?: TimeOfDaySlot, datePreset?: string) => {
    const currentNow = new Date();
    const currentTime = currentNow.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const detected = slotPreset || autoDetectSlot(currentTime);

    setEditingItem(null);
    setFormType('EXPENSE');
    setFormTitle('');
    setFormAmount('');
    setFormCategory('Ăn uống');
    setFormTimeSlot(detected);
    setFormDate(datePreset || (activeTab === 'DAY' ? selectedDate : selectedMonthDay || todayStr));
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

  // ==================== DAY VIEW CALCULATIONS ====================
  const filteredByDate = useMemo(() => {
    if (isAllDates) return transactions;
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate, isAllDates]);

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

  // ==================== MONTH VIEW CALCULATIONS ====================
  const changeMonthBy = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + offset, 1);
    const newMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
    setSelectedMonthDay(`${newMonthStr}-01`);
  };

  const monthInfo = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    const firstDayRaw = new Date(year, month - 1, 1).getDay();
    const startWeekdayOffset = (firstDayRaw + 6) % 7;

    return {
      year,
      month,
      totalDays,
      startWeekdayOffset,
      monthLabel: `Tháng ${month}/${year}`
    };
  }, [selectedMonth]);

  // Daily map of transactions for the whole month
  const monthlyData = useMemo<IMonthlyFinanceStats>(() => {
    const dailyMap: Record<string, IDayFinanceRecord> = {};

    // Initialize all days in month
    for (let day = 1; day <= monthInfo.totalDays; day++) {
      const dateKey = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const dObj = new Date(monthInfo.year, monthInfo.month - 1, day);
      const weekdayIdx = (dObj.getDay() + 6) % 7;

      dailyMap[dateKey] = {
        date: dateKey,
        dayNumber: day,
        weekday: WEEKDAY_NAMES[weekdayIdx],
        fullWeekday: FULL_WEEKDAY_NAMES[dObj.getDay()],
        income: 0,
        expense: 0,
        balance: 0,
        count: 0,
        transactions: [],
        categories: {}
      };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryStats: {
      EXPENSE: Record<string, number>;
      INCOME: Record<string, number>;
    } = { EXPENSE: {}, INCOME: {} };
    const slotStats: Record<TimeOfDaySlot, { income: number; expense: number; count: number }> = {
      MORNING: { income: 0, expense: 0, count: 0 },
      AFTERNOON: { income: 0, expense: 0, count: 0 },
      EVENING: { income: 0, expense: 0, count: 0 },
      NIGHT: { income: 0, expense: 0, count: 0 }
    };

    transactions.forEach(tx => {
      if (tx.date && tx.date.startsWith(selectedMonth)) {
        const amt = Number(tx.amount) || 0;
        const dayRecord = dailyMap[tx.date];
        if (dayRecord) {
          dayRecord.count += 1;
          dayRecord.transactions.push(tx);
          const cat = tx.category || 'Khác';
          dayRecord.categories[cat] = (dayRecord.categories[cat] || 0) + amt;

          if (tx.type === 'INCOME') {
            dayRecord.income += amt;
            dayRecord.balance += amt;
            totalIncome += amt;
            categoryStats.INCOME[cat] = (categoryStats.INCOME[cat] || 0) + amt;
            if (tx.timeSlot && slotStats[tx.timeSlot]) {
              slotStats[tx.timeSlot].income += amt;
              slotStats[tx.timeSlot].count += 1;
            }
          } else {
            dayRecord.expense += amt;
            dayRecord.balance -= amt;
            totalExpense += amt;
            categoryStats.EXPENSE[cat] = (categoryStats.EXPENSE[cat] || 0) + amt;
            if (tx.timeSlot && slotStats[tx.timeSlot]) {
              slotStats[tx.timeSlot].expense += amt;
              slotStats[tx.timeSlot].count += 1;
            }
          }
        }
      }
    });

    const daysList = Object.values(dailyMap);
    const activeExpenseDays = daysList.filter(d => d.expense > 0);
    const activeDays = daysList.filter(d => d.count > 0);

    let maxExpense = 0;
    let maxExpenseDay: IDayFinanceRecord | null = null;
    let maxIncome = 0;
    let maxIncomeDay: IDayFinanceRecord | null = null;

    daysList.forEach(d => {
      if (d.expense > maxExpense) {
        maxExpense = d.expense;
        maxExpenseDay = d;
      }
      if (d.income > maxIncome) {
        maxIncome = d.income;
        maxIncomeDay = d;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const avgDailyExpense = activeExpenseDays.length > 0 ? totalExpense / activeExpenseDays.length : 0;
    const avgOverallDailyExpense = monthInfo.totalDays > 0 ? totalExpense / monthInfo.totalDays : 0;
    const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;

    return {
      dailyMap,
      daysList,
      totalIncome,
      totalExpense,
      netBalance,
      avgDailyExpense,
      avgOverallDailyExpense,
      savingsRate,
      activeDaysCount: activeDays.length,
      maxExpense,
      maxExpenseDay,
      maxIncome,
      maxIncomeDay,
      categoryStats,
      slotStats
    };
  }, [transactions, selectedMonth, monthInfo]);

  // Sorted list for Table view
  const sortedMonthDays = useMemo(() => {
    const list = [...monthlyData.daysList];
    switch (tableSort) {
      case 'DATE_ASC':
        return list.sort((a, b) => a.dayNumber - b.dayNumber);
      case 'DATE_DESC':
        return list.sort((a, b) => b.dayNumber - a.dayNumber);
      case 'EXPENSE_DESC':
        return list.sort((a, b) => b.expense - a.expense);
      case 'INCOME_DESC':
        return list.sort((a, b) => b.income - a.income);
      case 'BALANCE_DESC':
        return list.sort((a, b) => b.balance - a.balance);
      case 'COUNT_DESC':
        return list.sort((a, b) => b.count - a.count);
      default:
        return list;
    }
  }, [monthlyData.daysList, tableSort]);

  // Top spending days (rankings)
  const topSpendingDays = useMemo(() => {
    return [...monthlyData.daysList]
      .filter(d => d.expense > 0)
      .sort((a, b) => b.expense - a.expense)
      .slice(0, 5);
  }, [monthlyData.daysList]);

  // Selected Day Details in Month View
  const selectedDayData = useMemo(() => {
    return monthlyData.dailyMap[selectedMonthDay] || null;
  }, [monthlyData.dailyMap, selectedMonthDay]);

  const switchToDayView = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsAllDates(false);
    setActiveTab('DAY');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* View Switcher Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--bg-card)',
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
            <Wallet size={24} color="var(--accent-primary)" /> Quản Lý Thu Chi & Dòng Tiền
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {activeTab === 'DAY'
              ? 'Theo dõi chi tiết các khoản thu chi theo 4 ca trong ngày (Sáng, Chiều, Tối, Đêm)'
              : 'So sánh bức tranh tổng quan thu chi giữa các ngày trong tháng, phát hiện ngày chi tiêu đỉnh điểm'}
          </p>
        </div>

        {/* Tab switcher: Theo Ngày vs Theo Tháng */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(20, 83, 45, 0.08)', padding: '0.3rem', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setActiveTab('DAY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'DAY' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'DAY' ? '#fff' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'DAY' ? '0 2px 8px rgba(21, 128, 61, 0.25)' : 'none'
            }}
          >
            <Clock size={16} /> Theo Ngày (4 Ca)
          </button>

          <button
            onClick={() => setActiveTab('MONTH')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'MONTH' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'MONTH' ? '#fff' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'MONTH' ? '0 2px 8px rgba(21, 128, 61, 0.25)' : 'none'
            }}
          >
            <CalendarDays size={16} /> Theo Tháng (So Sánh Các Ngày)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ---------------------------- VIEW THEO NGÀY ----------------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'DAY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Day Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
                <button
                  onClick={() => changeDateBy(-1)}
                  className="btn-icon"
                  title="Ngày trước"
                  style={{ padding: '0.25rem' }}
                >
                  <ChevronLeft size={16} />
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
                    color: 'var(--text-main)',
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
                  <ChevronRight size={16} />
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
            </div>

            <button
              onClick={() => handleOpenCreate()}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Thêm Giao Dịch
            </button>
          </div>

          {/* Overview Balance Cards (Day) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Tổng Thu Nhập
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(21, 128, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
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
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-danger)' }}>
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
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(21, 128, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: summary.balance >= 0 ? 'var(--text-main)' : 'var(--accent-warning)' }}>
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
              <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
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
                      background: isSelected ? 'rgba(21, 128, 61, 0.08)' : 'var(--bg-card)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      boxShadow: isSelected ? `0 8px 24px rgba(20, 83, 45, 0.15), 0 0 15px ${config.color}22` : 'var(--shadow-card)'
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
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{config.label}</div>
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
                          background: 'rgba(20, 83, 45, 0.08)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-main)',
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
                  color: 'var(--text-main)',
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
                <p style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 600 }}>Chưa có giao dịch nào trong khoảng thời gian này</p>
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
                        background: isIncome ? 'rgba(21, 128, 61, 0.12)' : 'rgba(239, 68, 68, 0.12)',
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
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* --------------------------- VIEW THEO THÁNG ----------------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'MONTH' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Month Navigation & Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'var(--bg-card)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}>
            {/* Month Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
                <button
                  onClick={() => changeMonthBy(-1)}
                  className="btn-icon"
                  title="Tháng trước"
                  style={{ padding: '0.25rem' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={16} color="var(--accent-primary)" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedMonth(e.target.value);
                        setSelectedMonthDay(`${e.target.value}-01`);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <button
                  onClick={() => changeMonthBy(1)}
                  className="btn-icon"
                  title="Tháng sau"
                  style={{ padding: '0.25rem' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedMonth(currentMonthStr);
                  setSelectedMonthDay(todayStr);
                }}
                className={`btn ${selectedMonth === currentMonthStr ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                Tháng này
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginLeft: '0.25rem' }}>
                {monthlyData.activeDaysCount}/{monthInfo.totalDays} ngày có phát sinh giao dịch
              </span>
            </div>

            {/* Right: Subview mode (Lưới lịch vs Bảng) & Add Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setMonthSubView('CALENDAR')}
                  className="btn-icon"
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: monthSubView === 'CALENDAR' ? 'var(--accent-primary)' : 'transparent',
                    color: monthSubView === 'CALENDAR' ? '#fff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <Calendar size={14} /> Lưới Lịch
                </button>
                <button
                  onClick={() => setMonthSubView('TABLE')}
                  className="btn-icon"
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: monthSubView === 'TABLE' ? 'var(--accent-primary)' : 'transparent',
                    color: monthSubView === 'TABLE' ? '#fff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <Layers size={14} /> Bảng So Sánh
                </button>
              </div>

              <button
                onClick={() => handleOpenCreate(undefined, selectedMonthDay)}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Thêm Giao Dịch
              </button>
            </div>
          </div>

          {/* Monthly Executive Summary Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {/* Tổng Thu */}
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Tổng Thu Nhập Tháng
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(21, 128, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                {formatVND(monthlyData.totalIncome)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                {monthlyData.maxIncome > 0 && monthlyData.maxIncomeDay ? `Cao nhất: +${formatCompactVND(monthlyData.maxIncome)} (${monthlyData.maxIncomeDay.dayNumber}/${monthInfo.month})` : 'Chưa có khoản thu'}
              </div>
            </div>

            {/* Tổng Chi */}
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Tổng Chi Tiêu Tháng
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-danger)' }}>
                  <ArrowDownRight size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-danger)' }}>
                {formatVND(monthlyData.totalExpense)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                {monthlyData.maxExpense > 0 && monthlyData.maxExpenseDay ? `Đỉnh điểm: -${formatCompactVND(monthlyData.maxExpense)} (${monthlyData.maxExpenseDay.dayNumber}/${monthInfo.month})` : 'Chưa có khoản chi'}
              </div>
            </div>

            {/* Dòng Tiền Ròng (Net Balance) */}
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: `4px solid ${monthlyData.netBalance >= 0 ? 'var(--accent-primary)' : 'var(--accent-warning)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Dòng Tiền Ròng (Thu - Chi)
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(21, 128, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: monthlyData.netBalance >= 0 ? 'var(--text-main)' : 'var(--accent-warning)' }}>
                {monthlyData.netBalance > 0 ? `+${formatVND(monthlyData.netBalance)}` : formatVND(monthlyData.netBalance)}
              </div>
              <div style={{ fontSize: '0.75rem', color: monthlyData.netBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', marginTop: '0.25rem', fontWeight: 600 }}>
                {monthlyData.netBalance >= 0 ? `✓ Tích lũy ${monthlyData.savingsRate.toFixed(1)}% thu nhập` : '⚠ Chi tiêu vượt thu nhập'}
              </div>
            </div>

            {/* Trung Bình Chi Tiêu / Ngày */}
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-info)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Chi Tiêu Trung Bình / Ngày
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-info)' }}>
                  <BarChart3 size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-info)' }}>
                {formatVND(monthlyData.avgDailyExpense)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Tính trên các ngày có chi ({monthlyData.avgOverallDailyExpense > 0 ? `~${formatCompactVND(monthlyData.avgOverallDailyExpense)}/ngày toàn tháng` : '0đ'})
              </div>
            </div>
          </div>

          {/* ================== COMPARATIVE DAILY BAR CHART ================== */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} color="var(--accent-primary)" />
                  Biểu Đồ So Sánh Các Ngày Trong {monthInfo.monthLabel}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Nhấn vào từng cột ngày để xem chi tiết danh sách thu chi bên dưới
                </p>
              </div>

              {/* Chart Metric Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setChartMetric('BOTH')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: chartMetric === 'BOTH' ? 'var(--accent-primary)' : 'transparent',
                    color: chartMetric === 'BOTH' ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Thu & Chi
                </button>
                <button
                  onClick={() => setChartMetric('EXPENSE')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: chartMetric === 'EXPENSE' ? 'var(--accent-danger)' : 'transparent',
                    color: chartMetric === 'EXPENSE' ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Chỉ Chi Tiêu
                </button>
                <button
                  onClick={() => setChartMetric('INCOME')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: chartMetric === 'INCOME' ? 'var(--accent-success)' : 'transparent',
                    color: chartMetric === 'INCOME' ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Chỉ Thu Nhập
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <div style={{ minWidth: `${monthInfo.totalDays * 28 + 40}px`, height: '220px', display: 'flex', alignItems: 'flex-end', gap: '6px', paddingTop: '20px', borderBottom: '1px solid var(--border-color)' }}>
                {monthlyData.daysList.map((dayData) => {
                  const maxRef = Math.max(monthlyData.maxExpense, monthlyData.maxIncome, 1);
                  const incomeHeight = Math.min(180, Math.round((dayData.income / maxRef) * 180));
                  const expenseHeight = Math.min(180, Math.round((dayData.expense / maxRef) * 180));
                  const isSelected = selectedMonthDay === dayData.date;
                  const isToday = dayData.date === todayStr;
                  const isPeakExpense = dayData.expense > 0 && dayData.expense === monthlyData.maxExpense;

                  return (
                    <div
                      key={dayData.date}
                      onClick={() => setSelectedMonthDay(dayData.date)}
                      title={`Ngày ${dayData.dayNumber} (${dayData.weekday}): Thu +${formatVND(dayData.income)} | Chi -${formatVND(dayData.expense)}`}
                      style={{
                        flex: 1,
                        minWidth: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        cursor: 'pointer',
                        position: 'relative',
                        padding: '0 2px'
                      }}
                    >
                      {/* Peak Badge */}
                      {isPeakExpense && (
                        <div style={{ position: 'absolute', top: '-18px', color: 'var(--accent-danger)' }}>
                          <Flame size={14} />
                        </div>
                      )}

                      {/* Bars */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', width: '100%', justifyContent: 'center' }}>
                        {/* Income Bar (Green) */}
                        {(chartMetric === 'BOTH' || chartMetric === 'INCOME') && (
                          <div
                            style={{
                              width: chartMetric === 'BOTH' ? '8px' : '14px',
                              height: `${Math.max(dayData.income > 0 ? 4 : 0, incomeHeight)}px`,
                              background: isSelected ? 'var(--accent-success)' : 'rgba(22, 163, 74, 0.7)',
                              borderRadius: '3px 3px 0 0',
                              transition: 'all 0.2s ease',
                              boxShadow: isSelected ? '0 0 8px rgba(22, 163, 74, 0.4)' : 'none'
                            }}
                          />
                        )}

                        {/* Expense Bar (Red) */}
                        {(chartMetric === 'BOTH' || chartMetric === 'EXPENSE') && (
                          <div
                            style={{
                              width: chartMetric === 'BOTH' ? '8px' : '14px',
                              height: `${Math.max(dayData.expense > 0 ? 4 : 0, expenseHeight)}px`,
                              background: isPeakExpense ? 'var(--accent-danger)' : (isSelected ? 'var(--accent-danger)' : 'rgba(239, 68, 68, 0.7)'),
                              borderRadius: '3px 3px 0 0',
                              transition: 'all 0.2s ease',
                              boxShadow: isSelected ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
                            }}
                          />
                        )}
                      </div>

                      {/* Day Label */}
                      <div style={{
                        marginTop: '6px',
                        fontSize: '0.72rem',
                        fontWeight: isSelected || isToday ? 700 : 500,
                        color: isSelected ? 'var(--accent-primary)' : (isToday ? 'var(--accent-warning)' : 'var(--text-muted)'),
                        background: isSelected ? 'rgba(21, 128, 61, 0.15)' : (isToday ? 'rgba(217, 119, 6, 0.15)' : 'transparent'),
                        borderRadius: '4px',
                        padding: '1px 3px',
                        textAlign: 'center'
                      }}>
                        {dayData.dayNumber}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend & Summary Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent-success)' }} />
                  Thu nhập
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent-danger)' }} />
                  Chi tiêu
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Flame size={12} color="var(--accent-danger)" />
                  Ngày chi đỉnh điểm
                </span>
              </div>

              {selectedDayData && (
                <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                  Đang chọn: Ngày {selectedDayData.dayNumber}/{monthInfo.month} ({selectedDayData.fullWeekday}) &bull; Thu: <span style={{ color: 'var(--accent-success)' }}>+{formatCompactVND(selectedDayData.income)}</span> | Chi: <span style={{ color: 'var(--accent-danger)' }}>-{formatCompactVND(selectedDayData.expense)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ================== SUBVIEW 1: CALENDAR MATRIX ================== */}
          {monthSubView === 'CALENDAR' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  Ma Trận Lịch Thu Chi Từng Ngày ({monthInfo.monthLabel})
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Nhấn vào ngày để xem chi tiết hoặc thêm khoản thu chi
                </span>
              </div>

              {/* 7-column Calendar Matrix */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem'
              }}>
                {/* Weekday headers (T2 -> CN) */}
                {WEEKDAY_NAMES.map((wk, idx) => (
                  <div
                    key={wk}
                    style={{
                      textAlign: 'center',
                      padding: '0.4rem',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: idx >= 5 ? 'var(--accent-primary)' : 'var(--text-muted)',
                      background: 'rgba(20, 83, 45, 0.04)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {wk}
                  </div>
                ))}

                {/* Empty offset cells before day 1 */}
                {Array.from({ length: monthInfo.startWeekdayOffset }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    style={{
                      minHeight: '85px',
                      background: 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      opacity: 0.3
                    }}
                  />
                ))}

                {/* Days of the month */}
                {monthlyData.daysList.map((dayData) => {
                  const isSelected = selectedMonthDay === dayData.date;
                  const isToday = dayData.date === todayStr;
                  const hasData = dayData.count > 0;
                  const isPeak = dayData.expense > 0 && dayData.expense === monthlyData.maxExpense;

                  return (
                    <div
                      key={dayData.date}
                      onClick={() => setSelectedMonthDay(dayData.date)}
                      className="glass-card"
                      style={{
                        minHeight: '92px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        border: isSelected
                          ? '2px solid var(--accent-primary)'
                          : isToday
                          ? '2px solid var(--accent-warning)'
                          : '1px solid var(--border-color)',
                        background: isSelected
                          ? 'rgba(21, 128, 61, 0.08)'
                          : hasData
                          ? 'var(--bg-card)'
                          : 'rgba(255, 255, 255, 0.5)',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                        boxShadow: isSelected ? '0 6px 18px rgba(21, 128, 61, 0.18)' : 'var(--shadow-card)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Top row: Day number + Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontWeight: isToday || isSelected ? 800 : 600,
                          fontSize: '0.85rem',
                          color: isToday ? 'var(--accent-warning)' : isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isToday ? 'rgba(217, 119, 6, 0.15)' : 'transparent'
                        }}>
                          {dayData.dayNumber}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {isPeak && (
                            <span title="Ngày chi nhiều nhất tháng" style={{ color: 'var(--accent-danger)' }}>
                              <Flame size={12} />
                            </span>
                          )}
                          {hasData && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                              {dayData.count}GD
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amounts Breakdown in Cell */}
                      {hasData ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '0.2rem 0' }}>
                          {dayData.income > 0 && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-success)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              +{formatCompactVND(dayData.income)}
                            </div>
                          )}
                          {dayData.expense > 0 && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-danger)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              -{formatCompactVND(dayData.expense)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center', opacity: 0.5, margin: 'auto 0' }}>
                          --
                        </div>
                      )}

                      {/* Bottom Balance Bar/Net */}
                      {hasData && (
                        <div style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: dayData.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                          borderTop: '1px dashed var(--border-color)',
                          paddingTop: '2px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>Dư:</span>
                          <span>{dayData.balance > 0 ? `+${formatCompactVND(dayData.balance)}` : formatCompactVND(dayData.balance)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================== SUBVIEW 2: COMPARISON TABLE ================== */}
          {monthSubView === 'TABLE' && (
            <div className="glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  Bảng Xếp Hạng & Thống Kê So Sánh Từng Ngày Trong Tháng
                </h3>

                {/* Sorter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sắp xếp theo:</span>
                  <select
                    value={tableSort}
                    onChange={(e) => setTableSort(e.target.value as TableSortField)}
                    className="form-input"
                    style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    <option value="DATE_ASC">Ngày tăng dần (1 &rarr; 31)</option>
                    <option value="DATE_DESC">Ngày giảm dần (31 &rarr; 1)</option>
                    <option value="EXPENSE_DESC">Chi tiêu nhiều nhất (Cao &rarr; Thấp)</option>
                    <option value="INCOME_DESC">Thu nhập nhiều nhất (Cao &rarr; Thấp)</option>
                    <option value="BALANCE_DESC">Thặng dư ròng nhiều nhất</option>
                    <option value="COUNT_DESC">Số giao dịch nhiều nhất</option>
                  </select>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Ngày & Thứ</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Thu Nhập (+)</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Chi Tiêu (-)</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Chênh Lệch Ròng</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>% Tổng Chi Tháng</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Số GD</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMonthDays.map((dayData) => {
                    const isSelected = selectedMonthDay === dayData.date;
                    const isToday = dayData.date === todayStr;
                    const percentOfTotalExpense = monthlyData.totalExpense > 0 ? ((dayData.expense / monthlyData.totalExpense) * 100) : 0;
                    const isPeak = dayData.expense > 0 && dayData.expense === monthlyData.maxExpense;

                    return (
                      <tr
                        key={dayData.date}
                        onClick={() => setSelectedMonthDay(dayData.date)}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(21, 128, 61, 0.08)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: isToday ? 'var(--accent-warning)' : 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Ngày {dayData.dayNumber}/{monthInfo.month}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>({dayData.fullWeekday})</span>
                            {isToday && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(217, 119, 6, 0.15)', color: 'var(--accent-warning)', padding: '1px 5px', borderRadius: '4px' }}>Hôm nay</span>
                            )}
                            {isPeak && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', padding: '1px 5px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Flame size={10} /> Đỉnh chi
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'right', color: dayData.income > 0 ? 'var(--accent-success)' : 'var(--text-dim)', fontWeight: dayData.income > 0 ? 600 : 400 }}>
                          {dayData.income > 0 ? `+${formatVND(dayData.income)}` : '0₫'}
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'right', color: dayData.expense > 0 ? 'var(--accent-danger)' : 'var(--text-dim)', fontWeight: dayData.expense > 0 ? 700 : 400 }}>
                          {dayData.expense > 0 ? `-${formatVND(dayData.expense)}` : '0₫'}
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: dayData.balance > 0 ? 'var(--accent-success)' : dayData.balance < 0 ? 'var(--accent-danger)' : 'var(--text-dim)' }}>
                          {dayData.balance > 0 ? `+${formatVND(dayData.balance)}` : formatVND(dayData.balance)}
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {dayData.expense > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                              <div style={{ width: '50px', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, percentOfTotalExpense)}%`, height: '100%', background: isPeak ? 'var(--accent-danger)' : 'var(--accent-primary)' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '35px' }}>{percentOfTotalExpense.toFixed(1)}%</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>0%</span>
                          )}
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          {dayData.count}
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              switchToDayView(dayData.date);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            title="Chuyển sang xem 4 ca của ngày này"
                          >
                            Xem 4 Ca &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ================== INSPECT SELECTED DAY DRAWER ================== */}
          {selectedDayData && (
            <div className="glass-card" style={{ padding: '1.25rem', border: '1.5px solid var(--accent-primary)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} color="var(--accent-primary)" />
                    Chi Tiết Giao Dịch: Ngày {selectedDayData.dayNumber}/{monthInfo.month}/{monthInfo.year} ({selectedDayData.fullWeekday})
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    <span>Thu: <strong style={{ color: 'var(--accent-success)' }}>+{formatVND(selectedDayData.income)}</strong></span>
                    <span>&bull;</span>
                    <span>Chi: <strong style={{ color: 'var(--accent-danger)' }}>-{formatVND(selectedDayData.expense)}</strong></span>
                    <span>&bull;</span>
                    <span>Chênh lệch: <strong style={{ color: selectedDayData.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                      {selectedDayData.balance > 0 ? `+${formatVND(selectedDayData.balance)}` : formatVND(selectedDayData.balance)}
                    </strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => switchToDayView(selectedDayData.date)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Clock size={14} /> Xem Chi Tiết 4 Ca &rarr;
                  </button>
                  <button
                    onClick={() => handleOpenCreate(undefined, selectedDayData.date)}
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Thêm Giao Dịch
                  </button>
                </div>
              </div>

              {/* Transactions on Selected Day */}
              {selectedDayData.transactions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Không có giao dịch nào trong ngày này</p>
                  <button
                    onClick={() => handleOpenCreate(undefined, selectedDayData.date)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    <Plus size={14} /> Thêm Giao Dịch Cho Ngày {selectedDayData.dayNumber}/{monthInfo.month}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {selectedDayData.transactions.map((tx) => {
                    const slotConfig = TIME_SLOTS[tx.timeSlot] || TIME_SLOTS.MORNING;
                    const SlotIcon = getSlotIcon(tx.timeSlot);
                    const isIncome = tx.type === 'INCOME';

                    return (
                      <div
                        key={tx.id || tx._id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderLeft: `3px solid ${isIncome ? 'var(--accent-success)' : 'var(--accent-danger)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            background: isIncome ? 'rgba(21, 128, 61, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isIncome ? 'var(--accent-success)' : 'var(--accent-danger)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{tx.title}</span>
                              <span className="tag-pill" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{tx.category}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <span style={{ color: slotConfig.color, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <SlotIcon size={11} /> {slotConfig.label} ({tx.time || slotConfig.timeRange})
                              </span>
                              {tx.note && <span>&bull; {tx.note}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: isIncome ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                              {isIncome ? `+${formatVND(tx.amount)}` : `-${formatVND(tx.amount)}`}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <button onClick={() => handleOpenEdit(tx)} className="btn-icon" title="Sửa">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDelete(tx.id || tx._id)} className="btn-icon" title="Xóa" style={{ color: 'var(--accent-danger)' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================== MONTHLY ANALYTICS & INSIGHTS ================== */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Top Spending Days */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Flame size={16} color="var(--accent-danger)" /> Top Ngày Chi Tiêu Nhiều Nhất Tháng
              </h3>
              {topSpendingDays.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu chi tiêu trong tháng này</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {topSpendingDays.map((topDay, idx) => {
                    const pct = monthlyData.totalExpense > 0 ? (topDay.expense / monthlyData.totalExpense) * 100 : 0;
                    return (
                      <div
                        key={topDay.date}
                        onClick={() => setSelectedMonthDay(topDay.date)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: idx === 0 ? 'var(--accent-danger)' : 'rgba(20, 83, 45, 0.1)',
                            color: idx === 0 ? '#fff' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              Ngày {topDay.dayNumber}/{monthInfo.month} ({topDay.weekday})
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {topDay.count} giao dịch &bull; Chiếm {pct.toFixed(1)}% tổng chi
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-danger)' }}>
                          -{formatVND(topDay.expense)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Expense Categories Breakdown in Month */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PieChart size={16} color="var(--accent-primary)" /> Cơ Cấu Danh Mục Chi Tiêu Trong Tháng
              </h3>
              {Object.keys(monthlyData.categoryStats.EXPENSE).length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chưa có danh mục chi tiêu</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {Object.entries(monthlyData.categoryStats.EXPENSE)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([cat, amount]) => {
                      const pct = monthlyData.totalExpense > 0 ? (amount / monthlyData.totalExpense) * 100 : 0;
                      return (
                        <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{cat}</span>
                            <span style={{ fontWeight: 600, color: 'var(--accent-danger)' }}>
                              {formatVND(amount)} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({pct.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ------------------------ MODAL CREATE / EDIT ---------------------------- */}
      {/* ========================================================================= */}
      {isModalVisible && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 700 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(20, 83, 45, 0.06)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
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
                    color: formType === 'EXPENSE' ? '#fff' : 'var(--text-muted)',
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
                    color: formType === 'INCOME' ? '#fff' : 'var(--text-muted)',
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
                          background: isSelected ? `${config.color}15` : 'var(--bg-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon size={16} color={config.color} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? 'var(--text-main)' : 'var(--text-muted)' }}>
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
