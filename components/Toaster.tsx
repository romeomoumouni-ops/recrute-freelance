'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function Toaster() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function fire(message: string) {
    setMsg(message);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 3500);
  }

  useEffect(() => {
    function handler(e: Event) {
      fire((e as CustomEvent<string>).detail);
    }
    window.addEventListener('rf-toast', handler);
    return () => window.removeEventListener('rf-toast', handler);
  }, []);

  // Toast déclenché par un paramètre d'URL (?toast=...) puis nettoyé.
  useEffect(() => {
    const t = searchParams.get('toast');
    if (t) {
      fire(decodeURIComponent(t));
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete('toast');
      const qs = params.toString();
      router.replace(pathname + (qs ? `?${qs}` : ''), { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return <div className={`toast${show ? ' show' : ''}`}>{msg}</div>;
}
