import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

type AuthMode = "login" | "register";

export default function Auth() {
    const [mode, setMode] = useState<AuthMode>("login");

    return (
        <section className="menu-panel">
            {/* <div className="section-divider" /> */}

            <div className="auth-screen">
                <div className="section-divider" />
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