// src/pages/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Header />
      <main className="page">
        <div className="container">
          <section className="hero">
            <h1>Image Storage & Processing</h1>
            <p>
              Upload, store, and manage your images with our easy-to-use platform.
              Resize, crop, and apply effects to your images in seconds.
            </p>
            <div className="button-group">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button>Log In</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="secondary">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </section>
          <section className="features">
            <h2>Features</h2>
            <div className="features-grid">
              <div className="feature">
                <h3>Secure Storage</h3>
                <p>Your images are securely stored and accessible only to you.</p>
              </div>
              <div className="feature">
                <h3>Image Processing</h3>
                <p>Resize, crop, and apply filters to your images.</p>
              </div>
              <div className="feature">
                <h3>Easy Sharing</h3>
                <p>Share your images with others using secure links.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Home;
