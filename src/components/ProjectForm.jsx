import { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Image,
  FileText,
  Wrench,
  Calendar,
  DollarSign,
  Camera
} from 'lucide-react';
import {
  addProject,
  updateProject,
  getEquipment,
  addEquipment,
  deleteEquipment,
  getWorkDays,
  addWorkDay,
  deleteWorkDay,
  getPayments,
  addPayment,
  deletePayment,
  getPhotos,
  addPhoto,
  deletePhoto,
  formatCurrency,
  formatDate
} from '../services/googleSheets';

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: FileText },
  { id: 'equipment', label: 'Equipment', icon: Wrench },
  { id: 'workdays', label: 'Work Days', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'photos', label: 'Photos', icon: Camera },
];

const STATUS_OPTIONS = [
  { value: 'estimate', label: 'Estimate' },
  { value: 'approved', label: 'Approved' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_METHODS = ['Check', 'Cash', 'Credit Card', 'Zelle', 'Venmo', 'PayPal'];

export default function ProjectForm({ project, customers, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [projectId, setProjectId] = useState(project?.id || null);

  // Basic info
  const [formData, setFormData] = useState({
    customerId: project?.customerId || '',
    projectName: project?.projectName || '',
    contractor: project?.contractor || '',
    status: project?.status || 'estimate',
    natureOfJob: project?.natureOfJob || '',
    estimateAmount: project?.estimateAmount || '',
    contractAmount: project?.contractAmount || '',
    notes: project?.notes || '',
  });

  // Related data
  const [equipment, setEquipment] = useState([]);
  const [workDays, setWorkDays] = useState([]);
  const [payments, setPayments] = useState([]);
  const [photos, setPhotos] = useState([]);

  // Form inputs for adding items
  const [newEquipment, setNewEquipment] = useState({ name: '', type: '', serialNumber: '' });
  const [newWorkDay, setNewWorkDay] = useState({ date: '', hours: '', notes: '' });
  const [newPayment, setNewPayment] = useState({ date: '', amount: '', method: 'Check', note: '' });

  useEffect(() => {
    if (projectId) {
      loadRelatedData();
    }
  }, [projectId]);

  const loadRelatedData = async () => {
    try {
      const [equipmentData, workDaysData, paymentsData, photosData] = await Promise.all([
        getEquipment(projectId),
        getWorkDays(projectId),
        getPayments(projectId),
        getPhotos(projectId),
      ]);
      setEquipment(equipmentData);
      setWorkDays(workDaysData);
      setPayments(paymentsData);
      setPhotos(photosData);
    } catch (err) {
      console.error('Error loading related data:', err);
    }
  };

  // Calculate totals
  const totalHours = workDays.reduce((sum, wd) => sum + (parseFloat(wd.hours) || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const balanceRemaining = (parseFloat(formData.contractAmount) || 0) - totalPayments;

  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (project) {
        await updateProject(project.id, formData);
      } else {
        const result = await addProject(formData);
        setProjectId(result.id);
      }
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  // Equipment handlers
  const handleAddEquipment = async () => {
    if (!newEquipment.name) return;
    try {
      await addEquipment({ ...newEquipment, projectId });
      setNewEquipment({ name: '', type: '', serialNumber: '' });
      await loadRelatedData();
    } catch (err) {
      alert('Failed to add equipment');
    }
  };

  const handleDeleteEquipment = async (id) => {
    try {
      await deleteEquipment(id);
      await loadRelatedData();
    } catch (err) {
      alert('Failed to delete equipment');
    }
  };

  // Work day handlers
  const handleAddWorkDay = async () => {
    if (!newWorkDay.date || !newWorkDay.hours) return;
    try {
      await addWorkDay({ ...newWorkDay, projectId });
      setNewWorkDay({ date: '', hours: '', notes: '' });
      await loadRelatedData();
    } catch (err) {
      alert('Failed to add work day');
    }
  };

  const handleDeleteWorkDay = async (id) => {
    try {
      await deleteWorkDay(id);
      await loadRelatedData();
    } catch (err) {
      alert('Failed to delete work day');
    }
  };

  // Payment handlers
  const handleAddPayment = async () => {
    if (!newPayment.date || !newPayment.amount) return;
    try {
      await addPayment({ ...newPayment, projectId });
      setNewPayment({ date: '', amount: '', method: 'Check', note: '' });
      await loadRelatedData();
    } catch (err) {
      alert('Failed to add payment');
    }
  };

  const handleDeletePayment = async (id) => {
    try {
      await deletePayment(id);
      await loadRelatedData();
    } catch (err) {
      alert('Failed to delete payment');
    }
  };

  // Photo handlers
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await addPhoto({
          projectId,
          url: reader.result,
          filename: file.name,
        });
        await loadRelatedData();
      } catch (err) {
        alert('Failed to upload photo');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (id) => {
    try {
      await deletePhoto(id);
      await loadRelatedData();
    } catch (err) {
      alert('Failed to delete photo');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-700">
          <h2 className="text-xl font-semibold text-stone-100">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-700 text-stone-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-stone-700 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isDisabled = !projectId && tab.id !== 'basic';
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`tab flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id ? 'active' : ''
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <form onSubmit={handleBasicSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Customer *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    required
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Contractor</label>
                  <input
                    type="text"
                    value={formData.contractor}
                    onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Nature of Job</label>
                <textarea
                  value={formData.natureOfJob}
                  onChange={(e) => setFormData({ ...formData, natureOfJob: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Estimate Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimateAmount}
                    onChange={(e) => setFormData({ ...formData, estimateAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Contract Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.contractAmount}
                    onChange={(e) => setFormData({ ...formData, contractAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-stone-600 text-stone-300 hover:bg-stone-700"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gradient" disabled={saving}>
                  {saving ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
                </button>
              </div>
            </form>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Type"
                  value={newEquipment.type}
                  onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Serial Number"
                  value={newEquipment.serialNumber}
                  onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                />
                <button onClick={handleAddEquipment} className="btn-gradient">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {equipment.length === 0 ? (
                <p className="text-stone-500 text-center py-8">No equipment added yet.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Serial Number</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.map((item) => (
                        <tr key={item.id}>
                          <td className="text-stone-200">{item.name}</td>
                          <td className="text-stone-400">{item.type}</td>
                          <td className="text-stone-400">{item.serialNumber}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteEquipment(item.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-stone-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Work Days Tab */}
          {activeTab === 'workdays' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <input
                  type="date"
                  value={newWorkDay.date}
                  onChange={(e) => setNewWorkDay({ ...newWorkDay, date: e.target.value })}
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Hours"
                  value={newWorkDay.hours}
                  onChange={(e) => setNewWorkDay({ ...newWorkDay, hours: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Notes"
                  value={newWorkDay.notes}
                  onChange={(e) => setNewWorkDay({ ...newWorkDay, notes: e.target.value })}
                />
                <button onClick={handleAddWorkDay} className="btn-gradient">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="card bg-stone-800/50">
                <p className="text-stone-400">Total Hours: <span className="text-amber-400 font-semibold">{totalHours}</span></p>
              </div>

              {workDays.length === 0 ? (
                <p className="text-stone-500 text-center py-8">No work days logged yet.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Hours</th>
                        <th>Notes</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {workDays.sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => (
                        <tr key={item.id}>
                          <td className="text-stone-200">{formatDate(item.date)}</td>
                          <td className="text-stone-400">{item.hours}</td>
                          <td className="text-stone-400">{item.notes}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteWorkDay(item.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-stone-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-3">
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                />
                <select
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Note"
                  value={newPayment.note}
                  onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
                />
                <button onClick={handleAddPayment} className="btn-gradient">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-stone-800/50">
                  <p className="text-stone-400">Total Received</p>
                  <p className="text-xl font-semibold text-green-400">{formatCurrency(totalPayments)}</p>
                </div>
                <div className="card bg-stone-800/50">
                  <p className="text-stone-400">Balance Remaining</p>
                  <p className={`text-xl font-semibold ${balanceRemaining > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {formatCurrency(balanceRemaining)}
                  </p>
                </div>
              </div>

              {payments.length === 0 ? (
                <p className="text-stone-500 text-center py-8">No payments recorded yet.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Note</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => (
                        <tr key={item.id}>
                          <td className="text-stone-200">{formatDate(item.date)}</td>
                          <td className="text-green-400 font-medium">{formatCurrency(item.amount)}</td>
                          <td className="text-stone-400">{item.method}</td>
                          <td className="text-stone-400">{item.note}</td>
                          <td>
                            <button
                              onClick={() => handleDeletePayment(item.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-stone-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <label className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-stone-600 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors">
                <Upload className="w-5 h-5 text-stone-400" />
                <span className="text-stone-400">Click to upload photos</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photos.length === 0 ? (
                <p className="text-stone-500 text-center py-8">No photos uploaded yet.</p>
              ) : (
                <div className="photo-grid">
                  {photos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.url} alt={photo.filename} />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="delete-btn"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
