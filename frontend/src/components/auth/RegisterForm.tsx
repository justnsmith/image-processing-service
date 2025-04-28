import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Link, useNavigate } from 'react-router-dom';

export const RegisterForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const { register, isLoading } = useAuth();
    const navigate = useNavigate();

    // Check password match whenever either password changes
    useEffect(() => {
        if (password && confirmPassword && password !== confirmPassword) {
            setPasswordError('Passwords do not match');
        } else {
            setPasswordError('');
        }
    }, [password, confirmPassword]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setPasswordTouched(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        try {
            const response = await register(email, password);

            // Check for properties that would indicate email verification is needed
            // This could be a specific property in your API response or the absence of a token
            if (!response.token) {
                // No token means verification is likely needed
                setRegistrationSuccess(true);
            } else {
                // Token present means user is already authenticated, go to dashboard
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        }
    };

    // Determine input classes based on validation state
    const getInputClasses = (isPassword: boolean) => {
        const baseClasses = "w-full bg-card-dark border focus:ring focus:ring-opacity-20 transition-colors duration-200";

        if (isPassword && passwordError && confirmPassword) {
            return `${baseClasses} border-danger focus:border-danger focus:ring-danger`;
        }

        return `${baseClasses} border-gray-700 focus:border-primary focus:ring-primary`;
    };

    // Show verification success screen
    if (registrationSuccess) {
        return (
            <div className="flex items-center justify-center h-full w-full min-h-screen">
                <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
                    <div className="text-center">
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
                        <h2 className="text-3xl font-bold text-text-primary mb-2">Registration Successful!</h2>
                        <div className="p-4 bg-green-900 bg-opacity-20 rounded-lg border border-green-800 mb-4">
                            <p className="text-lg text-green-300">We've sent a verification link to:</p>
                            <p className="text-xl font-medium text-green-100 mt-1">{email}</p>
                        </div>
                        <p className="text-text-secondary text-lg">Please check your inbox to verify your email address.</p>
                    </div>
                    <div className="pt-6">
                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 text-lg bg-primary hover:bg-primary-dark transition-colors duration-200"
                        >
                            Go to Login
                        </Button>
                        <p className="text-sm text-text-secondary mt-4">
                            Didn't receive the email?{' '}
                            <Link to={`/resend-verification?email=${encodeURIComponent(email)}`} className="text-primary hover:text-indigo-400 transition-colors duration-200 font-medium">
                                Resend verification email
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full w-full min-h-screen">
            <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Create Account</h2>
                    <p className="text-text-secondary text-sm">Join us to get started with your account</p>
                </div>

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
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                            Email Address
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className={getInputClasses(false)}
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
                            onChange={handlePasswordChange}
                            onBlur={() => setPasswordTouched(true)}
                            placeholder="********"
                            className={getInputClasses(false)}
                            required
                        />
                        {passwordTouched && password.length > 0 && password.length < 8 && (
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
                        />
                        {passwordError && confirmPassword && (
                            <p className="text-xs text-danger mt-1 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {passwordError}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || (!!passwordError && !!confirmPassword)}
                        className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200 mt-4"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                <span>Creating account...</span>
                            </div>
                        ) : (
                            "Create Account"
                        )}
                    </Button>

                    <div className="text-center pt-3">
                        <p className="text-sm text-text-secondary">
                            Already have an account?
                            <Link to="/login" className="text-primary hover:text-indigo-400 transition-colors duration-200 ml-1 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
