import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-[#121212] border-b border-[#1e1e1e] sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="group">
            <span className="text-xl font-bold text-[#f3f4f6] group-hover:text-[#6366f1] transition-colors duration-300">Image Processing Service</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#9ca3af] hover:text-[#f3f4f6] focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-[#9ca3af] hover:text-[#f3f4f6] transition-colors px-3 py-2 rounded-md ${
                    isActive('/dashboard') ? 'bg-[#1e1e1e] text-[#f3f4f6] font-medium' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors px-3 py-2 rounded-md hover:bg-[#1e1e1e]">
                    <svg className="w-5 h-5 mr-1 text-[#6366f1]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{user?.email}</span>
                    <svg className="w-4 h-4 text-[#9ca3af]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-1 w-48 py-2 bg-[#1e1e1e] rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 border border-[rgba(255,255,255,0.1)]">
                    <div className="px-4 py-2 text-sm text-[#9ca3af] border-b border-[rgba(255,255,255,0.1)]">
                      Signed in as <span className="font-medium text-[#f3f4f6]">{user?.email}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-[#9ca3af] hover:bg-[#121212] hover:text-[#ef4444] transition-colors"
                    >
                      <svg className="w-4 h-4 inline mr-2 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-[#9ca3af] hover:text-[#f3f4f6] transition-colors px-3 py-2 rounded-md hover:bg-[#1e1e1e] ${
                    isActive('/login') ? 'text-[#f3f4f6] font-medium bg-[#1e1e1e]' : ''
                  }`}
                >
                  Log In
                </Link>
                <Link to="/register">
                  <Button variant="primary" className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#818cf8] hover:to-[#6366f1] shadow-md">Register</Button>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[rgba(255,255,255,0.1)] animate-fadeIn">
            {isAuthenticated ? (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 text-[#9ca3af] hover:text-[#f3f4f6] rounded-md transition-colors ${
                    isActive('/dashboard') ? 'bg-[#1e1e1e] text-[#f3f4f6]' : 'hover:bg-[#1e1e1e]'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 mr-2 inline-block text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>
                <div className="px-4 py-2 text-sm text-[#9ca3af] bg-[#1e1e1e] rounded-md mx-1">
                  <svg className="w-4 h-4 mr-2 inline-block text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {user?.email}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="mx-1 px-4 py-2 text-left text-[#9ca3af] hover:text-[#ef4444] bg-[#1e1e1e] hover:bg-[#121212] rounded-md transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 p-1">
                <Link
                  to="/login"
                  className={`py-2 px-4 text-[#9ca3af] hover:text-[#f3f4f6] rounded-md transition-colors ${
                    isActive('/login') ? 'bg-[#1e1e1e] text-[#f3f4f6]' : 'hover:bg-[#1e1e1e]'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 mr-2 inline-block text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="primary" className="w-full bg-gradient-to-r from-[#6366f1] to-[#4f46e5] flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
