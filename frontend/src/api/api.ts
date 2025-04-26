import { AuthResponse, ImageMeta, LoginRequest, RegisterRequest, UploadResponse, User } from '../types';
import { getAuthToken } from '../utils/storage';

const API_URL = 'http://localhost:8080'; // Change this to match your backend URL

const headers = {
  'Content-Type': 'application/json',
};

const authHeaders = () => ({
  ...headers,
  'Authorization': `Bearer ${getAuthToken()}`,
});

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
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

export const uploadImage = async (file: File, params?: { width?: number, cropX?: number, cropY?: number, cropWidth?: number, cropHeight?: number, tintColor?: string }): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  // Add optional parameters if provided
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
      // Note: Don't set Content-Type here as the browser will set it to multipart/form-data with the boundary
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
