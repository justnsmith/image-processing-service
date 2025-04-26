// src/pages/Login.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Header />
      <main className="page">
        <div className="container">
          <div className="form-container">
            <h1 className="form-title">Log In</h1>
            <LoginForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Login;
