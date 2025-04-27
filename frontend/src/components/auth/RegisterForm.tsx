import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNavigate } from 'react-router-dom';

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

        if (isPassword && passwordError) {
            return `${baseClasses} border-red-500 focus:border-red-500 focus:ring-red-500`;
        }

        return `${baseClasses} border-gray-700 focus:border-primary focus:ring-primary`;
    };

    // Show verification success screen
    if (registrationSuccess) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="w-full max-w-md glass-card p-8 space-y-6 shadow-lg rounded-xl">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-1">Registration Successful!</h2>
                        <p className="text-text-secondary">We've sent a verification link to {email}.</p>
                        <p className="text-text-secondary mt-2">Please check your inbox to verify your email address.</p>
                    </div>
                    <div className="pt-3">
                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 bg-primary hover:bg-primary-dark transition-colors duration-200"
                        >
                            Go to Login
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
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Create Account</h2>
                    <p className="text-text-secondary text-sm">Join us to get started with your account</p>
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
                            className={getInputClasses(true)}
                            required
                        />
                        {passwordTouched && password.length > 0 && password.length < 8 && (
                            <p className="text-xs text-amber-500 mt-1">Must be at least 8 characters</p>
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
                        {passwordError && (
                            <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !!passwordError}
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
                            <a href="/login" className="text-primary hover:text-primary-light ml-1 font-medium">
                                Sign in
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
