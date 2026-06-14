import AdminBroadcastForm from '@/components/admin/AdminBroadcastForm';

export const dynamic = 'force-dynamic';

export default function AdminCommunication() {
  return (
    <>
      <h1 className="admin-h1">Communication</h1>
      <p className="admin-sub">
        Envoie un e-mail à tous tes utilisateurs ou à un segment (clients / freelances). Les comptes
        bannis sont exclus. Envoyé via Resend depuis notifications@recrutefreelance.com.
      </p>
      <AdminBroadcastForm />
    </>
  );
}
