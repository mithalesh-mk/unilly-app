import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import { authStorage } from "./Auths/authStorage";

const API_BASE_URL = {
  development: process.env.EXPO_PUBLIC_DEVELOPMENT_URL,
  production: "https://uniliy-api.onrender.com/",
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL.development,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

type RefreshTokenResponse = {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
  };
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshTokenRequest: Promise<string | null> | null = null;

const setAuthorizationHeader = (
  config: InternalAxiosRequestConfig,
  token: string,
) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  if (config.headers instanceof AxiosHeaders) {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    (config.headers as Record<string, string>).Authorization =
      `Bearer ${token}`;
  }
};

const refreshAccessToken = async () => {
  const refreshToken = await authStorage.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await axios.post<RefreshTokenResponse>(
    `${axiosInstance.defaults.baseURL}/auth/refresh-token`,
    {
      refresh_token: refreshToken,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: axiosInstance.defaults.timeout,
    },
  );

  const { access_token: accessToken, refresh_token: nextRefreshToken } =
    response.data.data;

  await authStorage.setTokens(accessToken, accessToken);

  return accessToken;
};

// 🔐 Request Interceptor (Attach Token)
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await authStorage.getAccessToken();

    if (token) {
      setAuthorizationHeader(config, token);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ❌ Response Interceptor (Global Error Handling)

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const axiosError = error as AxiosError;
    const originalRequest = axiosError.config as
      | RetryableRequestConfig
      | undefined;

    if (
      axiosError.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh-token"
    ) {
      originalRequest._retry = true;

      try {
        refreshTokenRequest ??= refreshAccessToken().finally(() => {
          refreshTokenRequest = null;
        });

        const newAccessToken = await refreshTokenRequest;

        if (!newAccessToken) {
          await authStorage.clearTokens();
          return Promise.reject(error);
        }

        setAuthorizationHeader(originalRequest, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        await authStorage.clearTokens();
        console.log("Session expired");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
