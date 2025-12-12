import api from './apiService';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  contact: string;
  age: string;
  role: 'DRIVER' | 'PASSENGER';
  gender?: string;
  carModel?: string;
  licensePlate?: string;
  capacity?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OTPResponse {
  message: string;
  email: string;
  success: boolean;
}

export const authService = {
  // Initiate registration - sends OTP
  initiateRegistration: async (data: RegisterData): Promise<OTPResponse> => {
    const response = await api.post('/auth/register/initiate', data);
    return response.data;
  },

  // Complete registration with OTP verification
  completeRegistration: async (data: RegisterData, otp: string) => {
    const response = await api.post(`/auth/register/verify?otp=${otp}`, data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Direct login with password (no OTP required)
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Initiate login - sends OTP
  initiateLogin: async (data: LoginData): Promise<OTPResponse> => {
    const response = await api.post('/auth/login/initiate', data);
    return response.data;
  },

  // Complete login with OTP verification
  completeLogin: async (email: string, otp: string) => {
    const response = await api.post('/auth/login/verify', { email, otp });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Initiate OTP-based login (no password required)
  initiateOTPLogin: async (email: string): Promise<OTPResponse> => {
    const response = await api.post('/auth/login-otp/initiate', { email });
    return response.data;
  },

  // Verify OTP and complete OTP login
  verifyOTPLogin: async (email: string, otp: string) => {
    const response = await api.post('/auth/login-otp/verify', { email, otp });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Initiate forgot password - sends OTP to email
  initiateForgotPassword: async (email: string): Promise<OTPResponse> => {
    const response = await api.post('/auth/forgot-password/initiate', { email });
    return response.data;
  },

  // Verify forgot password OTP
  verifyForgotPasswordOTP: async (email: string, otp: string): Promise<OTPResponse> => {
    const response = await api.post('/auth/forgot-password/verify', { email, otp });
    return response.data;
  },

  // Reset password with OTP
  resetPassword: async (email: string, otp: string, newPassword: string): Promise<OTPResponse> => {
    const response = await api.post('/auth/forgot-password/reset', {
      email,
      otp,
      newPassword,
    });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email: string, purpose: 'REGISTRATION' | 'LOGIN' | 'FORGOT_PASSWORD' | 'OTP_LOGIN'): Promise<OTPResponse> => {
    const response = await api.post(`/auth/otp/resend?purpose=${purpose}`, { email });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};
