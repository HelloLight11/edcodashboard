import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Search
} from 'lucide-react';
import { getAllWorkDays, getProjects, getCustomers, formatDate } from '../services/googleSheets';

export default function Schedule() {
  const [workDays, setWorkDays] = useState([]);
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
      const [workDaysData, projectsData, customersData] = await Promise.all([
        getAllWorkDays(),
        getProjects(),
        getCustomers(),
      ]);
      setWorkDays(workDaysData);
      setProjects(projectsData);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error loading schedule:', err);
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

  // Calculate total hours
  const totalHours = workDays.reduce((sum, wd) => sum + (parseFloat(wd.hours) || 0), 0);

  // Sort work days by date (newest first)
  const sortedWorkDays = [...workDays].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredWorkDays = sortedWorkDays.filter(workDay => {
    const searchLower = searchTerm.toLowerCase();
    return (
      getProjectName(workDay.projectId).toLowerCase().includes(searchLower) ||
      getCustomerNameByProject(workDay.projectId).toLowerCase().includes(searchLower) ||
      workDay.notes?.toLowerCase().includes(searchLower)
    );
  });

  // Group by date
  const groupedByDate = filteredWorkDays.reduce((groups, workDay) => {
    const date = workDay.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(workDay);
    return groups;
  }, {});

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
        <h1 className="text-2xl font-bold text-stone-100">Schedule</h1>
        <p className="text-stone-400 mt-1">View all logged work days across projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">Total Hours Logged</p>
              <p className="text-xl font-bold text-stone-100">{totalHours.toFixed(1)} hours</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">Work Days</p>
              <p className="text-xl font-bold text-stone-100">{workDays.length} days</p>
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
            placeholder="Search by project, customer, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Work Days List */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-stone-400">
            {searchTerm ? 'No work days match your search.' : 'No work days logged yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dayWorkDays]) => {
            const dayTotal = dayWorkDays.reduce((sum, wd) => sum + (parseFloat(wd.hours) || 0), 0);

            return (
              <div key={date} className="card">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-stone-700">
                      <Calendar className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-stone-100">{formatDate(date)}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-stone-400">
                    <Clock className="w-4 h-4" />
                    <span>{dayTotal} hours</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {dayWorkDays.map((workDay) => (
                    <div
                      key={workDay.id}
                      className="flex items-start justify-between p-3 rounded-lg bg-stone-800/50"
                    >
                      <div>
                        <p className="font-medium text-stone-200">{getProjectName(workDay.projectId)}</p>
                        <p className="text-sm text-stone-400">{getCustomerNameByProject(workDay.projectId)}</p>
                        {workDay.notes && (
                          <p className="text-sm text-stone-500 mt-1">{workDay.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-sm font-medium">
                          <Clock className="w-3 h-3" />
                          {workDay.hours}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
