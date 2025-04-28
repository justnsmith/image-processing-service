import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const VerifyEmail = () => {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'redirecting'>('verifying');
    const [message, setMessage] = useState<string>('Verifying your email...');
    const location = useLocation();
    const navigate = useNavigate();
    const { setAuthData } = useAuth();

    // Use a ref to prevent multiple verification attempts
    const verificationAttempted = useRef(false);

    useEffect(() => {
        const verifyUserEmail = async () => {
            // Prevent multiple verification attempts with the same token
            if (verificationAttempted.current) {
                return;
            }

            verificationAttempted.current = true;

            const params = new URLSearchParams(location.search);
            const token = params.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. No token provided.');
                return;
            }

            try {
                console.log('Attempting to verify email with token');
                const response = await verifyEmail(token);
                console.log('Verification response:', response);

                if (response.success) {
                    if (response.token && response.user_id && response.email) {
                        // Store authentication data if returned by the API
                        setAuthData(response.token, response.user_id, response.email);
                        setStatus('success');
                        setMessage('Email verified successfully! You are now logged in.');

                        // Redirect to dashboard or home page after a delay
                        setTimeout(() => {
                            setStatus('redirecting');
                            setMessage('Redirecting to dashboard...');

                            // Redirect after showing the redirect message
                            setTimeout(() => {
                                navigate('/dashboard');
                            }, 1500);
                        }, 1500);
                    } else {
                        setStatus('success');
                        setMessage('Email verified successfully! Please log in.');

                        // Redirect to login page after a delay
                        setTimeout(() => {
                            setStatus('redirecting');
                            setMessage('Redirecting to login...');

                            // Redirect after showing the redirect message
                            setTimeout(() => {
                                navigate('/login');
                            }, 1500);
                        }, 1500);
                    }
                } else {
                    throw new Error(response.message || 'Verification failed');
                }
            } catch (error) {
                console.error('Verification error:', error);

                // Handle "no rows" error differently - likely token already used
                const errorMessage = error instanceof Error ? error.message : String(error);

                if (errorMessage.includes('no rows in result set')) {
                    // This could happen if the token was already used successfully
                    setStatus('error');
                    setMessage('This verification link has already been used or expired. Please try logging in.');
                } else {
                    setStatus('error');
                    setMessage('Email verification failed. The link may have expired or is invalid.');
                }
            }
        };

        verifyUserEmail();
    }, [location, navigate, setAuthData]);

    return (
        <div className="flex items-center justify-center min-h-screen w-full p-4">
            <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Email Verification</h2>

                    {status === 'verifying' && (
                        <div className="flex flex-col items-center mt-6">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-text-secondary">{message}</p>
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

                    {status === 'error' && (
                        <div className="text-center mt-6">
                            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-500 bg-opacity-20 mb-6">
                                <svg className="h-16 w-16 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-text-secondary mb-6">{message}</p>
                            <Button
                                onClick={() => navigate('/login')}
                                className="bg-primary hover:bg-primary-dark transition-colors duration-200 px-6 py-2"
                            >
                                Go to Login
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
