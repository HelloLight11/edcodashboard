import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Search
} from 'lucide-react';
import { getAllPayments, getProjects, getCustomers, formatCurrency, formatDate } from '../services/googleSheets';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, projectsData, customersData] = await Promise.all([
        getAllPayments(),
        getProjects(),
        getCustomers(),
      ]);
      setPayments(paymentsData);
      setProjects(projectsData);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.projectName || 'Unknown Project';
  };

  const getCustomerNameByProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'Unknown';
    const customer = customers.find(c => c.id === project.customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown';
  };

  // Calculate stats
  const totalReceived = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalContractValue = projects.reduce((sum, p) => sum + (parseFloat(p.contractAmount) || 0), 0);
  const outstandingBalance = totalContractValue - totalReceived;

  // Sort payments by date (newest first)
  const sortedPayments = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredPayments = sortedPayments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    return (
      getProjectName(payment.projectId).toLowerCase().includes(searchLower) ||
      getCustomerNameByProject(payment.projectId).toLowerCase().includes(searchLower) ||
      payment.method?.toLowerCase().includes(searchLower) ||
      payment.note?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-100">Payments</h1>
        <p className="text-stone-400 mt-1">Track all payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">Total Received</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(totalReceived)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">Outstanding Balance</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(outstandingBalance)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Receipt className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">Transaction Count</p>
              <p className="text-xl font-bold text-stone-100">{payments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        {filteredPayments.length === 0 ? (
          <p className="text-stone-400 text-center py-8">
            {searchTerm ? 'No payments match your search.' : 'No payments recorded yet.'}
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="text-stone-200">{formatDate(payment.date)}</td>
                    <td className="text-stone-300">{getProjectName(payment.projectId)}</td>
                    <td className="text-stone-400">{getCustomerNameByProject(payment.projectId)}</td>
                    <td className="text-green-400 font-medium">{formatCurrency(payment.amount)}</td>
                    <td>
                      <span className="px-2 py-1 rounded-md bg-stone-700 text-stone-300 text-sm">
                        {payment.method}
                      </span>
                    </td>
                    <td className="text-stone-400">{payment.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
