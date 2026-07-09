function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}

function normalizeImageError(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.heic') || name.endsWith('.heif') || file.type.includes('heic') || file.type.includes('heif')) {
    return new Error('HEIC photos are not supported by this browser. Please choose JPEG/PNG or use camera “Most Compatible” mode.');
  }
  return new Error('This photo could not be loaded. Please try a JPEG or PNG image.');
}

export async function compressImage(file: File, maxSize = 1600, quality = 0.86): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas unsupported'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(normalizeImageError(file));
    img.src = dataUrl;
  });
}
