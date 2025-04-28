import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resendVerification } from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Link } from 'react-router-dom';

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const ResendVerification = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const query = useQuery();
    const emailParam = query.get('email');

    useEffect(() => {
        // Pre-fill email from URL parameter if available
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [emailParam]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (!email) {
            setError('Please enter your email address');
            setIsLoading(false);
            return;
        }

        try {
            await resendVerification(email);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend verification email');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen w-full py-8">
                <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                            <svg className="h-6 w-6 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Verification Email Sent!</h2>
                        <p className="text-text-secondary mb-2">We've sent a verification link to {email}.</p>
                        <p className="text-text-secondary mb-6">Please check your inbox and click the link to verify your email address.</p>
                        <Button
                            className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200"
                            onClick={() => navigate('/login')}
                        >
                            Return to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen w-full py-8">
            <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Resend Verification Email</h2>
                    <p className="text-text-secondary text-sm">Enter your email to receive a new verification link</p>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-lg text-sm flex items-center">
                        <div className="bg-red-200 dark:bg-red-800 rounded-full p-1 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <span>{error}</span>
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
                        disabled={isLoading}
                        className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200 mt-4"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                <span>Sending...</span>
                            </div>
                        ) : (
                            "Send Verification Email"
                        )}
                    </Button>

                    <div className="text-center pt-3">
                        <p className="text-sm text-text-secondary">
                            Remember your password?
                            <Link to="/login" className="text-primary hover:text-indigo-400 transition-colors duration-200 ml-1 font-medium">
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResendVerification;
