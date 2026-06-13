import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '90px 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 10 }}>Page introuvable</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 28 }}>
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link className="btn btn-dark" href="/">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
