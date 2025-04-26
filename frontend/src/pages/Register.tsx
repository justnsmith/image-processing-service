// src/pages/Register.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
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
            <h1 className="form-title">Create an Account</h1>
            <RegisterForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Register;
