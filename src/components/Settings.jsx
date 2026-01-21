import { useState } from 'react';
import {
  User,
  Building2,
  Database,
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react';
import { updateUser } from '../services/googleSheets';

export default function Settings({ user, onUpdateUser }) {
  const [activeSection, setActiveSection] = useState('account');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Account form
  const [accountData, setAccountData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Company info (stored locally for now)
  const [companyData, setCompanyData] = useState(() => {
    const saved = localStorage.getItem('companyInfo');
    return saved ? JSON.parse(saved) : {
      companyName: 'EDCO Heating & Air',
      licenseNumber: '#837114',
      phone: '(408) 425-3800',
      email: 'info@edcoheating.com',
    };
  });

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await updateUser(user.id, accountData);
      const updatedUser = { ...user, ...accountData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      setSuccess('Account updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('companyInfo', JSON.stringify(companyData));
    setSuccess('Company info saved locally!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const apiUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  const isConnected = !!apiUrl;

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-100">Settings</h1>
        <p className="text-stone-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="card h-fit">
          <nav className="space-y-1">
            {[
              { id: 'account', label: 'Account', icon: User },
              { id: 'company', label: 'Company Info', icon: Building2 },
              { id: 'data', label: 'Data Management', icon: Database },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Account Section */}
          {activeSection === 'account' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-stone-100 mb-6">Account Settings</h2>
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={accountData.name}
                    onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-gradient" disabled={saving}>
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Company Section */}
          {activeSection === 'company' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-stone-100 mb-6">Company Information</h2>
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">License Number</label>
                  <input
                    type="text"
                    value={companyData.licenseNumber}
                    onChange={(e) => setCompanyData({ ...companyData, licenseNumber: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-gradient">
                  <Save className="w-4 h-4" />
                  Save Company Info
                </button>
              </form>
            </div>
          )}

          {/* Data Management Section */}
          {activeSection === 'data' && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="card">
                <h2 className="text-lg font-semibold text-stone-100 mb-4">Google Sheets Connection</h2>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-stone-800/50">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div>
                    <p className="font-medium text-stone-200">
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </p>
                    <p className="text-sm text-stone-500">
                      {isConnected
                        ? 'Your dashboard is connected to Google Sheets'
                        : 'Set VITE_GOOGLE_SCRIPT_URL in your .env file'}
                    </p>
                  </div>
                </div>

                {apiUrl && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-stone-300 mb-2">API URL</label>
                    <div className="p-3 rounded-lg bg-stone-800/50 text-stone-400 text-sm break-all">
                      {apiUrl}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Info */}
              <div className="card">
                <h2 className="text-lg font-semibold text-stone-100 mb-4">Data Storage</h2>
                <p className="text-stone-400 mb-4">
                  All data is stored in your Google Sheet. The dashboard reads and writes directly
                  to your spreadsheet through the Google Apps Script API.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-stone-500">• Customers, Projects, Equipment data stored in Google Sheets</p>
                  <p className="text-stone-500">• Work days, Payments, and Photos tracked per project</p>
                  <p className="text-stone-500">• Company info stored locally in browser</p>
                </div>
              </div>

              {/* Export Info */}
              <div className="card">
                <h2 className="text-lg font-semibold text-stone-100 mb-4">Export Data</h2>
                <p className="text-stone-400 mb-4">
                  To export your data, open your Google Sheet directly. You can download it as
                  Excel, CSV, or PDF from the File menu.
                </p>
                <a
                  href="https://sheets.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gradient inline-flex"
                >
                  Open Google Sheets
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
