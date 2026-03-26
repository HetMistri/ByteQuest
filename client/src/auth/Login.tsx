import { useState, type FormEvent } from "react";
import { login, loginWithGithub, loginWithGoogle } from "../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const result = await login(email.trim(), password);

    if (result.error) {
      setErrorMessage(result.error);
    }

    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (result.error) {
      setErrorMessage(result.error);
    }
  };

  const handleGithubLogin = async () => {
    const result = await loginWithGithub();
    if (result.error) {
      setErrorMessage(result.error);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="email"
        required
      />

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="password"
        required
      />

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>

      <div className="oauth-row">
        <button type="button" className="secondary-button" onClick={handleGoogleLogin}>
          Login with Google
        </button>
        <button type="button" className="secondary-button" onClick={handleGithubLogin}>
          Login with GitHub
        </button>
      </div>
    </form>
  );
}
