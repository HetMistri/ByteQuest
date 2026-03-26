type FooterProps = {
    registeredPlayers: number;
};

export default function Footer({ registeredPlayers }: FooterProps) {
    return (
        <footer className="footer">
            <p className="footer-text">Copyright Owned by ICT Ganpat University</p>
            <p className="footer-text">Registered Players: {registeredPlayers}</p>
        </footer>
    );
}