import type { Metadata } from 'next';
import { Suspense } from 'react';
import ResetForm from './ResetForm';

export const metadata: Metadata = { title: 'Nouveau mot de passe' };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
