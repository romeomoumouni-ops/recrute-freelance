import { getAllConversations } from '@/lib/admin-conversations';
import AdminConversationsView from '@/components/admin/AdminConversationsView';

export const dynamic = 'force-dynamic';

export default async function AdminConversationsPage() {
  const rows = await getAllConversations();
  return (
    <>
      <h1 className="admin-h1">Messageries</h1>
      <p className="admin-sub">
        Toutes les conversations de la plateforme ({rows.length}). Clique pour lire le fil complet
        (lecture seule). Les conversations contenant des messages signalés sont en surbrillance.
      </p>
      <AdminConversationsView rows={rows} />
    </>
  );
}
