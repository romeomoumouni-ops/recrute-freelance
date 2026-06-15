import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getConversationsFor } from '@/lib/conversations';
import { getSetting } from '@/lib/settings';
import MessagesClient from './MessagesClient';

export const metadata: Metadata = { title: 'Messagerie' };
export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const session = await auth();
  if (!session) redirect('/connexion?callbackUrl=/messages');

  const [conversations, banner] = await Promise.all([
    getConversationsFor(session.user.id),
    getSetting('banner_messagerie'),
  ]);

  return (
    <div className="container">
      <Suspense fallback={null}>
        <MessagesClient
          initialConversations={conversations}
          banner={banner}
          role={session.user.role as 'CLIENT' | 'FREELANCE'}
        />
      </Suspense>
    </div>
  );
}
