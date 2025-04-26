export interface User {
    id: string;
    email: string;
  }

  export interface ImageMeta {
    id: string;
    file_name: string;
    url: string;
    size: number;
    uploaded: string;
    content_type: string;
    width: number;
    height: number;
    user_id: string;
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

  export interface UploadResponse {
    message: string;
    s3_url: string;
    stored_key: string;
    width: number;
    height: number;
  }
