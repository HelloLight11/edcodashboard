import { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Projects from './components/Projects';
import Payments from './components/Payments';
import Schedule from './components/Schedule';
import Settings from './components/Settings';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="spinner" />
      </div>
    );
  }

  // Not logged in - show login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'customers':
        return <Customers />;
      case 'projects':
        return <Projects />;
      case 'payments':
        return <Payments />;
      case 'schedule':
        return <Schedule />;
      case 'settings':
        return <Settings user={user} onUpdateUser={handleUpdateUser} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-900">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        user={user}
      />
      <main className="flex-1 p-4 lg:p-8 lg:ml-0 pt-16 lg:pt-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
