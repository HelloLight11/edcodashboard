import { useState } from 'react';
import {
  Flame,
  LayoutDashboard,
  Users,
  FolderKanban,
  DollarSign,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, onLogout, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-stone-800 border border-stone-700"
      >
        <Menu className="w-6 h-6 text-stone-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50
          bg-stone-900 border-r border-stone-800
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-800">
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="font-bold text-stone-100">EDCO</h1>
                  <p className="text-xs text-stone-500">Heating & Air</p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 text-stone-400 hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200
                    ${collapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                    }
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-stone-800">
            {!collapsed && user && (
              <div className="px-3 py-2 mb-2 text-center">
                <p className="font-medium text-stone-200 truncate">{user.name}</p>
                <p className="text-xs text-stone-500 truncate">{user.email}</p>
              </div>
            )}

            <button
              onClick={onLogout}
              className={`
                w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl
                text-stone-400 hover:text-red-400 hover:bg-red-500/10
                transition-all duration-200
              `}
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center p-3 border-t border-stone-800 text-stone-500 hover:text-stone-300 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
