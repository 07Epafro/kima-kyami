import { auth } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp']
const TIPOS_ACEITES = [...TIPOS_IMAGEM, 'application/pdf']
const LIMITE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" obrigatório' }, { status: 400 })
  }

  if (!TIPOS_ACEITES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo não suportado. Use JPEG, PNG, WebP ou PDF.' },
      { status: 400 },
    )
  }

  if (file.size > LIMITE_BYTES) {
    return NextResponse.json(
      { error: 'Ficheiro demasiado grande. Limite: 10 MB.' },
      { status: 400 },
    )
  }

  const tipo = formData.get('tipo')?.toString() ?? 'produto'
  const isImagem = TIPOS_IMAGEM.includes(file.type)

  // Admin-only uploads require a session
  if (tipo === 'produto') {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const folder = tipo === 'comprovante' ? 'kima-kyami/comprovativos' : 'kima-kyami/produtos'

    const result = await new Promise<{ secure_url: string; public_id: string; format: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              resource_type: 'auto',
              ...(isImagem && {
                transformation: [{ width: 1400, crop: 'limit' }],
                quality: 'auto',
              }),
            },
            (err, res) => {
              if (err || !res) reject(err ?? new Error('Resposta vazia do Cloudinary'))
              else resolve(res as { secure_url: string; public_id: string; format: string })
            },
          )
          .end(buffer)
      },
    )

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
    })
  } catch {
    return NextResponse.json({ error: 'Falha no upload para Cloudinary' }, { status: 500 })
  }
}
