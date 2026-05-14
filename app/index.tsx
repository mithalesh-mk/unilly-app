import { useAuth } from "@/utils/Auths/AuthContext";
import { Redirect } from "expo-router";

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)"} />;
}
