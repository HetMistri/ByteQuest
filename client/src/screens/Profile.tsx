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
      setErrorMessage(`Profile update rejected by Supabase: ${error.message}`);
    } else {
      setMessage("Profile updated successfully. New display name and phone are now stored in your Supabase user metadata.");
    }

    setIsSaving(false);
  };

  return (
    <section className="menu-panel profile-screen">
      <div className="profile-container">
        <h2 className="section-title">PROFILE</h2>

        {/* ===== SYSTEM INFO ===== */}
        <div className="profile-block">
          <h3 className="section-title mini">[ SYSTEM ]</h3>

          <p className="profile-line">
            <span className="profile-label">&gt; email:</span>
            <span className="profile-value">{user.email}</span>
          </p>
        </div>

        {/* ===== EDITABLE ===== */}
        <div className="profile-block">
          <h3 className="section-title mini">[ EDIT ]</h3>

          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-field">
              <span className="profile-label">&gt; display_name:</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="display name"
                minLength={3}
                required
              />
            </div>

            <div className="profile-field">
              <span className="profile-label">&gt; phone:</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="phone"
                minLength={8}
                required
              />
            </div>

            {message && <p className="success-text">{message}</p>}
            {errorMessage && <p className="error-text">{errorMessage}</p>}

            <button className="primary-button" disabled={isSaving}>
              {isSaving ? "Saving..." : "SAVE"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}