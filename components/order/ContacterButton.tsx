'use client';

import { useOrder } from './OrderProvider';

export default function ContacterButton({
  className = 'btn btn-dark btn-block',
  label = 'Contacter',
}: {
  className?: string;
  label?: string;
}) {
  const { contact } = useOrder();
  return (
    <button className={className} onClick={contact}>
      {label}
    </button>
  );
}
