import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Link, useNavigate } from 'react-router-dom';

export const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setNeedsVerification(false);

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            console.log(`Attempting to login with email: ${email}`);
            // Always use lowercase email to avoid case sensitivity issues
            const normalizedEmail = email.toLowerCase();
            await login(normalizedEmail, password);
            console.log('Login successful, navigating to dashboard');
            navigate('/dashboard');
        } catch (err: any) {
            console.error("Login error:", err);

            // Better error handling to catch verification-related errors
            const errorMessage = err.message || 'Login failed';
            console.error("Error message:", errorMessage);

            // Check for common email verification error messages
            if (
                errorMessage.toLowerCase().includes('not verified') ||
                errorMessage.toLowerCase().includes('verification') ||
                errorMessage.toLowerCase().includes('verify your email')
            ) {
                console.log("User needs verification, showing verification notice");
                setNeedsVerification(true);
                // Store the email for resend verification page
                sessionStorage.setItem('verificationEmail', email);
            } else {
                setError(errorMessage);
            }
        }
    };

    if (needsVerification) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                            <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-1">Email Not Verified</h2>
                        <p className="text-text-secondary">Please verify your email address to continue.</p>
                        <p className="text-text-secondary mt-2">Check your inbox for a verification link or request a new one.</p>
                    </div>
                    <div className="pt-3 space-y-3">
                        <Button
                            onClick={() => {
                                // Pass the email in the URL for the resend page
                                navigate(`/resend-verification?email=${encodeURIComponent(email)}`);
                            }}
                            className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200"
                        >
                            Resend Verification Email
                        </Button>
                        <Button
                            onClick={() => {
                                setNeedsVerification(false);
                                setPassword('');
                            }}
                            className="w-full py-3 bg-transparent border border-gray-600 hover:bg-gray-800 transition-colors duration-200"
                        >
                            Back to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full w-full">
            <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Welcome Back</h2>
                    <p className="text-text-secondary text-sm">Sign in to access your account</p>
                </div>

                {error && (
                    <div className="bg-red-500 bg-opacity-10 text-red-500 border border-red-500 border-opacity-30 p-3 rounded-lg text-sm">
                        <p>{error}</p>
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

                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                                Password
                            </label>
                            <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-light">
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
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
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            "Sign In"
                        )}
                    </Button>

                    <div className="text-center pt-3">
                        <p className="text-sm text-text-secondary">
                            Don't have an account?
                            <Link to="/register" className="text-primary hover:text-primary-light ml-1 font-medium">
                                Create account
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
