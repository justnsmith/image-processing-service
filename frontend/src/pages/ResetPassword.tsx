import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyResetToken, resetPassword } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

// Define interface for reset password response
interface ResetPasswordResponse {
    message: string;
    token?: string;
    user_id?: string;
    success?: boolean;
}

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'verifying' | 'valid' | 'invalid' | 'success' | 'redirecting'>('verifying');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [userEmail, setUserEmail] = useState('');

    const navigate = useNavigate();
    const query = useQuery();
    const token = query.get('token') || '';
    const { setAuthData } = useAuth();

    useEffect(() => {
        // Verify token when component mounts
        const verifyToken = async () => {
            if (!token) {
                setError('Missing reset token');
                setStatus('invalid');
                return;
            }

            try {
                const response = await verifyResetToken(token);
                setStatus('valid');
                setUserEmail(response.email);
            } catch (err: any) {
                setError(err.message || 'Invalid or expired reset token');
                setStatus('invalid');
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            const response = await resetPassword(token, password) as ResetPasswordResponse;

            // Set success status and message first
            setStatus('success');
            setMessage('Password successfully reset!');

            // Check if we received auth data in the response
            if (response.token && response.user_id) {
                // Store auth data with the email we already have from token verification
                setAuthData(response.token, response.user_id, userEmail);

                // Show success message then transition to redirect state after a delay
                setTimeout(() => {
                    setStatus('redirecting');
                    setMessage('Redirecting to dashboard...');

                    // Redirect after showing the redirect message
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1500);
                }, 1500);
            } else {
                // Handle case where login credentials aren't returned
                setTimeout(() => {
                    setStatus('redirecting');
                    setMessage('Redirecting to login...');

                    // Redirect to login after showing the redirect message
                    setTimeout(() => {
                        navigate('/login');
                    }, 1500);
                }, 1500);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
            setIsSubmitting(false);
        }
    };

    // Determine input classes based on validation state
    const getInputClasses = (isPassword: boolean) => {
        const baseClasses = "w-full bg-card-dark border focus:ring focus:ring-opacity-20 transition-colors duration-200";

        if (isPassword && password !== confirmPassword && confirmPassword) {
            return `${baseClasses} border-danger focus:border-danger focus:ring-danger`;
        }

        return `${baseClasses} border-gray-700 focus:border-primary focus:ring-primary`;
    };

    return (
        <div className="flex items-center justify-center h-full w-full min-h-screen">
            <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Reset Password</h2>
                    {status === 'valid' && (
                        <p className="text-text-secondary text-sm">
                            Create a new password for <span className="font-medium text-text-primary">{userEmail}</span>
                        </p>
                    )}
                </div>

                {status === 'verifying' && (
                    <div className="flex flex-col items-center mt-6">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-text-secondary">Verifying reset token...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center mt-6">
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
                        <p className="text-lg text-text-primary font-medium mb-2">{message}</p>
                    </div>
                )}

                {status === 'redirecting' && (
                    <div className="text-center mt-6">
                        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 bg-opacity-20 mb-6">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-lg text-text-primary font-medium mb-2">{message}</p>
                    </div>
                )}

                {status === 'valid' && (
                    <>
                        {error && (
                            <div className="bg-red-900 bg-opacity-20 text-red-300 border border-red-800 p-4 rounded-lg text-sm flex items-center">
                                <div className="bg-red-800 rounded-full p-1 mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1">
                                <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                                    New Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="********"
                                    className={getInputClasses(false)}
                                    required
                                    minLength={8}
                                />
                                {password.length > 0 && password.length < 8 && (
                                    <p className="text-xs text-warning mt-1 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Must be at least 8 characters
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
                                    Confirm Password
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="********"
                                    className={getInputClasses(true)}
                                    required
                                    minLength={8}
                                />
                                {password !== confirmPassword && confirmPassword && (
                                    <p className="text-xs text-danger mt-1 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || (password !== confirmPassword && !!confirmPassword)}
                                className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200 mt-4"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                        <span>Resetting...</span>
                                    </div>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>
                    </>
                )}

                {status === 'invalid' && (
                    <div className="text-center space-y-4">
                        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-500 bg-opacity-20 mb-6">
                            <svg className="h-16 w-16 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-lg text-text-primary font-medium mb-2">{error || 'Invalid or expired reset token'}</p>
                        <p className="text-text-secondary mb-4">
                            The password reset link is invalid or has expired.
                        </p>
                        <Button
                            onClick={() => navigate('/forgot-password')}
                            className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200"
                        >
                            Request New Reset Link
                        </Button>
                    </div>
                )}

                {['valid', 'invalid'].includes(status) && (
                    <div className="text-center pt-3">
                        <p className="text-sm text-text-secondary">
                            Remember your password?
                            <Link to="/login" className="text-primary hover:text-indigo-400 transition-colors duration-200 ml-1 font-medium">
                                Back to Login
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
