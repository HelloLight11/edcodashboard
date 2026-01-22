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
      label: 'Total 2026 Revenue',
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="flex flex-wrap -mx-3 mb-12">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="w-full sm:w-1/2 lg:w-1/4 px-3 mb-6">
              <div className="card card-hover h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap -mx-3 mb-12">
        <div className="w-full md:w-1/3 px-3 mb-6">
          <button
            onClick={() => onNavigate('customers')}
            className="card card-hover flex items-center gap-4 text-left w-full h-full"
          >
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Plus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Add Customer</p>
              <p className="text-sm text-gray-500">Create a new customer profile</p>
            </div>
          </button>
        </div>

        <div className="w-full md:w-1/3 px-3 mb-6">
          <button
            onClick={() => onNavigate('projects')}
            className="card card-hover flex items-center gap-4 text-left w-full h-full"
          >
            <div className="p-3 rounded-xl bg-amber-500/20">
              <FolderKanban className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">New Project</p>
              <p className="text-sm text-gray-500">Start a new estimate or project</p>
            </div>
          </button>
        </div>

        <div className="w-full md:w-1/3 px-3 mb-6">
          <button
            onClick={() => onNavigate('schedule')}
            className="card card-hover flex items-center gap-4 text-left w-full h-full"
          >
            <div className="p-3 rounded-xl bg-green-500/20">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-800">View Schedule</p>
              <p className="text-sm text-gray-500">Check upcoming work days</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Projects</h2>
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-amber-300 transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No projects yet. Create your first project!</p>
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
                    <td className="font-medium text-gray-700">{project.projectName}</td>
                    <td className="text-gray-500">{getCustomerName(project.customerId)}</td>
                    <td>
                      <span className={getStatusBadge(project.status)}>
                        {project.status?.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="text-gray-600">{formatCurrency(project.estimateAmount)}</td>
                    <td className="text-gray-500">{formatDate(project.createdAt)}</td>
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
