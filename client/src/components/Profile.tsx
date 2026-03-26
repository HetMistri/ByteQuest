import { useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type ProfileProps = {
  session: Session;
};

export default function Profile({ session }: ProfileProps) {
  const user = session.user;
  const initialDisplayName = useMemo(
    () => (user.user_metadata?.display_name as string | undefined) ?? "",
    [user.user_metadata],
  );
  const initialPhone = useMemo(
    () => (user.user_metadata?.phone as string | undefined) ?? "",
    [user.user_metadata],
  );

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName.trim(),
        phone: phone.trim(),
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMessage("Profile updated.");
    }

    setIsSaving(false);
  };

  return (
    <section className="menu-panel">
      <h2 className="section-title">Profile</h2>
      <div className="section-divider" />
      <form className="auth-form" onSubmit={handleSave}>
        <label htmlFor="profile-email">Email</label>
        <input id="profile-email" value={user.email ?? ""} disabled />

        <label htmlFor="profile-display-name">Display Name</label>
        <input
          id="profile-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="display name"
          minLength={3}
          required
        />

        <label htmlFor="profile-phone">Phone</label>
        <input
          id="profile-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="phone"
          minLength={8}
          required
        />

        {message ? <p className="success-text">{message}</p> : null}
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <button className="primary-button" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </section>
  );
}
