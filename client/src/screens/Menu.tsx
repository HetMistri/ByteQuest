import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const [view] = useState<"menu">("menu");
  const navigate = useNavigate();

  return (
    <section className="menu-panel">
      <h2 className="section-title">Menu</h2>
      <div className="section-divider" />
      {view === "menu" ? (
        <div className="menu-home">
          <ul className="menu-list">
            <li
              className={`menu-item  `}
              role="button"
              tabIndex={0}
              onClick={() => navigate("/events")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate("/events");
                }
              }}
            >
              Play
            </li>
            <li className="menu-item muted">Settings (Coming Soon)</li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}
