import { apiGet, apiPost } from "../api/http";
import { supabase } from "./supabase";

type AuthResult = {
  error: string | null;
  message?: string;
};

type MeResponse = {
  id: string;
  email: string | null;
  role: string;
};

type RegisterInput = {
  displayName: string;
  phone: string;
  email: string;
  password: string;
};

export const register = async ({ displayName, phone, email, password }: RegisterInput): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        phone,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  try {
    await apiPost<unknown>("/users/register", {
      userId: data.user?.id,
      email,
      displayName,
    });
  } catch {
    // Supabase remains source of truth for auth. Backend sync failures are non-blocking.
  }

  return {
    error: null,
    message: "Registration successful. If email verification is enabled, please verify your email.",
  };
};

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
};

export const loginWithGoogle = async (): Promise<AuthResult> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });

  return { error: error?.message ?? null };
};

export const loginWithGithub = async (): Promise<AuthResult> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: window.location.origin,
    },
  });

  return { error: error?.message ?? null };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return data.session;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
};

export const getCurrentUserRole = async (accessToken: string): Promise<string | null> => {
  try {
    const me = await apiGet<MeResponse>("/users/me", accessToken);
    return me.role;
  } catch {
    return null;
  }
};
