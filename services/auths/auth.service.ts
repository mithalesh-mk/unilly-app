import axiosInstance from "@/utils/Axios";
import {
  loginResponse as AuthResponse,
  LoginRequest,
  MeResponse,
  OtpRequest,
  SignupRequest,
  VerifyOtpRequest,
} from "./auth.types";
import { isAxiosError } from "axios";

// 🔐 LOGIN
export const login = async (data: LoginRequest) => {
  const response = await axiosInstance.post<AuthResponse>("/auth/login", data);
  return response.data;
};

export const getMyProfile = async () => {
  const response = await axiosInstance.get<MeResponse>("/auth/me");
  return response.data;
};

// 📩 GENERATE OTP
export const generateOtp = async (data: OtpRequest) => {
  const response = await axiosInstance.post<AuthResponse>(
    "/auth/generate-otp",
    data,
  );
  return response.data;
};

// ✅ VERIFY OTP
export const verifyOtp = async (data: VerifyOtpRequest) => {
  const response = await axiosInstance.post<AuthResponse>(
    "/auth/verify-otp",
    data,
  );
  return response;
};

//Signup
export const signup = async (data: SignupRequest) => {
  const response = await axiosInstance.post<AuthResponse>("/auth/signup", data);
  return response.data;
};

//getProfile
export const getProfile = async () => {
  const response = await axiosInstance.get<MeResponse>("/auth/me");
  return response.data;
};

export const getApiError = (error: unknown) => {
  if (!isAxiosError(error)) {
    return {
      code: undefined,
      message: "Something went wrong. Please try again.",
    };
  }

  const responseData = error.response?.data as
    | {
        error?: {
          code?: string;
          message?: string;
        };
        message?: string;
      }
    | undefined;

  return {
    code: responseData?.error?.code,
    message:
      responseData?.error?.message ||
      responseData?.message ||
      "Something went wrong. Please try again.",
  };
};

// 🏫 VERIFY COLLEGE
// export const verifyCollege = async (data: VerifyCollegeRequest) => {
//   const response = await axiosInstance.post<AuthResponse>(
//     "/auth/verify",
//     data,
//   );
//   return response.data;
// };
