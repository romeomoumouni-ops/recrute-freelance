import AdminSupportView from '@/components/admin/AdminSupportView';

export const dynamic = 'force-dynamic';

export default function AdminSupport() {
  return (
    <>
      <h1 className="admin-h1">Support</h1>
      <p className="admin-sub">Messages envoyés par les clients et freelances depuis le bouton de support.</p>
      <AdminSupportView />
    </>
  );
}
