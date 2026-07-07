import { auth } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp']
const TIPOS_ACEITES = [...TIPOS_IMAGEM, 'application/pdf']
const LIMITE_BYTES = 10 * 1024 * 1024 // 10 MB

function verificarMagicBytes(buf: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  }
  if (mimeType === 'image/png') {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  }
  if (mimeType === 'image/webp') {
    const riff = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
    const webp = buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    return riff && webp
  }
  if (mimeType === 'application/pdf') {
    return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46
  }
  return false
}

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Demasiados pedidos. Tenta novamente em breve.' }, { status: 429 })
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
  if (tipo !== 'produto' && tipo !== 'comprovante') {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }
  const isImagem = TIPOS_IMAGEM.includes(file.type)

  // Admin-only uploads require a session
  if (tipo === 'produto') {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  // Comprovante uploads require a real pagamentoId
  if (tipo === 'comprovante') {
    const pagamentoId = formData.get('pagamentoId')?.toString()
    if (!pagamentoId) {
      return NextResponse.json({ error: 'pagamentoId obrigatório para comprovante' }, { status: 400 })
    }
    const pagamento = await db.pagamento.findUnique({ where: { id: pagamentoId }, select: { id: true } })
    if (!pagamento) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    if (!verificarMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: 'Conteúdo do ficheiro não corresponde ao tipo declarado' },
        { status: 400 },
      )
    }
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
