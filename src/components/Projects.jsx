import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { getProjects, getCustomers, deleteProject, formatCurrency, formatDate } from '../services/googleSheets';
import ProjectForm from './ProjectForm';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'estimate', label: 'Estimate' },
  { value: 'approved', label: 'Approved' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const YEAR_OPTIONS = [
  { value: '', label: 'All Years' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, customersData] = await Promise.all([
        getProjects(),
        getCustomers(),
      ]);
      setProjects(projectsData);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error loading projects:', err);
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.contractor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(project.customerId).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || project.status === statusFilter;

    const projectYear = project.createdAt ? new Date(project.createdAt).getFullYear().toString() : '';
    const matchesYear = !yearFilter || projectYear === yearFilter;

    return matchesSearch && matchesStatus && matchesYear;
  });

  const openAddModal = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDelete = async (project) => {
    if (!confirm(`Delete project "${project.projectName}"?`)) return;

    try {
      await deleteProject(project.id);
      await loadData();
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const handleSave = () => {
    setShowModal(false);
    loadData();
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">Projects</h1>
          <p className="text-stone-400 mt-1">{projects.length} total projects</p>
        </div>
        <button onClick={openAddModal} className="btn-gradient">
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="pl-10 pr-10 min-w-[130px]"
            >
              {YEAR_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500 pointer-events-none" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-10 min-w-[160px]"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-stone-400">
            {searchTerm || statusFilter || yearFilter ? 'No projects match your filters.' : 'No projects yet. Create your first project!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className={getStatusBadge(project.status)}>
                  {project.status?.replace('-', ' ')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-stone-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-stone-100 mb-1">
                {project.projectName}
              </h3>
              <p className="text-stone-400 text-sm mb-4">
                {getCustomerName(project.customerId)}
              </p>

              {project.contractor && (
                <p className="text-stone-500 text-sm mb-3">
                  Contractor: {project.contractor}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-700">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Estimate</p>
                  <p className="font-medium text-stone-200">
                    {formatCurrency(project.estimateAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Contract</p>
                  <p className="font-medium text-stone-200">
                    {formatCurrency(project.contractAmount)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-500 mt-4">
                Created {formatDate(project.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Project Modal */}
      {showModal && (
        <ProjectForm
          project={editingProject}
          customers={customers}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
