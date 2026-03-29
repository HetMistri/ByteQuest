import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

type AuthMode = "login" | "register";

export default function Auth() {
    const [mode, setMode] = useState<AuthMode>("login");

    return (
        <section className="menu-panel">
            <h2 className="section-title">You Need to login to continue</h2>
            <div className="section-divider" />

            <div className="auth-screen">
                <div className="tabs">
                    <button
                        type="button"
                        className={`tab-button ${mode === "login" ? "active" : ""}`}
                        onClick={() => setMode("login")}
                    >
                        Login
                    </button>

                    <button
                        type="button"
                        className={`tab-button ${mode === "register" ? "active" : ""}`}
                        onClick={() => setMode("register")}
                    >
                        Register
                    </button>
                </div>
                <div className="section-divider" />
                <div>
                    {mode === "login" ? <Login /> : <Register />}
                </div></div>

        </section>
    );
}