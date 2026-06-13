'use client';

import { useDevis } from './DevisProvider';

interface ServiceLite {
  id: string;
  titre: string;
  prix: number;
}

export default function DevisButton({
  service,
  className = 'btn btn-dark btn-block',
  label = 'Demander un devis',
}: {
  service?: ServiceLite;
  className?: string;
  label?: string;
}) {
  const { request } = useDevis();
  return (
    <button className={className} onClick={() => request(service)}>
      {label}
    </button>
  );
}
