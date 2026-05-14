export interface loginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  course: string;
  yop: number;
  profile_pic?: string;
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: AuthUser;
}

export interface LoginRequest {
  Identifier: string;
  password: string;
}

export interface OtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyCollegeRequest {
  college: string;
  email: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  name: string;
  course: string;
  yop: number;
  password: string;
  confirm_password: string;
}
export type FormErrors = {
  college?: string;
  email?: string;
  otp?: string;
  name?: string;
  username?: string;
  course?: string;
  password?: string;
  confirmPassword?: string;
  api?: string;
};
