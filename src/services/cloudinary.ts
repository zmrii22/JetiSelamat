const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const UNSIGNED_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UNSIGNED_PRESET ?? '';

export const muatNaikImejCloudinary = async (uri: string) => {
  if (!CLOUD_NAME || !UNSIGNED_PRESET) {
    throw new Error('Konfigurasi Cloudinary belum lengkap.');
  }

  const formData = new FormData();
  formData.append('upload_preset', UNSIGNED_PRESET);
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: `bukti_${Date.now()}.jpg`,
  } as any);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Gagal muat naik imej ke Cloudinary.');
  }

  const data = await response.json();
  return data.secure_url as string;
};
