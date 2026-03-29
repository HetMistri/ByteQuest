type FooterProps = {
    registeredPlayers: number;
};

export default function Footer({ registeredPlayers }: FooterProps) {
    return (
        <footer className="footer">
            <p className="footer-text">󰗦 2026, All rights reserved</p>
            <p className="footer-text">
                Registered Players: <strong>{registeredPlayers}</strong>
            </p>
        </footer>
    );
}