import { useState, useEffect } from 'react';
import {
  Users,
  FolderKanban,
  DollarSign,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock
} from 'lucide-react';
import { getCustomers, getProjects, getAllPayments, formatCurrency, formatDate } from '../services/googleSheets';

export default function Dashboard({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeProjects: 0,
    totalRevenue: 0,
    pendingEstimates: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [customersData, projectsData, paymentsData] = await Promise.all([
        getCustomers(),
        getProjects(),
        getAllPayments(),
      ]);

      setCustomers(customersData);

      // Calculate stats
      const activeProjects = projectsData.filter(p =>
        ['approved', 'in-progress'].includes(p.status)
      ).length;

      const pendingEstimates = projectsData.filter(p =>
        p.status === 'estimate'
      ).length;

      const totalRevenue = paymentsData.reduce((sum, p) =>
        sum + (parseFloat(p.amount) || 0), 0
      );

      setStats({
        totalCustomers: customersData.length,
        activeProjects,
        totalRevenue,
        pendingEstimates,
      });

      // Get recent projects (last 5)
      const sorted = [...projectsData].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentProjects(sorted.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown';
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'estimate': 'badge-estimate',
      'approved': 'badge-approved',
      'in-progress': 'badge-in-progress',
      'completed': 'badge-completed',
      'cancelled': 'badge-cancelled',
    };
    return `badge ${statusClasses[status] || 'badge-estimate'}`;
  };

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderKanban,
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Pending Estimates',
      value: stats.pendingEstimates,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
    },
  ];

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-100">Dashboard</h1>
        <p className="text-stone-400 mt-1">Welcome back! Here's an overview of your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-stone-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-stone-100 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => onNavigate('customers')}
          className="card card-hover flex items-center gap-4 text-left"
        >
          <div className="p-3 rounded-xl bg-blue-500/20">
            <Plus className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-stone-100">Add Customer</p>
            <p className="text-sm text-stone-400">Create a new customer profile</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('projects')}
          className="card card-hover flex items-center gap-4 text-left"
        >
          <div className="p-3 rounded-xl bg-amber-500/20">
            <FolderKanban className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="font-medium text-stone-100">New Project</p>
            <p className="text-sm text-stone-400">Start a new estimate or project</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('schedule')}
          className="card card-hover flex items-center gap-4 text-left"
        >
          <div className="p-3 rounded-xl bg-green-500/20">
            <Clock className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="font-medium text-stone-100">View Schedule</p>
            <p className="text-sm text-stone-400">Check upcoming work days</p>
          </div>
        </button>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-100">Recent Projects</h2>
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <p className="text-stone-400 text-center py-8">No projects yet. Create your first project!</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Estimate</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="font-medium text-stone-200">{project.projectName}</td>
                    <td className="text-stone-400">{getCustomerName(project.customerId)}</td>
                    <td>
                      <span className={getStatusBadge(project.status)}>
                        {project.status?.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="text-stone-300">{formatCurrency(project.estimateAmount)}</td>
                    <td className="text-stone-400">{formatDate(project.createdAt)}</td>
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
