import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/ClientList';
import ClientDetail from './pages/ClientDetail';
import CaseForm from './pages/CaseForm';
import ClientForm from './pages/ClientForm';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-100 font-sans">
          <header className="bg-white shadow-md">
            <nav className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold text-gray-800">Nalaw</Link>
                <div className="flex space-x-4">
                  <NavLink 
                    to="/" 
                    className={({ isActive }) => 
                      `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink 
                    to="/clients" 
                    className={({ isActive }) => 
                      `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-200'}`
                    }
                  >
                    Clients
                  </NavLink>
                </div>
              </div>
            </nav>
          </header>

          <main className="container mx-auto px-6 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/clients/add" element={<ClientForm />} />
              <Route path="/clients/edit/:id" element={<ClientForm />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/cases/add" element={<CaseForm />} />
              <Route path="/cases/edit/:id" element={<CaseForm />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
