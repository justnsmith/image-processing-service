import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { ImageComparisonSlider } from '../components/ui/ImageComparisonSlider';

const Home: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [hoverEffect, setHoverEffect] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--background-dark)] text-[var(--text-primary)]">
            <Header />

            {/* Hero Section */}
            <section className="bg-[var(--background-dark)] py-20 border-b border-[var(--card-dark)]">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="md:w-1/2">
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--primary-light)]">
                                Image Processing Service
                            </h1>
                            <p className="text-xl text-[var(--text-secondary)] mb-8 leading-relaxed">
                                A full-stack image processing application with advanced backend services for secure storage, efficient processing, and dependable data management.
                            </p>

                            <div className="flex gap-4">
                                {isAuthenticated ? (
                                    <Link to="/dashboard">
                                        <Button className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-lg px-6 py-3 transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-[rgba(99,102,241,0.4)] border border-[rgba(255,255,255,0.1)]">Go to Dashboard</Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/login">
                                            <Button className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-lg px-6 py-3 transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-[rgba(99,102,241,0.4)] border border-[rgba(255,255,255,0.1)]">Log In</Button>
                                        </Link>
                                        <Link to="/register">
                                            <Button variant="outline" className="border border-[var(--primary)] text-[var(--primary-light)] hover:bg-[rgba(99,102,241,0.15)] text-lg px-6 py-3 transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-[rgba(99,102,241,0.3)]">Sign Up</Button>
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* GitHub Repository Link */}
                            <a
                                href="https://github.com/justnsmith/image-processing-service"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center mt-6 text-[var(--text-secondary)] hover:text-[var(--primary-light)] transition-colors group"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="mr-2 group-hover:rotate-[15deg] transition-transform"
                                >
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                </svg>
                                View on GitHub
                            </a>
                        </div>

                        <div className="md:w-1/2 relative mt-8 md:mt-0">
                            <div className={`bg-[var(--card-dark)] p-6 rounded-lg border border-[rgba(255,255,255,0.1)] shadow-xl transform transition-transform duration-300 ${hoverEffect ? 'scale-105' : ''}`}
                                onMouseEnter={() => setHoverEffect(true)}
                                onMouseLeave={() => setHoverEffect(false)}>

                                <ImageComparisonSlider
                                    originalImage="/images/demo-original.jpg"
                                    processedImage="/images/demo-processed.jpg"
                                    alt="Image processing demo"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-[var(--background-dark)]">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-10 text-center text-[var(--primary-light)]">
                        Project Features
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[var(--card-dark)] p-8 rounded-lg shadow-md border border-[rgba(255,255,255,0.1)] hover:border-[var(--primary)] transition-colors">
                            <h3 className="text-2xl font-semibold mb-4 text-[var(--text-primary)] flex items-center">
                                <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] p-2 rounded-full mr-3">1</span>
                                Secure Authentication
                            </h3>
                            <p className="text-[var(--text-secondary)]">
                                Complete user management with:
                            </p>
                            <ul className="mt-3 space-y-2 text-[var(--text-secondary)]">
                                <li>• Email verification system</li>
                                <li>• Secure password reset flow</li>
                                <li>• JWT token-based authentication</li>
                            </ul>
                            <div className="mt-5 text-sm text-[var(--primary-light)] bg-[var(--background-dark)] p-3 rounded font-mono">
                // Implemented with Go + JWT
                            </div>
                        </div>

                        <div className="bg-[var(--card-dark)] p-8 rounded-lg shadow-md border border-[rgba(255,255,255,0.1)] hover:border-[var(--primary)] transition-colors">
                            <h3 className="text-2xl font-semibold mb-4 text-[var(--text-primary)] flex items-center">
                                <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] p-2 rounded-full mr-3">2</span>
                                Secure Storage
                            </h3>
                            <p className="text-[var(--text-secondary)]">
                                Backend implementation for secure image storage:
                            </p>
                            <ul className="mt-3 space-y-2 text-[var(--text-secondary)]">
                                <li>• S3 bucket integration for scalable storage</li>
                                <li>• Redis caching for improved performance</li>
                                <li>• PostgreSQL metadata management</li>
                            </ul>
                            <div className="mt-5 text-sm text-[var(--primary-light)] bg-[var(--background-dark)] p-3 rounded font-mono">
                // Implemented with Go + S3 SDK
                            </div>
                        </div>

                        <div className="bg-[var(--card-dark)] p-8 rounded-lg shadow-md border border-[rgba(255,255,255,0.1)] hover:border-[var(--primary)] transition-colors">
                            <h3 className="text-2xl font-semibold mb-4 text-[var(--text-primary)] flex items-center">
                                <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] p-2 rounded-full mr-3">3</span>
                                Image Processing
                            </h3>
                            <p className="text-[var(--text-secondary)]">
                                Backend processing capabilities:
                            </p>
                            <ul className="mt-3 space-y-2 text-[var(--text-secondary)]">
                                <li>• Resize images with Go image packages</li>
                                <li>• Crop functionality with proper aspect ratios</li>
                                <li>• Filter application via backend processing</li>
                            </ul>
                            <div className="mt-5 text-sm text-[var(--primary-light)] bg-[var(--background-dark)] p-3 rounded font-mono">
                // Built with Go imaging libraries
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Authentication Flow Section */}
            <section className="py-16 bg-[var(--background-dark)] border-t border-[var(--card-dark)]">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-10 text-center text-[var(--primary-light)]">
                        Secure Authentication Flow
                    </h2>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="bg-[var(--card-dark)] p-6 rounded-lg border border-[rgba(255,255,255,0.1)] shadow-md">
                            <h3 className="text-xl font-semibold mb-4 text-[var(--primary-light)]">
                                User Registration & Verification
                            </h3>
                            <ol className="space-y-3 text-[var(--text-secondary)]">
                                <li className="flex">
                                    <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">1</span>
                                    <span>User creates account with email & password</span>
                                </li>
                                <li className="flex">
                                    <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">2</span>
                                    <span>Verification email sent automatically</span>
                                </li>
                                <li className="flex">
                                    <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">3</span>
                                    <span>User clicks verification link with secure token</span>
                                </li>
                                <li className="flex">
                                    <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">4</span>
                                    <span>Account activated for full access</span>
                                </li>
                            </ol>
                            <div className="mt-6 text-right">
                                <Link to="/register">
                                    <Button variant="outline" className="border border-[var(--primary)] text-[var(--primary-light)] hover:bg-[rgba(99,102,241,0.15)]">
                                        Create Account
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="bg-[var(--card-dark)] p-6 rounded-lg border border-[rgba(255,255,255,0.1)] shadow-md">
                            <h3 className="text-xl font-semibold mb-4 text-[var(--primary-light)]">
                                Password Recovery
                            </h3>
                            <ol className="space-y-3 text-[var(--text-secondary)]">
                                <li className="flex">
                                    <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">1</span>
                                    <span>User requests password reset via email</span>
                                </li>
                                <li className="flex">
                                    <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">2</span>
                                    <span>Secure token generated and emailed</span>
                                </li>
                                <li className="flex">
                                    <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">3</span>
                                    <span>Token verified on password reset page</span>
                                </li>
                                <li className="flex">
                                    <span className="bg-[rgba(99,102,241,0.2)] text-[var(--primary-light)] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">4</span>
                                    <span>User creates new password securely</span>
                                </li>
                            </ol>
                            <div className="mt-6 text-right">
                                <Link to="/forgot-password">
                                    <Button variant="outline" className="border border-[var(--primary)] text-[var(--primary-light)] hover:bg-[rgba(99,102,241,0.15)]">
                                        Reset Password
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Project Overview */}
            <section className="py-12 bg-[var(--background-dark)]">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="bg-[var(--card-dark)] p-6 rounded-lg border border-[rgba(255,255,255,0.1)] shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-[var(--primary-light)]">
                            Project Overview
                        </h2>
                        <p className="text-[var(--text-secondary)] text-lg">
                            This application demonstrates a full-stack implementation with a focus on secure authentication, backend development, and cloud architecture. The Go backend handles all the heavy lifting for user management, email verification, image processing, and storage, while the React frontend provides a user-friendly interface.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            {[
                                "Go",
                                "PostgreSQL",
                                "Redis",
                                "Amazon S3",
                                "React",
                                "TypeScript",
                                "JWT Auth",
                                "Email Verification",
                                "Vite",
                                "Tailwind CSS",
                            ].map((tech, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-[var(--background-dark)] text-[var(--primary-light)] text-sm rounded border border-[rgba(255,255,255,0.1)]"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* API Endpoints */}
            <section className="py-12 bg-[var(--background-dark)]">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl font-semibold mb-4 text-[var(--primary-light)]">
                        API Endpoints
                    </h2>

                    <div className="bg-[var(--card-dark)] p-6 rounded-lg border border-[rgba(255,255,255,0.1)] font-mono text-sm overflow-x-auto shadow-md">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[rgba(255,255,255,0.1)]">
                                    <th className="pb-3 text-[var(--text-secondary)]">Method</th>
                                    <th className="pb-3 text-[var(--text-secondary)]">Endpoint</th>
                                    <th className="pb-3 text-[var(--text-secondary)]">Description</th>
                                </tr>
                            </thead>
                            <tbody className="text-[var(--text-primary)]">
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    <td className="py-3 pr-6 text-[var(--success)]">POST</td>
                                    <td className="py-3 pr-6">/register</td>
                                    <td className="py-3 text-[var(--text-secondary)]">Create new user account</td>
                                </tr>
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    <td className="py-3 pr-6 text-[var(--success)]">POST</td>
                                    <td className="py-3 pr-6">/login</td>
                                    <td className="py-3 text-[var(--text-secondary)]">Authenticate user</td>
                                </tr>
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    <td className="py-3 pr-6 text-[var(--success)]">POST</td>
                                    <td className="py-3 pr-6">/verify-email</td>
                                    <td className="py-3 text-[var(--text-secondary)]">Verify user email address</td>
                                </tr>
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    <td className="py-3 pr-6 text-[var(--success)]">POST</td>
                                    <td className="py-3 pr-6">/forgot-password</td>
                                    <td className="py-3 text-[var(--text-secondary)]">Request password reset</td>
                                </tr>
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    <td className="py-3 pr-6 text-[var(--success)]">POST</td>
                                    <td className="py-3 pr-6">/reset-password</td>
                                    <td className="py-3 text-[var(--text-secondary)]">Set new password with token</td>
                                </tr>
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    <td className="py-3 pr-6 text-[var(--success)]">POST</td>
                                    <td className="py-3 pr-6">/upload</td>
                                    <td className="py-3 text-[var(--text-secondary)]">Upload a new image</td>
                                </tr>
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    <td className="py-3 pr-6 text-[var(--primary)]">GET</td>
                                    <td className="py-3 pr-6">/images/:id</td>
                                    <td className="py-3 text-[var(--text-secondary)]">Retrieve an image</td>
                                </tr>
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    <td className="py-3 pr-6 text-[var(--primary)]">GET</td>
                                    <td className="py-3 pr-6">/images/count</td>
                                    <td className="py-3 text-[var(--text-secondary)]">Get user's image count</td>
                                </tr>
                                <tr>
                                    <td className="py-3 pr-6 text-[var(--danger)]">DELETE</td>
                                    <td className="py-3 pr-6">/images/:id</td>
                                    <td className="py-3 text-[var(--text-secondary)]">Delete an image</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
