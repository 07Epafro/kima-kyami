import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function extrairPublicId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url)
    if (hostname !== 'res.cloudinary.com') return null
    const match = pathname.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// Apaga o asset antigo no Cloudinary quando é substituído/removido. Nunca lança —
// falhar isto não deve impedir a operação principal (guardar a nova imagem).
export async function apagarAssetsCloudinary(urls: string[]): Promise<void> {
  const publicIds = urls.map(extrairPublicId).filter((id): id is string => id !== null)
  await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId).catch((err) => {
        console.error('[cloudinary-cleanup] Falha ao apagar asset', publicId, err)
      }),
    ),
  )
}
