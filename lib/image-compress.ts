// Compresse/redimensionne une image dans le navigateur AVANT l'upload.
// Une photo de téléphone (~5 Mo) devient ~100-200 Ko → upload bien plus rapide.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export async function compressImage(file: File, maxDim = 1200, quality = 0.82): Promise<File> {
  // On ne touche pas aux non-images ni aux GIF (animation).
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const img = await loadImage(await readAsDataURL(file));
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, 'image/jpeg', quality)
    );
    if (!blob || blob.size >= file.size) return file; // on ne garde que si plus léger
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file; // en cas d'échec, on envoie l'original
  }
}
