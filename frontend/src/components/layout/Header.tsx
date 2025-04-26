import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          Image Processing Service
        </Link>
        <nav className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-gray-600">Hello, {user?.email}</span>
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
                Dashboard
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Log In
              </Link>
              <Link to="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
