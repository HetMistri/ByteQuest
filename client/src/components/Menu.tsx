type MenuProps = {
  displayName: string;
};

export default function Menu({ displayName }: MenuProps) {
  return (
    <section className="menu-panel">
      <h2 className="section-title">Menu</h2>
      <div className="section-divider" />
      <p className="status-text">Welcome, {displayName}</p>
      <ul className="menu-list">
        <li className="menu-item">Play</li>
        <li className="menu-item muted">Settings</li>
      </ul>
    </section>
  );
}
