import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = { title: 'Inscription' };

export default function InscriptionPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
