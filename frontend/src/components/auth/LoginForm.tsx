// src/components/Auth/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            // Ensure error is properly captured and displayed
            const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
            setError(errorMessage);
        }
    };

    // Determine input classes based on validation state
    const getInputClasses = () => {
        return "w-full bg-card-dark border border-gray-700 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 transition-colors duration-200";
    };

    return (
        <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-text-primary mb-1">Welcome Back</h2>
                <p className="text-text-secondary text-sm">Sign in to access your account</p>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
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
                        className={getInputClasses()}
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                        Password
                    </label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        className={getInputClasses()}
                        required
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200 mt-4"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                            <span>Signing in...</span>
                        </div>
                    ) : (
                        "Sign In"
                    )}
                </Button>

                <div className="text-center pt-3">
                    <p className="text-sm text-text-secondary">
                        Don't have an account?
                        <a href="/register" className="text-primary hover:text-primary-light ml-1 font-medium">
                            Create account
                        </a>
                    </p>
                </div>
            </form>
        </div>
    );
};
