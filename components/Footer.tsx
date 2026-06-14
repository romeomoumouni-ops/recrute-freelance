import Link from 'next/link';
import { Globe } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/" aria-label="Recrute Freelance — accueil">
              <Logo />
            </Link>
            <p className="tagline">
              La plateforme qui connecte les entreprises européennes aux freelances d&apos;Afrique
              francophone.
            </p>
          </div>
          <div>
            <h4>Plateforme</h4>
            <ul>
              <li>
                <Link href="/recherche">Trouver un freelance</Link>
              </li>
              <li>
                <Link href="/#comment">Comment ça marche</Link>
              </li>
              <li>
                <Link href="/#">Tarifs</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Communauté</h4>
            <ul>
              <li>
                <Link href="/#entreprises">Pour les entreprises</Link>
              </li>
              <li>
                <Link href="/#freelances">Pour les freelances</Link>
              </li>
              <li>
                <Link href="/#">Blog</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li>
                <Link href="/#">Centre d&apos;aide</Link>
              </li>
              <li>
                <Link href="/#">Contact</Link>
              </li>
              <li>
                <Link href="/#">Conditions d&apos;utilisation</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 recrutefreelance.com — Tous droits réservés</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Globe size={15} /> FR</span>
        </div>
      </div>
    </footer>
  );
}
