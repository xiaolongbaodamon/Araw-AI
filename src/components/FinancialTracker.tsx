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
} from 'lucide-react';
import { FinancialState, FinancialItem } from '../types';

interface FinancialTrackerProps {
  finances: FinancialState;
  onAddTransaction: (transaction: Omit<FinancialItem, 'id' | 'date'>) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateBudget: (dailyBudget: number, monthlySavingsTarget: number) => void;
  onChangeCurrency: (currency: string) => void;
}

export const FinancialTracker: React.FC<FinancialTrackerProps> = ({
  finances,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateBudget,
  onChangeCurrency,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // New transaction form
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'savings'>('expense');
  const [category, setCategory] = useState<FinancialItem['category']>('Food');
  const [note, setNote] = useState('');

  // Budget editing
  const [tempDailyBudget, setTempDailyBudget] = useState(finances.dailyBudget);
  const [tempSavingsTarget, setTempSavingsTarget] = useState(finances.monthlySavingsTarget);

  const todayStr = '2026-09-05';

  const todayExpenses = finances.transactions
    .filter((t) => t.date === todayStr && t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const remainingBudget = finances.dailyBudget - todayExpenses;
  const budgetUsagePercent = Math.min(100, Math.round((todayExpenses / (finances.dailyBudget || 1)) * 100));

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
      note: note.trim() || `${category} log`,
    });

    setAmount('');
    setNote('');
    setShowAddForm(false);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBudget(Number(tempDailyBudget) || 500, Number(tempSavingsTarget) || 5000);
    setShowBudgetModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview Header */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Financial Peace & Goal Guard
              </span>
              <span className="text-xs text-stone-600">Daily Guardrails & Savings Discipline</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              Personal Financial Wellness
            </h2>
            <p className="text-xs text-stone-600 max-w-xl">
              Eliminate money anxiety with automated daily spending boundaries and real-time savings trajectory.
            </p>
          </div>

          {/* Controls: Currency switcher & Edit Budget */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-stone-100 p-1 text-xs font-bold text-stone-700">
              {['₱', '$', '€'].map((c) => (
                <button
                  key={c}
                  onClick={() => onChangeCurrency(c)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    finances.currency === c ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setTempDailyBudget(finances.dailyBudget);
                setTempSavingsTarget(finances.monthlySavingsTarget);
                setShowBudgetModal(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-xs font-medium text-stone-700"
            >
              Adjust Targets
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

      {/* Cards: Daily Budget & Monthly Savings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Daily Budget */}
        <div className="rounded-xl bg-white border border-stone-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Daily Spending Guardrail
              </span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              remainingBudget < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {remainingBudget >= 0 ? `${finances.currency}${remainingBudget} Remaining` : 'Over Daily Cap'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-3xl font-bold text-stone-900">
                {finances.currency}{todayExpenses}
              </span>
              <span className="text-xs text-stone-500 ml-1.5">
                spent of {finances.currency}{finances.dailyBudget} limit
              </span>
            </div>
            <span className="text-xs font-semibold text-stone-600">
              {budgetUsagePercent}%
            </span>
          </div>

          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetUsagePercent > 90 ? 'bg-rose-500' : budgetUsagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetUsagePercent}%` }}
            ></div>
          </div>

          <div className="text-[11px] text-stone-600 flex items-center gap-1.5 pt-1">
            <AlertCircle className="w-3.5 h-3.5 text-stone-600" />
            <span>
              {remainingBudget > 0
                ? `Discipline check: Remaining budget covers dinner or travel without dipping into savings.`
                : `Daily cap exceeded. Review non-essential micro-spending to keep monthly plans intact.`}
            </span>
          </div>
        </div>

        {/* Card 2: Monthly Savings Target */}
        <div className="rounded-xl bg-white border border-stone-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <PiggyBank className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Monthly Savings Goal
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {savingsProgressPercent}% of Goal
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-3xl font-bold text-stone-900">
                {finances.currency}{totalSaved}
              </span>
              <span className="text-xs text-stone-500 ml-1.5">
                of {finances.currency}{finances.monthlySavingsTarget} target
              </span>
            </div>
            <span className="text-xs font-semibold text-stone-600">
              {finances.currency}{Math.max(0, finances.monthlySavingsTarget - totalSaved)} to go
            </span>
          </div>

          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${savingsProgressPercent}%` }}
            ></div>
          </div>

          <div className="text-[11px] text-stone-600 flex items-center gap-1.5 pt-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              On track: Consistency in daily meal budgeting fuels this monthly emergency fund.
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl bg-white border border-stone-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">
            Recent Financial Records
          </h3>
          <span className="text-xs text-stone-500">
            {finances.transactions.length} record(s) logged
          </span>
        </div>

        <div className="space-y-2">
          {finances.transactions.map((tr) => (
            <div
              key={tr.id}
              className="flex items-center justify-between p-3 rounded-lg border border-stone-100 hover:bg-stone-50/80 transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    tr.type === 'savings'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {tr.type === 'savings' ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-stone-900">{tr.note}</div>
                  <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                    <span>{tr.category}</span>
                    <span>•</span>
                    <span>{tr.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`font-bold ${
                    tr.type === 'savings' ? 'text-emerald-700' : 'text-stone-900'
                  }`}
                >
                  {tr.type === 'savings' ? '+' : '-'}{finances.currency}{tr.amount}
                </span>
                <button
                  onClick={() => onDeleteTransaction(tr.id)}
                  className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-4">
              Log Financial Entry
            </h3>
            <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Entry Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-1.5 rounded-lg border font-semibold ${
                      type === 'expense'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('savings')}
                    className={`py-1.5 rounded-lg border font-semibold ${
                      type === 'savings'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    Savings Deposit
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Amount ({finances.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 150"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Food">Food & Nourishment</option>
                  <option value="Transport">Commute & Transport</option>
                  <option value="Study & Books">Study Materials & Books</option>
                  <option value="Tools & Subscriptions">Tools & Subscriptions</option>
                  <option value="Bills">Bills & Utilities</option>
                  <option value="Leisure">Leisure & Social</option>
                  <option value="Savings">Savings & Emergency</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Grocery staples or bus pass reload"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                >
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-4">
              Configure Financial Guardrails
            </h3>
            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Daily Spending Target ({finances.currency})
                </label>
                <input
                  type="number"
                  value={tempDailyBudget}
                  onChange={(e) => setTempDailyBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Monthly Savings Target ({finances.currency})
                </label>
                <input
                  type="number"
                  value={tempSavingsTarget}
                  onChange={(e) => setTempSavingsTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                >
                  Update Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
