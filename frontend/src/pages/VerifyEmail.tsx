import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail } from '../api/api';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail = () => {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
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
                            navigate('/dashboard');
                        }, 3000);
                    } else {
                        setStatus('success');
                        setMessage('Email verified successfully! Please log in.');

                        // Redirect to login page after a delay
                        setTimeout(() => {
                            navigate('/login');
                        }, 3000);
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">Email Verification</h1>

                {status === 'verifying' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p>{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center text-green-600">
                        <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="mb-4">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center text-red-600">
                        <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <p className="mb-4">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
