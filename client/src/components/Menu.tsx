import { useState } from "react";
import { useNavigate } from "react-router-dom";

type MenuProps = {
  displayName: string;
  role: string;
};

export default function Menu({ displayName, role }: MenuProps) {
  const [view] = useState<"menu">("menu");
  const navigate = useNavigate();
  const isCoordinator = role === "coordinator";

  return (
    <section className="menu-panel">
      <h2 className="section-title">Menu</h2>
      <div className="section-divider" />
      <p className="status-text">Welcome, {displayName}</p>

      {view === "menu" ? (
        <div className="menu-home">
          <ul className="menu-list">
            <li
              className="menu-item"
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
          <p className="status-text compact">
            {isCoordinator ? "Coordinator mode enabled" : "Participant mode enabled"}
          </p>
        </div>
      ) : null}
    </section>
  );
}
