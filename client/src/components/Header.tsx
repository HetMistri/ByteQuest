import Logo from "../assets/Logo.png";

type HeaderProps = {
    isAuthenticated: boolean;
    onLogout: () => void;
    onToggleProfile: () => void;
    isProfileOpen: boolean;
    isCoordinator: boolean;
};

export default function Header({ isAuthenticated, onLogout, onToggleProfile, isProfileOpen, isCoordinator }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-left">
                <img src={Logo} alt="ByteQuest logo" className="header-logo" />
                <h1 className="header-title">ByteQuest</h1>
                {isAuthenticated && isCoordinator ? <span className="role-badge">Coordinator</span> : null}
            </div>
            <div className="header-actions">
                <button
                    type="button"
                    className="icon-button"
                    aria-label="User profile"
                    onClick={onToggleProfile}
                    disabled={!isAuthenticated}
                >
                    <span>{isProfileOpen ? "Menu" : "Profile"}</span>
                </button>
                {isAuthenticated ? (
                    <button type="button" className="icon-button" onClick={onLogout}>
                        <span>Logout</span>
                    </button>
                ) : (
                    <button type="button" className="icon-button" disabled>
                        <span>Guest</span>
                    </button>
                )}
            </div>
        </header>
    );
}