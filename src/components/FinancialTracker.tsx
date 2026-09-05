import React, { useState } from 'react';
import {
  Wallet,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  AlertCircle,
  Tag,
  DollarSign,
  Calendar,
  Layers,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { FinancialState, FinancialItem } from '../types';

interface FinancialTrackerProps {
  finances: FinancialState;
  onAddTransaction: (transaction: Omit<FinancialItem, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateBudget: (dailyBudget: number, monthlySavingsTarget: number, weeklyBudget?: number, monthlyBudget?: number) => void;
  onChangeCurrency: (currency: string) => void;
}

export const FinancialTracker: React.FC<FinancialTrackerProps> = ({
  finances,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateBudget,
  onChangeCurrency,
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // New transaction form
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'savings'>('expense');
  const [category, setCategory] = useState<FinancialItem['category']>('Food');
  const [transactionDate, setTransactionDate] = useState('2026-09-05');
  const [note, setNote] = useState('');

  // Budgets state for modal
  const [tempDailyBudget, setTempDailyBudget] = useState(finances.dailyBudget);
  const [tempWeeklyBudget, setTempWeeklyBudget] = useState(finances.weeklyBudget || finances.dailyBudget * 7);
  const [tempMonthlyBudget, setTempMonthlyBudget] = useState(finances.monthlyBudget || finances.dailyBudget * 30);
  const [tempSavingsTarget, setTempSavingsTarget] = useState(finances.monthlySavingsTarget);

  const todayStr = '2026-09-05';
  const currency = finances.currency || '₱';

  // SPENDING CALCULATIONS:
  // 1. Daily (Today)
  const todayExpenses = finances.transactions
    .filter((t) => (t.date === todayStr || !t.date) && t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const dailyRemaining = finances.dailyBudget - todayExpenses;
  const dailyPercent = Math.min(100, Math.round((todayExpenses / (finances.dailyBudget || 1)) * 100));

  // 2. Weekly (7-day rollup)
  const weeklyBudget = finances.weeklyBudget || finances.dailyBudget * 7;
  const weeklyExpenses = finances.transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const weeklyRemaining = weeklyBudget - weeklyExpenses;
  const weeklyPercent = Math.min(100, Math.round((weeklyExpenses / (weeklyBudget || 1)) * 100));

  // 3. Monthly
  const monthlyBudget = finances.monthlyBudget || weeklyBudget * 4;
  const monthlyExpenses = weeklyExpenses; // In prototype, transactions represent current month
  const monthlyRemaining = monthlyBudget - monthlyExpenses;
  const monthlyPercent = Math.min(100, Math.round((monthlyExpenses / (monthlyBudget || 1)) * 100));

  // Savings progress
  const totalSaved = finances.currentSavings;
  const savingsProgressPercent = Math.min(
    100,
    Math.round((totalSaved / (finances.monthlySavingsTarget || 1)) * 100)
  );

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      amount: parsedAmount,
      type,
      category,
      date: transactionDate,
      note: note.trim() || `${category} expenditure`,
    });

    setAmount('');
    setNote('');
    setShowAddForm(false);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBudget(
      Number(tempDailyBudget) || 500,
      Number(tempSavingsTarget) || 5000,
      Number(tempWeeklyBudget) || 3500,
      Number(tempMonthlyBudget) || 15000
    );
    setShowBudgetModal(false);
  };

  // Filter transactions according to active timeframe
  const displayedTransactions = finances.transactions.filter((t) => {
    if (activeTimeframe === 'day') return t.date === todayStr || !t.date;
    return true; // week, month, all
  });

  return (
    <div className="space-y-6">
      {/* Financial Overview Header */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-stone-900">
              Finances & Budget
            </h2>
            <p className="text-xs text-stone-500 max-w-xl">
              Track daily expenses and monitor budget limits.
            </p>
          </div>

          {/* Controls: Currency switcher, Targets, Log */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-stone-100 p-1 text-xs font-bold text-stone-700">
              {['₱', '$', '€'].map((c) => (
                <button
                  key={c}
                  onClick={() => onChangeCurrency(c)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    currency === c ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setTempDailyBudget(finances.dailyBudget);
                setTempWeeklyBudget(finances.weeklyBudget || finances.dailyBudget * 7);
                setTempMonthlyBudget(finances.monthlyBudget || finances.dailyBudget * 30);
                setTempSavingsTarget(finances.monthlySavingsTarget);
                setShowBudgetModal(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-xs font-medium text-stone-700"
            >
              Set Budgets
            </button>

            <button
              onClick={() => setShowAddForm(true)}
              className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-HORIZON SPENDING CARDS: Daily, Weekly, Monthly */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: DAILY SPEND */}
        <div
          onClick={() => setActiveTimeframe('day')}
          className={`rounded-xl p-5 border cursor-pointer transition-all ${
            activeTimeframe === 'day'
              ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
              : 'bg-white border-stone-200 shadow-2xs hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Daily Spending</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                dailyRemaining < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {dailyRemaining >= 0 ? `${currency}${dailyRemaining} left` : 'Over Limit'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-stone-900">
              {currency}{todayExpenses}
              <span className="text-xs font-normal text-stone-500 font-sans ml-1">
                / {currency}{finances.dailyBudget}
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  dailyRemaining < 0 ? 'bg-rose-500' : dailyPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, dailyPercent)}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex justify-between">
              <span>Today's Total</span>
              <span>{dailyPercent}% used</span>
            </div>
          </div>
        </div>

        {/* CARD 2: WEEKLY SPEND */}
        <div
          onClick={() => setActiveTimeframe('week')}
          className={`rounded-xl p-5 border cursor-pointer transition-all ${
            activeTimeframe === 'week'
              ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-400/30 shadow-xs'
              : 'bg-white border-stone-200 shadow-2xs hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Weekly Spending</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                weeklyRemaining < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {weeklyRemaining >= 0 ? `${currency}${weeklyRemaining} left` : 'Over Weekly'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-stone-900">
              {currency}{weeklyExpenses}
              <span className="text-xs font-normal text-stone-500 font-sans ml-1">
                / {currency}{weeklyBudget}
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  weeklyRemaining < 0 ? 'bg-rose-500' : weeklyPercent > 80 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, weeklyPercent)}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex justify-between">
              <span>This Week's Pace</span>
              <span>{weeklyPercent}% used</span>
            </div>
          </div>
        </div>

        {/* CARD 3: MONTHLY SPEND & SAVINGS TARGET */}
        <div
          onClick={() => setActiveTimeframe('month')}
          className={`rounded-xl p-5 border cursor-pointer transition-all ${
            activeTimeframe === 'month'
              ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-400/30 shadow-xs'
              : 'bg-white border-stone-200 shadow-2xs hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-purple-600" />
              <span>Monthly Spending</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                monthlyRemaining < 0 ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
              }`}
            >
              {monthlyRemaining >= 0 ? `${currency}${monthlyRemaining} left` : 'Over Month'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-stone-900">
              {currency}{monthlyExpenses}
              <span className="text-xs font-normal text-stone-500 font-sans ml-1">
                / {currency}{monthlyBudget}
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, monthlyPercent)}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex justify-between">
              <span>Monthly Target</span>
              <span>Target Savings: {currency}{finances.monthlySavingsTarget}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Transactions Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTimeframe('day')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTimeframe === 'day' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Today's Log ({finances.transactions.filter((t) => t.date === todayStr || !t.date).length})
          </button>
          <button
            onClick={() => setActiveTimeframe('week')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTimeframe === 'week' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            This Week ({finances.transactions.length})
          </button>
          <button
            onClick={() => setActiveTimeframe('month')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTimeframe === 'month' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            This Month
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Log Expense</span>
        </button>
      </div>

      {/* Transactions List */}
      <div className="rounded-xl bg-white border border-stone-200 overflow-hidden shadow-2xs">
        <div className="p-3 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-700 flex items-center justify-between">
          <span>Logged Transactions ({displayedTransactions.length})</span>
          <span className="text-[11px] text-stone-500 font-normal">
            Showing: {activeTimeframe === 'day' ? "Today's purchases" : 'All current horizon entries'}
          </span>
        </div>

        {displayedTransactions.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs space-y-2">
            <div>No transactions logged for this timeframe.</div>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-amber-700 font-semibold underline"
            >
              Log your first expense today
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 text-xs">
            {displayedTransactions.map((item) => (
              <div
                key={item.id}
                className="p-3.5 flex items-center justify-between hover:bg-stone-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                      item.type === 'savings'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {item.type === 'savings' ? '₱' : '💸'}
                  </div>

                  <div>
                    <div className="font-semibold text-stone-900">{item.note}</div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2">
                      <span className="font-medium text-stone-600">{item.category}</span>
                      <span>•</span>
                      <span>{item.date || todayStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold text-sm ${
                      item.type === 'savings' ? 'text-emerald-600' : 'text-stone-900'
                    }`}
                  >
                    {item.type === 'savings' ? '+' : '-'}{currency}{item.amount}
                  </span>

                  <button
                    onClick={() => onDeleteTransaction(item.id)}
                    className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Log Expense / Transaction */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Log Expense or Savings
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Enter the amount spent and category. It will automatically update your daily, weekly, and monthly totals.
            </p>

            <form onSubmit={handleCreateTransaction} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-500 font-bold">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    required
                    min={1}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'expense' | 'savings')}
                    className="w-full px-2.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="savings">Savings Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Food">Food & Dining</option>
                  <option value="Transport">Transport & Commute</option>
                  <option value="Study & Books">Study, Books & School Supplies</option>
                  <option value="Tools & Subscriptions">Work Tools & Software</option>
                  <option value="Bills">Bills & Utilities</option>
                  <option value="Leisure">Leisure & Social</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lunch with team, Physics textbook, Coffee"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Set Daily, Weekly, Monthly Budgets */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Adjust Spending Limits & Targets
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Set guardrails for daily, weekly, and monthly spending plus your monthly savings goal.
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Daily Spending Limit ({currency})
                </label>
                <input
                  type="number"
                  min={10}
                  value={tempDailyBudget}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTempDailyBudget(val);
                    setTempWeeklyBudget(val * 7);
                    setTempMonthlyBudget(val * 30);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Weekly Spending Limit ({currency})
                </label>
                <input
                  type="number"
                  min={50}
                  value={tempWeeklyBudget}
                  onChange={(e) => setTempWeeklyBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Monthly Spending Limit ({currency})
                </label>
                <input
                  type="number"
                  min={200}
                  value={tempMonthlyBudget}
                  onChange={(e) => setTempMonthlyBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Monthly Savings Target ({currency})
                </label>
                <input
                  type="number"
                  min={0}
                  value={tempSavingsTarget}
                  onChange={(e) => setTempSavingsTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                >
                  Save Budgets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
