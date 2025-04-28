import { AuthResponse, ImageMeta, LoginRequest, RegisterRequest, UploadResponse, User } from '../types';
import { getAuthToken } from '../utils/storage';

// Dynamically determine API URL based on environment
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8080'
  : ''; // Empty string means use relative URLs (same domain) when deployed

const headers = {
    'Content-Type': 'application/json',
};

const authHeaders = () => ({
    ...headers,
    'Authorization': `Bearer ${getAuthToken()}`,
});

export interface EmailVerificationResponse {
    success: boolean;
    message: string;
    token?: string;
    user_id?: string;
    email?: string;
}
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
        console.log(`Attempting to login with email: ${credentials.email}`);

        // Normalize email to lowercase to avoid case sensitivity issues
        const normalizedCredentials = {
            email: credentials.email.toLowerCase(),
            password: credentials.password
        };

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers,
            body: JSON.stringify(normalizedCredentials),
        });

        // Get the response text
        const responseText = await response.text();
        console.log('Login response status:', response.status);
        console.log('Login response text:', responseText);

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse response as JSON:', responseText);
            throw new Error(responseText || 'Login failed: Invalid server response');
        }

        // If response is not OK, throw error with message from server
        if (!response.ok) {
            console.error('Login failed with status:', response.status);
            // Check for specific error messages related to verification
            if (data.error && data.error.toLowerCase().includes('not verified')) {
                throw new Error('Email not verified');
            }
            throw new Error(data.error || 'Login failed with status: ' + response.status);
        }

        // Log success with user ID
        console.log(`Login successful for user ID: ${data.user_id}`);
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};
export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }
    return response.json();
};

export const verifyEmail = async (token: string): Promise<EmailVerificationResponse> => {
    console.log(`Sending verification request with token: ${token}`);

    try {
        const response = await fetch(`${API_URL}/verify-email`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ token }),
        });

        const data = await response.json();
        console.log('Verification API response:', data);

        if (!response.ok) {
            // Handle the specific "no rows in result set" error
            if (data.error && data.error.includes('no rows in result set')) {
                throw new Error('This verification link has already been used or expired');
            }
            throw new Error(data.error || data.message || 'Email verification failed');
        }

        return {
            success: true,
            message: data.message || 'Email verified successfully',
            token: data.token,
            user_id: data.user_id,
            email: data.email
        };
    } catch (error) {
        console.error('Verification error in API:', error);
        throw error;
    }
};

export const resendVerification = async (email: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/resend-verification`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend verification email');
    }
    return response.json();
};

export const getUserProfile = async (): Promise<User> => {
    const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: authHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user profile');
    }
    return response.json();
};

export const getUserImages = async (): Promise<{ images: ImageMeta[] }> => {
    const response = await fetch(`${API_URL}/images`, {
        method: 'GET',
        headers: authHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch images');
    }
    return response.json();
};

export const uploadImage = async (
    file: File,
    params?: {
        width?: number,
        cropX?: number,
        cropY?: number,
        cropWidth?: number,
        cropHeight?: number,
        tintColor?: string
    }
): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (params?.width) formData.append('width', params.width.toString());
    if (params?.cropX) formData.append('cropX', params.cropX.toString());
    if (params?.cropY) formData.append('cropY', params.cropY.toString());
    if (params?.cropWidth) formData.append('cropWidth', params.cropWidth.toString());
    if (params?.cropHeight) formData.append('cropHeight', params.cropHeight.toString());
    if (params?.tintColor) formData.append('tintColor', params.tintColor);

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            // Note: Don't set Content-Type here as the browser will set it with boundary
        },
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
    }
    return response.json();
};

export const deleteImage = async (imageId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/images/${imageId}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete image');
    }
};

export const getImageStatus = async (imageId: string): Promise<{ status: string, processed_url?: string }> => {
    console.log(`Checking status for image ID: ${imageId}`);
    const response = await fetch(`${API_URL}/images/${imageId}/status`, {
        method: 'GET',
        headers: authHeaders(),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Status code: ${response.status}` }));
        throw new Error(error.error || 'Failed to get image status');
    }
    return response.json();
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process password reset request');
    }
    return response.json();
};

export const verifyResetToken = async (token: string): Promise<{ message: string, email: string }> => {
    const response = await fetch(`${API_URL}/verify-reset-token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ token }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid or expired reset token');
    }
    return response.json();
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
    }
    return response.json();
};

export const getUserImageCount = async (): Promise<{ count: number }> => {
    const response = await fetch(`${API_URL}/images/count`, {
      method: 'GET',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch image count');
    }
    return response.json();
  };
