import { router } from "expo-router";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getMyProfile, login as loginApi } from "@/services/auths/auth.service";
import { type AuthUser, type LoginRequest } from "@/services/auths/auth.types";
import { authStorage } from "./authStorage";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await authStorage.getAccessToken();

        if (!token) {
          setUser(null);
          return;
        }

        const profileResponse = await getMyProfile();
        setUser(profileResponse.data);
      } catch (error) {
        await authStorage.clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await loginApi(data);
    const { access_token: accessToken, refresh_token: refreshToken } =
      response.data;

    await authStorage.setTokens(accessToken, refreshToken);

    const profileResponse = await getMyProfile();
    setUser(profileResponse.data);

    router.replace("/(tabs)");
  };

  const logout = async () => {
    await authStorage.clearTokens();
    setUser(null);
    router.replace("/(auth)");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
