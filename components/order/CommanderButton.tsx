'use client';

import { useOrder } from './OrderProvider';

interface ServiceLite {
  id: string;
  titre: string;
  prix: number;
  delaiJours: number;
}

export default function CommanderButton({
  service,
  className = 'btn btn-dark btn-block',
  label = 'Commander la mission',
}: {
  service?: ServiceLite;
  className?: string;
  label?: string;
}) {
  const { startGeneral, startService } = useOrder();
  return (
    <button
      className={className}
      onClick={() => (service ? startService(service) : startGeneral())}
    >
      {label}
    </button>
  );
}
