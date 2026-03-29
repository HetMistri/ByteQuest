import { register } from "../../lib/auth";
import { useState, type FormEvent } from "react";

export default function Register() {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    const result = await register({
      displayName: displayName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
    });

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setMessage(result.message ?? "Registered successfully.");
      setPassword("");
    }

    setIsSubmitting(false);
  };

  return (
    <form className="auth-form" onSubmit={handleRegister}>
      <label htmlFor="register-display-name">Display Name</label>
      <input
        id="register-display-name"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="display name"
        minLength={3}
        required
      />

      <label htmlFor="register-phone">Phone</label>
      <input
        id="register-phone"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="phone"
        minLength={8}
        required
      />

      <label htmlFor="register-email">Email</label>
      <input
        id="register-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="email"
        required
      />

      <label htmlFor="register-password">Password</label>
      <input
        id="register-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="password"
        minLength={6}
        required
      />

      {message ? <p className="success-text">{message}</p> : null}
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Registering..." : "Register"}
      </button>
    </form>
  );
}