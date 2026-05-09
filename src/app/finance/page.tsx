'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  Download, 
  Plus,
  Filter,
  CheckCircle2,
  ReceiptText,
  Printer,
  Users,
  PieChart,
  ArrowDownRight,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { Payment, Expense, Budget, Student, Intake } from '@/types';
import { supabase } from '@/lib/supabase';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'receivables' | 'budgeting'>('receivables');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [
        { data: paymentsData },
        { data: expensesData },
        { data: studentsData },
        { data: intakesData },
        { data: budgetsData }
      ] = await Promise.all([
        supabase.from('payments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('students').select('*'),
        supabase.from('intakes').select('*'),
        supabase.from('budgets').select('*')
      ]);

      if (paymentsData) setPayments(paymentsData);
      if (expensesData) setExpenses(expensesData);
      if (studentsData) {
        setStudents(studentsData);
        if (studentsData.length > 0) setFormData(prev => ({ ...prev, studentId: studentsData[0].id }));
      }
      if (intakesData) {
        setIntakes(intakesData);
        if (intakesData.length > 0) setBatchFormData(prev => ({ ...prev, intakeId: intakesData[0].id }));
      }
      if (budgetsData) setBudgets(budgetsData);

      setIsLoading(false);
    }
    loadData();
  }, []);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ payment: Payment, type: 'receipt' | 'invoice' } | null>(null);

  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    type: 'tuition',
    status: 'pending',
    method: 'bank_transfer'
  });

  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    category: 'facilities',
    amount: '',
    status: 'paid'
  });

  const [batchFormData, setBatchFormData] = useState({
    intakeId: '',
    tuitionFee: '',
    materialFee: ''
  });

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordPaymentData, setRecordPaymentData] = useState({
    paymentId: '',
    amount: '',
    method: 'bank_transfer'
  });

  const [budgetMonth, setBudgetMonth] = useState('all');

  // AR Computations
  const totalReceived = payments.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : (p.paidAmount || 0)), 0);
  const totalPending = payments.reduce((sum, p) => {
    if (p.status === 'paid') return sum;
    const due = p.amount - (p.paidAmount || 0);
    return sum + due;
  }, 0);
  const overdueCount = payments.filter(p => p.status === 'overdue').length;
  const filteredPayments = payments.filter(p => statusFilter === 'all' || p.status === statusFilter);

  // Budgeting Computations
  const availableMonths = Array.from(new Set(expenses.map(e => e.date.substring(0, 7)))).sort().reverse();
  
  const displayedExpenses = budgetMonth === 'all' ? expenses : expenses.filter(e => e.date.startsWith(budgetMonth));
  const budgetFactor = budgetMonth === 'all' ? 1 : (1 / 12);
  
  const totalExpenses = displayedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAllocatedBudget = budgets.reduce((sum, b) => sum + (b.allocated * budgetFactor), 0);
  
  // For net profit, if we filter by month, we should also filter payments by month.
  const displayedReceived = budgetMonth === 'all' 
    ? totalReceived 
    : payments.filter(p => p.date.startsWith(budgetMonth)).reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : (p.paidAmount || 0)), 0);
    
  const netProfit = displayedReceived - totalExpenses;

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPayment: Payment = {
      id: `inv${Date.now()}`,
      studentId: formData.studentId,
      amount: Number(formData.amount),
      paidAmount: formData.status === 'paid' ? Number(formData.amount) : 0,
      type: formData.type as any,
      status: formData.status as any,
      method: formData.status === 'paid' ? (formData.method as any) : undefined,
      date: new Date().toISOString().split('T')[0]
    };
    
    const { error } = await supabase.from('payments').insert([newPayment]);
    if (error) {
      alert(`Error creating payment: ${error.message}`);
      return;
    }

    setPayments([newPayment, ...payments]);
    setIsModalOpen(false);
    setFormData({ ...formData, amount: '' });
  };

  const handleBatchBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudents = students.filter(s => s.intakeId === batchFormData.intakeId);
    
    if (targetStudents.length === 0) {
      alert("No students found in this intake.");
      return;
    }

    const newPayments: Payment[] = [];
    const dateStr = new Date().toISOString().split('T')[0];

    targetStudents.forEach(student => {
      // Tuition Fee Invoice
      if (batchFormData.tuitionFee && Number(batchFormData.tuitionFee) > 0) {
        newPayments.push({
          id: `inv${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
          studentId: student.id,
          amount: Number(batchFormData.tuitionFee),
          paidAmount: 0,
          type: 'tuition',
          status: 'pending',
          date: dateStr
        });
      }
      // Material Fee Invoice
      if (batchFormData.materialFee && Number(batchFormData.materialFee) > 0) {
        newPayments.push({
          id: `inv${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
          studentId: student.id,
          amount: Number(batchFormData.materialFee),
          paidAmount: 0,
          type: 'material',
          status: 'pending',
          date: dateStr
        });
      }
    });

    const { error } = await supabase.from('payments').insert(newPayments);
    if (error) {
      alert(`Error creating batch payments: ${error.message}`);
      return;
    }

    setPayments([...newPayments, ...payments]);
    setIsBatchModalOpen(false);
    setBatchFormData({ ...batchFormData, tuitionFee: '', materialFee: '' });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const payment = payments.find(p => p.id === recordPaymentData.paymentId);
    if (!payment) return;

    const currentPaid = payment.paidAmount || 0;
    const additionalAmount = Number(recordPaymentData.amount);
    const newTotalPaid = currentPaid + additionalAmount;
    
    const newStatus = newTotalPaid >= payment.amount ? 'paid' : 'partial';
    const newDate = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('payments')
      .update({
        paidAmount: newTotalPaid,
        status: newStatus,
        method: recordPaymentData.method as any,
        date: newDate
      })
      .eq('id', recordPaymentData.paymentId);

    if (error) {
      alert(`Error recording payment: ${error.message}`);
      return;
    }

    setPayments(prev => prev.map(p => {
      if (p.id === recordPaymentData.paymentId) {
        return {
          ...p,
          paidAmount: newTotalPaid,
          status: newStatus,
          method: recordPaymentData.method as any,
          date: newDate
        };
      }
      return p;
    }));
    
    setIsRecordModalOpen(false);
    setRecordPaymentData({ paymentId: '', amount: '', method: 'bank_transfer' });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: `ex${Date.now()}`,
      title: expenseFormData.title,
      category: expenseFormData.category as any,
      amount: Number(expenseFormData.amount),
      status: expenseFormData.status as any,
      date: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase.from('expenses').insert([newExpense]);
    if (error) {
      alert(`Error creating expense: ${error.message}`);
      return;
    }

    setExpenses([newExpense, ...expenses]);
    setIsExpenseModalOpen(false);
    setExpenseFormData({ ...expenseFormData, title: '', amount: '' });
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading finance data...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Finance & Budgeting</h2>
          <p className="text-muted-foreground mt-1">Track receivables, allocate budgets, and manage school expenses.</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'receivables' ? (
            <>
              <button 
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-semibold transition-colors border border-indigo-200"
              >
                <Users size={18} />
                Batch Bill Intake
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus size={18} />
                Create Invoice
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-rose-700 transition-opacity shadow-sm"
            >
              <Plus size={18} />
              Record Expense
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('receivables')}
          className={cn(
            "pb-4 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'receivables' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <CreditCard size={16} />
          Accounts Receivable
        </button>
        <button 
          onClick={() => setActiveTab('budgeting')}
          className={cn(
            "pb-4 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'budgeting' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <PieChart size={16} />
          Budget & Expenses
        </button>
      </div>

      {activeTab === 'receivables' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Total Collected</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Received</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">${totalReceived.toLocaleString()}</h3>
        </div>
        
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Clock size={24} />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Expected</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">${totalPending.toLocaleString()}</h3>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Immediate Action</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Overdue Invoices</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{overdueCount} Invoices</h3>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex bg-muted p-1 rounded-xl">
            {['all', 'paid', 'pending', 'overdue'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all",
                  statusFilter === status ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors">
            <Filter size={16} />
            Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Student</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Description</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Method</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-center">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.map((payment) => {
                const student = students.find(s => s.id === payment.studentId);
                return (
                  <tr key={payment.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{student?.firstName} {student?.lastName}</span>
                        <span className="text-xs text-muted-foreground">{student?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground capitalize">
                      {payment.type} Fee
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground">${payment.amount.toLocaleString()}</span>
                      {payment.status === 'partial' && (
                        <p className="text-xs text-amber-600 font-medium mt-0.5">Paid: ${(payment.paidAmount || 0).toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground uppercase">{payment.method?.replace('_', ' ') || '---'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full inline-block",
                        payment.status === 'paid' ? "bg-emerald-100 text-emerald-600" : 
                        payment.status === 'partial' ? "bg-amber-100 text-amber-600" :
                        payment.status === 'pending' ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                      )}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {payment.status === 'paid' && (
                          <button 
                            onClick={() => setSelectedDocument({ payment, type: 'receipt' })}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <ReceiptText size={14} />
                            Receipt
                          </button>
                        )}
                        {payment.status !== 'paid' && (
                          <>
                            <button 
                              onClick={() => setSelectedDocument({ payment, type: 'invoice' })}
                              className="px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <ReceiptText size={14} />
                              Invoice
                            </button>
                            <button 
                              onClick={() => {
                                setRecordPaymentData({ paymentId: payment.id, amount: String(payment.amount - (payment.paidAmount || 0)), method: 'bank_transfer' });
                                setIsRecordModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={14} />
                              Record Payment
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <select
              className="bg-muted border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold"
              value={budgetMonth}
              onChange={(e) => setBudgetMonth(e.target.value)}
            >
              <option value="all">Annual Overview (All Year)</option>
              {availableMonths.map(m => {
                const date = new Date(m + '-01');
                const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{monthName}</option>;
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Wallet size={24} />
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Total Allocation</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{budgetMonth === 'all' ? 'Annual Budget' : 'Monthly Budget'}</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">${totalAllocatedBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            </div>
            
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                  <ArrowDownRight size={24} />
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">Actual Spend</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{budgetMonth === 'all' ? 'Total Expenses (YTD)' : 'Monthly Expenses'}</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">${totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Profit Margin</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{budgetMonth === 'all' ? 'Net Operating Income' : 'Monthly Net Income'}</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Expenses Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Description</th>
                      <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Category</th>
                      <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Amount</th>
                      <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-foreground">{expense.title}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{expense.category}</td>
                        <td className="px-6 py-4 font-bold text-foreground">${expense.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full inline-block",
                            expense.status === 'paid' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                          )}>
                            {expense.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {displayedExpenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          No expenses recorded for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-6">
              <h3 className="text-lg font-bold text-foreground">Budget vs Real</h3>
              <div className="space-y-4">
                {budgets.map((budget: Budget) => {
                  const spent = displayedExpenses.filter(e => e.category === budget.category).reduce((s, e) => s + e.amount, 0);
                  const allocated = budget.allocated * budgetFactor;
                  const percentage = Math.min(100, allocated > 0 ? Math.round((spent / allocated) * 100) : 0);
                  return (
                    <div key={budget.category} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold capitalize text-foreground">{budget.category}</span>
                        <span className="text-xs font-medium text-muted-foreground">${spent.toLocaleString()} / ${allocated.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", percentage > 90 ? 'bg-rose-500' : percentage > 75 ? 'bg-amber-500' : 'bg-primary')} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {budgetMonth === 'all' && (
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden mt-8">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Annual P&L Breakdown</h3>
                  <p className="text-sm text-muted-foreground mt-1">Monthly distribution of budget vs actual performance.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Metric</th>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                        <th key={m} className="px-4 py-3 font-semibold text-muted-foreground text-right">{m}</th>
                      ))}
                      <th className="px-4 py-3 font-bold text-primary text-right bg-primary/5">YTD Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {/* Revenue Row */}
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-semibold text-foreground border-r border-border">
                        <div className="flex flex-col">
                          <span>Target Revenue</span>
                          <span className="text-xs text-muted-foreground font-normal">Real Revenue</span>
                        </div>
                      </td>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const monthStr = `2025-${String(i + 1).padStart(2, '0')}`;
                        const targetRev = 400000 / 12; // Assuming $400k annual target
                        const realRev = payments.filter(p => p.date.startsWith(monthStr)).reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : (p.paidAmount || 0)), 0);
                        return (
                          <td key={i} className="px-4 py-4 text-right">
                            <div className="flex flex-col gap-1">
                              <span className="text-muted-foreground">${Math.round(targetRev).toLocaleString()}</span>
                              <span className="font-bold text-emerald-600">${realRev.toLocaleString()}</span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-right bg-primary/5 font-bold">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">${(400000).toLocaleString()}</span>
                          <span className="text-emerald-600">${totalReceived.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Expenses Row */}
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-semibold text-foreground border-r border-border">
                        <div className="flex flex-col">
                          <span>Budgeted Expenses</span>
                          <span className="text-xs text-muted-foreground font-normal">Real Expenses</span>
                        </div>
                      </td>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const monthStr = `2025-${String(i + 1).padStart(2, '0')}`;
                        const budgetExp = budgets.reduce((sum: number, b: Budget) => sum + Number(b.allocated), 0) / 12;
                        const realExp = expenses.filter(e => e.date.startsWith(monthStr)).reduce((sum, e) => sum + e.amount, 0);
                        return (
                          <td key={i} className="px-4 py-4 text-right">
                            <div className="flex flex-col gap-1">
                              <span className="text-muted-foreground">${Math.round(budgetExp).toLocaleString()}</span>
                              <span className="font-bold text-rose-600">${realExp.toLocaleString()}</span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-right bg-primary/5 font-bold">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">${Math.round(budgets.reduce((sum: number, b: Budget) => sum + Number(b.allocated), 0)).toLocaleString()}</span>
                          <span className="text-rose-600">${totalExpenses.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Profit Row */}
                    <tr className="bg-muted/10">
                      <td className="px-4 py-4 font-bold text-foreground border-r border-border">
                        <div className="flex flex-col">
                          <span>Target Profit</span>
                          <span className="text-xs text-primary font-bold uppercase tracking-wider mt-1">Real Profit</span>
                        </div>
                      </td>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const monthStr = `2025-${String(i + 1).padStart(2, '0')}`;
                        const targetRev = 400000 / 12;
                        const budgetExp = budgets.reduce((sum: number, b: Budget) => sum + Number(b.allocated), 0) / 12;
                        const targetProfit = targetRev - budgetExp;

                        const realRev = payments.filter(p => p.date.startsWith(monthStr)).reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : (p.paidAmount || 0)), 0);
                        const realExp = expenses.filter(e => e.date.startsWith(monthStr)).reduce((sum, e) => sum + e.amount, 0);
                        const realProfit = realRev - realExp;

                        return (
                          <td key={i} className="px-4 py-4 text-right">
                            <div className="flex flex-col gap-1">
                              <span className="text-muted-foreground">${Math.round(targetProfit).toLocaleString()}</span>
                              <span className={cn("font-black text-lg", realProfit >= 0 ? "text-primary" : "text-rose-600")}>
                                ${realProfit.toLocaleString()}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-right bg-primary/5 font-black text-xl text-primary">
                        <div className="flex flex-col gap-1 text-base font-bold">
                          <span className="text-muted-foreground">${Math.round(400000 - budgets.reduce((sum: number, b: Budget) => sum + Number(b.allocated), 0)).toLocaleString()}</span>
                          <span className={cn("text-xl", netProfit >= 0 ? "text-primary" : "text-rose-600")}>
                            ${netProfit.toLocaleString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals remain unchanged below */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-6">
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm mb-4">
            <p><strong>Note:</strong> You can enter a partial amount. If the payment fully covers the remaining balance, the invoice will be marked as Paid.</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Amount Received ($)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={recordPaymentData.amount}
                  onChange={(e) => setRecordPaymentData({ ...recordPaymentData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Payment Method</label>
                <select
                  required
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={recordPaymentData.method}
                  onChange={(e) => setRecordPaymentData({ ...recordPaymentData, method: e.target.value })}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-8">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Invoice / Bill"
      >
        <form onSubmit={handleAddPayment} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Student</label>
              <select
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.email})</option>
                ))}
                {students.length === 0 && <option value="" disabled>No students found</option>}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Amount ($)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="2500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Payment Type</label>
                <select
                  required
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="tuition">Tuition Fee</option>
                  <option value="registration">Registration Fee</option>
                  <option value="material">Material Fee</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <select
                  required
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Payment Method</label>
                <select
                  required
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  disabled={formData.status !== 'paid'}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm"
            >
              Save Record
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Batch Bill Intake"
      >
        <form onSubmit={handleBatchBill} className="space-y-6">
          <div className="bg-indigo-50 text-indigo-700 p-4 rounded-xl text-sm mb-4">
            <p><strong>Note:</strong> This will instantly generate a pending <strong>Invoice</strong> for <strong>every enrolled student</strong> in the selected Intake Batch.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Target Intake Batch</label>
              <select
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={batchFormData.intakeId}
                onChange={(e) => setBatchFormData({ ...batchFormData, intakeId: e.target.value })}
              >
                {intakes.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.id})</option>
                ))}
                {intakes.length === 0 && <option value="" disabled>No intakes found</option>}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Tuition Fee ($)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={batchFormData.tuitionFee}
                  onChange={(e) => setBatchFormData({ ...batchFormData, tuitionFee: e.target.value })}
                  placeholder="e.g. 2500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Material Fee ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={batchFormData.materialFee}
                  onChange={(e) => setBatchFormData({ ...batchFormData, materialFee: e.target.value })}
                  placeholder="Optional (e.g. 150)"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-8">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
            >
              <Users size={16} />
              Generate Invoices
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Modal (Receipt or Invoice) */}
      <Modal
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        title={selectedDocument?.type === 'invoice' ? 'Invoice / Bill' : 'Payment Receipt'}
      >
        {selectedDocument && (
          <div className="space-y-6">
            {/* Printable Area */}
            <div id="receipt-print-area" className="bg-white border border-border rounded-2xl p-8 space-y-8 text-black">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-border pb-6">
                <div>
                  <h1 className="text-2xl font-black text-black">SMS Pro Academy</h1>
                  <p className="text-sm text-gray-500 mt-1">123 Education Boulevard</p>
                  <p className="text-sm text-gray-500">Singapore 123456</p>
                  <p className="text-sm text-gray-500">Tel: +65 6123 4567</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-black uppercase tracking-widest text-primary">
                    {selectedDocument.type === 'invoice' ? 'Invoice' : 'Receipt'}
                  </h2>
                  <p className="text-sm font-bold mt-2">No. {selectedDocument.payment.id.toUpperCase()}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(selectedDocument.payment.date).toLocaleDateString()}</p>
                  {selectedDocument.type === 'invoice' && (
                    <p className="text-sm font-bold text-red-500 mt-1 uppercase tracking-wider">Unpaid</p>
                  )}
                </div>
              </div>

              {/* Student Details */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</h3>
                {(() => {
                  const s = students.find(s => s.id === selectedDocument.payment.studentId);
                  return (
                    <div>
                      <p className="font-bold text-lg">{s?.firstName} {s?.lastName}</p>
                      <p className="text-sm text-gray-600">{s?.email}</p>
                      <p className="text-sm text-gray-600 font-mono mt-1">Student ID: {s?.id.toUpperCase()}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Line Items */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black/10">
                    <th className="py-3 text-sm font-bold text-black">Description</th>
                    <th className="py-3 text-sm font-bold text-black text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-4">
                      <p className="font-semibold text-black capitalize">{selectedDocument.payment.type} Fee</p>
                      <p className="text-xs text-gray-500 mt-1">Academic term payment</p>
                    </td>
                    <td className="py-4 text-right font-bold text-black">
                      ${selectedDocument.payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black/10">
                    <td className="py-2 text-right font-bold text-gray-500 uppercase text-xs">Total Billed</td>
                    <td className="py-2 text-right font-bold text-gray-700">
                      ${selectedDocument.payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  {(selectedDocument.payment.paidAmount || 0) > 0 && (
                    <tr>
                      <td className="py-2 text-right font-bold text-emerald-600 uppercase text-xs">Amount Paid</td>
                      <td className="py-2 text-right font-bold text-emerald-600">
                        -${(selectedDocument.payment.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-black/10">
                    <td className="py-4 text-right font-bold text-black uppercase">
                      {selectedDocument.type === 'invoice' ? 'Balance Due' : 'Total Paid'}
                    </td>
                    <td className={cn("py-4 text-right font-black text-2xl", selectedDocument.type === 'invoice' ? 'text-red-600' : 'text-emerald-600')}>
                      ${selectedDocument.type === 'invoice' 
                        ? (selectedDocument.payment.amount - (selectedDocument.payment.paidAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })
                        : (selectedDocument.payment.paidAmount || selectedDocument.payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })
                      }
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer */}
              <div className="pt-6 text-sm text-gray-500">
                {selectedDocument.type === 'receipt' ? (
                  <>
                    <p><span className="font-bold text-black">Payment Method:</span> <span className="uppercase">{selectedDocument.payment.method?.replace('_', ' ') || 'N/A'}</span></p>
                    <p className="mt-4 text-xs italic text-center text-gray-400">Thank you for your payment. This is a computer-generated receipt.</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-black mb-2">Payment Instructions:</p>
                    <p>Please make payment via Bank Transfer to: <strong>123-456-789 (DBS Bank)</strong></p>
                    <p>Quote your Student ID and Invoice No. as the reference.</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDocument(null)}
                className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm"
              >
                <Printer size={16} />
                {selectedDocument.type === 'invoice' ? 'Print Invoice' : 'Print Receipt'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Expense"
      >
        <form onSubmit={handleAddExpense} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Description</label>
              <input
                required
                type="text"
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 text-sm"
                value={expenseFormData.title}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
                placeholder="e.g. Printer Toner"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Category</label>
                <select
                  required
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 text-sm capitalize"
                  value={expenseFormData.category}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                >
                  {budgets.map(b => (
                    <option key={b.category} value={b.category}>{b.category}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Amount ($)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 text-sm"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Status</label>
              <select
                required
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 text-sm"
                value={expenseFormData.status}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, status: e.target.value })}
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-8">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
            >
              Add Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
