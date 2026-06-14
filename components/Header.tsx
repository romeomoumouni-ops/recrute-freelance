'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, Settings, Menu, X } from 'lucide-react';
import { initiales } from '@/lib/utils';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import NotificationBell from './NotificationBell';

interface Me {
  authenticated: boolean;
  id?: string;
  prenom?: string;
  role?: 'CLIENT' | 'FREELANCE';
  photoUrl?: string | null;
  unread?: number;
  notifUnread?: number;
}

export default function Header() {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' });
      setMe((await res.json()) as Me);
    } catch {
      /* ignore */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 8000);
    return () => clearInterval(i);
  }, [load, pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function signOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const logged = loaded && me?.authenticated;
  const profileHref = me?.role === 'FREELANCE' ? `/freelance/${me?.id}` : '/dashboard';

  return (
    <header className="header">
      <div className="container header-inner">
        <Link className="logo" href="/">
          recrute<span>freelance</span>
        </Link>

        <nav className="nav">
          <Link href="/recherche">Trouver un freelance</Link>
          <Link href="/#comment">Comment ça marche</Link>
          {logged && <Link href="/dashboard">Tableau de bord</Link>}
          {logged && <Link href="/messages">Messagerie</Link>}
        </nav>

        <div className="header-actions">
          {!loaded ? null : logged ? (
            <>
              <Link className="link-login icon-link" href="/messages" title="Messagerie">
                <MessageCircle size={20} strokeWidth={1.75} />
                {!!me?.unread && <span className="badge-count">{me.unread}</span>}
              </Link>
              <Link className="link-login icon-link" href="/parametres" title="Paramètres">
                <Settings size={20} strokeWidth={1.75} />
              </Link>
              {me?.role === 'FREELANCE' && (
                <Link className="link-login hide-sm" href="/mon-profil">
                  Modifier mon profil
                </Link>
              )}
              <Link
                className="link-login"
                href={profileHref}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {me?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={me.photoUrl}
                    alt=""
                    style={{
                      width: 34,
                      height: 34,
                      minWidth: 34,
                      minHeight: 34,
                      flexShrink: 0,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      display: 'block',
                      aspectRatio: '1 / 1',
                    }}
                  />
                ) : (
                  <span
                    className="avatar"
                    style={{ width: 34, height: 34, minWidth: 34, flexShrink: 0, fontSize: '.7rem', display: 'inline-flex' }}
                  >
                    {initiales(me?.prenom || '?')}
                  </span>
                )}
                <span className="hide-sm">{me?.prenom}</span>
              </Link>
              <button className="btn btn-outline btn-sm" onClick={signOut}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link className="link-login" href="/connexion">
                Se connecter
              </Link>
              <Link className="btn btn-dark" href="/inscription">
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>

        {logged && <NotificationBell count={me?.notifUnread || 0} onRead={load} />}

        <button
          className="hamburger"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <div className="container">
            <Link href="/recherche" className="mm-link">
              Trouver un freelance
            </Link>
            <Link href="/#comment" className="mm-link">
              Comment ça marche
            </Link>
            {logged ? (
              <>
                <Link href="/dashboard" className="mm-link">
                  Tableau de bord
                </Link>
                <Link href="/messages" className="mm-link">
                  Messagerie {!!me?.unread && <span className="badge-count">{me.unread}</span>}
                </Link>
                {me?.role === 'FREELANCE' && (
                  <Link href="/mon-profil" className="mm-link">
                    Modifier mon profil
                  </Link>
                )}
                <Link href={profileHref} className="mm-link">
                  Mon profil
                </Link>
                <Link href="/parametres" className="mm-link">
                  Paramètres
                </Link>
                <button
                  className="btn btn-outline btn-block"
                  style={{ marginTop: 8 }}
                  onClick={signOut}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
                <Link className="btn btn-outline btn-block" href="/connexion">
                  Se connecter
                </Link>
                <Link className="btn btn-dark btn-block" href="/inscription">
                  S&apos;inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
