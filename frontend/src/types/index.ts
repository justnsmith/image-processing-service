// src/types/index.ts

export interface User {
    id: string;
    email: string;
  }

  export interface LoginRequest {
    email: string;
    password: string;
  }

  export interface RegisterRequest {
    email: string;
    password: string;
  }

  export interface AuthResponse {
    token: string;
    user_id: string;
    email: string;
  }

  export interface ImageMeta {
    id: string;                                              // Database ID
    file_name: string;                                       // Original file name
    url: string;                                             // URL to the original image
    size: number;                                            // File size in bytes
    width: number;                                           // Image dimensions
    height: number;                                          // Image dimensions
    uploaded: string;                                        // Date string
    content_type: string;                                    // MIME type
    processed_url?: string;                                  // Processed image URL
    processing_status?: 'pending' | 'completed' | 'failed';  // Processing status
  }

  export interface UploadResponse {
    id: string;           // Database ID
    stored_key: string;   // S3 key
    original_url: string; // URL to the original image
    s3_url: string;       // This might be the same as original_url
    width: number;        // Image width
    height: number;       // Image height
    status: string;       // 'pending', etc.
    message?: string;     // Success message
  }
