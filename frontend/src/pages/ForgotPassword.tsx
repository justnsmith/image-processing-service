import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await forgotPassword(email);
      setMessage(response.message);
      // Even if the email doesn't exist, we show the same message for security
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full py-8">
      <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Forgot Password</h2>
          {!message && (
            <p className="text-text-secondary text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          )}
        </div>

        {message ? (
          <div className="text-center space-y-5">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 bg-opacity-20 mb-6">
              <svg className="h-16 w-16 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                  className="animate-checkmark"
                />
              </svg>
            </div>
            <div className="p-4 bg-green-900 bg-opacity-20 rounded-lg border border-green-800 mb-4">
              <p className="text-lg text-green-300">{message}</p>
              <p className="text-lg text-green-200 mt-1">Please check your email for password reset instructions.</p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200"
            >
              Return to Login
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-danger bg-opacity-10 text-danger border border-danger border-opacity-30 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-card-dark border border-gray-700 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 transition-colors duration-200"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200 mt-4"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center pt-3">
                <p className="text-sm text-text-secondary">
                  Remember your password?
                  <Link to="/login" className="text-primary hover:text-indigo-400 ml-1 font-medium transition-colors duration-200">
                    Back to Login
                  </Link>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
