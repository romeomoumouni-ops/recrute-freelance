import { initiales } from '@/lib/utils';

export default function Avatar({
  nom,
  photoUrl,
  className = 'avatar',
}: {
  nom: string;
  photoUrl?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={nom} />
      ) : (
        initiales(nom)
      )}
    </div>
  );
}
