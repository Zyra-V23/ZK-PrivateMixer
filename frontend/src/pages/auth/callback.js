import { useEffect } from "react";
import { useBedrockPassport } from "@bedrock_org/passport";

export default function AuthCallback() {
  const { loginCallback } = useBedrockPassport();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    const login = async (token: string, refreshToken: string) => {
      const success = await loginCallback(token, refreshToken);
      if (success) {
        window.location.href = "/";
      }
    };

    if (token && refreshToken) {
      login(token, refreshToken);
    }
  }, [loginCallback]);

  return <div>Iniciando sesión...</div>;
}