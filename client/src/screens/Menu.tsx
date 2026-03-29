import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const [view] = useState<"menu">("menu");
  const navigate = useNavigate();

  return (
    <section className="menu-panel menu-screen">
      <div className="menu-container">
        <h2 className="section-title">SELECT MODE</h2>

        {view === "menu" && (
          <div className="menu-actions">
            <button
              className="menu-action-button"
              onClick={() => navigate("/events")}
            >
              PLAY
            </button>

            <button className="menu-action-button muted" disabled>
              SETTINGS
              <span className="menu-subtext">coming soon</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}