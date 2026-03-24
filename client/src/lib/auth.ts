import { supabase } from "./supabase";

export const register = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.log(error);
  } else {
    console.log("Registered");
    console.log(data);
  }
};

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log(error);
  } else {
    console.log("Logged in");

    const session = supabase.auth.getSession();
    console.log(session);

    console.log(data);
  }
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.log(error);
    return null;
  } else {
    return data.session;
  }
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log(error);
  } else {
    console.log("Logged out");
  }
};