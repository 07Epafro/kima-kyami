import { Resend } from 'resend'
import { formatarPreco } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Kima Kyami <noreply@kimakyami.com>'

interface ItemEmail {
  nome: string
  tamanho: number
  cor: string
  quantidade: number
  precoUnit: number
}

interface EncomendaEmail {
  referencia: string
  total: number
  subtotal: number
  portes: number
  itens: ItemEmail[]
  moradaEnvio: {
    rua: string
    codigoPostal: string
    cidade: string
    pais: string
  }
  iban?: string
  titular?: string
}

interface ClienteEmail {
  nome: string
  email: string
}

function base(titulo: string, corpo: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:580px">
        <tr>
          <td style="background:#181818;padding:32px 40px;text-align:center">
            <p style="margin:0;font-size:32px;letter-spacing:12px;color:#f7c480;font-weight:300">KK</p>
            <p style="margin:6px 0 0;font-size:10px;letter-spacing:4px;color:#9a9a9a;text-transform:uppercase;font-family:Arial,sans-serif">Kima Kyami</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 24px;font-size:20px;font-weight:400;color:#181818;letter-spacing:2px">${titulo}</h1>
            ${corpo}
            <hr style="border:none;border-top:1px solid #e8e0d8;margin:32px 0">
            <p style="margin:0;font-size:11px;color:#9a9a9a;font-family:Arial,sans-serif;line-height:1.6;text-align:center">
              Kima Kyami · Luanda, Angola<br>
              Para questões: <a href="mailto:hello@kimakyami.com" style="color:#9a9a9a">hello@kimakyami.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function tabelaItens(itens: ItemEmail[], total?: number, portes?: number): string {
  const subtotal = itens.reduce((s, i) => s + i.precoUnit * i.quantidade, 0)
  const totalFinal = total ?? subtotal
  const portesVal = portes ?? 0
  const linhas = itens
    .map(
      (i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;font-size:13px;color:#181818">${i.nome}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0ebe5;font-size:12px;color:#9a9a9a;white-space:nowrap">Tam. ${i.tamanho} · ${i.cor}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;font-size:12px;color:#9a9a9a;text-align:center">×${i.quantidade}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ebe5;font-size:13px;color:#181818;text-align:right">${formatarPreco(i.precoUnit * i.quantidade)}</td>
    </tr>`
    )
    .join('')

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
    <tr>
      <th style="padding:8px 0;font-size:10px;letter-spacing:2px;color:#9a9a9a;font-weight:normal;text-align:left;text-transform:uppercase;font-family:Arial,sans-serif;border-bottom:1px solid #181818">Produto</th>
      <th style="padding:8px 8px;font-size:10px;color:#9a9a9a;font-weight:normal;text-align:left;text-transform:uppercase;font-family:Arial,sans-serif;border-bottom:1px solid #181818">Detalhes</th>
      <th style="padding:8px 0;font-size:10px;color:#9a9a9a;font-weight:normal;text-align:center;text-transform:uppercase;font-family:Arial,sans-serif;border-bottom:1px solid #181818">Qtd.</th>
      <th style="padding:8px 0;font-size:10px;color:#9a9a9a;font-weight:normal;text-align:right;text-transform:uppercase;font-family:Arial,sans-serif;border-bottom:1px solid #181818">Total</th>
    </tr>
    ${linhas}
    <tr>
      <td colspan="3" style="padding:12px 0 4px;font-size:12px;color:#9a9a9a;font-family:Arial,sans-serif">Subtotal</td>
      <td style="padding:12px 0 4px;font-size:13px;text-align:right;color:#181818">${formatarPreco(subtotal)}</td>
    </tr>
    ${portesVal > 0 ? `<tr><td colspan="3" style="padding:2px 0;font-size:12px;color:#9a9a9a;font-family:Arial,sans-serif">Portes</td><td style="padding:2px 0;font-size:13px;text-align:right;color:#181818">${formatarPreco(portesVal)}</td></tr>` : ''}
    <tr>
      <td colspan="3" style="padding:4px 0;font-size:14px;font-weight:600;color:#181818;letter-spacing:1px">Total</td>
      <td style="padding:4px 0;font-size:15px;text-align:right;color:#181818;font-weight:600">${formatarPreco(totalFinal)}</td>
    </tr>
  </table>`
}

export async function emailConfirmacaoEncomenda(enc: EncomendaEmail, cliente: ClienteEmail) {
  const corpo = `
    <p style="font-size:14px;color:#181818;line-height:1.7;font-family:Arial,sans-serif">
      Olá <strong>${cliente.nome}</strong>,<br><br>
      Recebemos a tua encomenda <strong>${enc.referencia}</strong>.
      Aguardamos o comprovante de pagamento para proceder à confirmação.
    </p>
    <div style="background:#f9f6f2;border-radius:8px;padding:20px;margin:20px 0">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:#9a9a9a;text-transform:uppercase;font-family:Arial,sans-serif">Referência</p>
      <p style="margin:0;font-size:22px;letter-spacing:4px;color:#181818">${enc.referencia}</p>
    </div>
    ${enc.iban ? `
    <div style="background:#fff8e8;border:1px solid #f7c480;border-radius:8px;padding:20px;margin:20px 0">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:2px;color:#9a9a9a;text-transform:uppercase;font-family:Arial,sans-serif">Dados para transferência bancária</p>
      <table cellpadding="0" cellspacing="0" style="width:100%">
        <tr><td style="padding:4px 0;font-size:12px;color:#9a9a9a;font-family:Arial,sans-serif;width:80px">IBAN</td><td style="padding:4px 0;font-size:13px;color:#181818;font-family:'Courier New',monospace;font-weight:600">${enc.iban}</td></tr>
        <tr><td style="padding:4px 0;font-size:12px;color:#9a9a9a;font-family:Arial,sans-serif">Titular</td><td style="padding:4px 0;font-size:13px;color:#181818;font-family:Arial,sans-serif">${enc.titular ?? 'Kima Kyami'}</td></tr>
        <tr><td style="padding:4px 0;font-size:12px;color:#9a9a9a;font-family:Arial,sans-serif">Valor</td><td style="padding:4px 0;font-size:13px;color:#181818;font-family:Arial,sans-serif;font-weight:600">${formatarPreco(enc.total)}</td></tr>
        <tr><td style="padding:4px 0;font-size:12px;color:#9a9a9a;font-family:Arial,sans-serif">Referência</td><td style="padding:4px 0;font-size:13px;color:#181818;font-family:Arial,sans-serif">${enc.referencia}</td></tr>
      </table>
      <p style="margin:12px 0 0;font-size:11px;color:#9a9a9a;font-family:Arial,sans-serif">Inclui a referência na descrição da transferência para processamento mais rápido.</p>
    </div>` : ''}
    ${tabelaItens(enc.itens, enc.total, enc.portes)}
    <div style="background:#f9f6f2;border-radius:8px;padding:16px;margin-top:20px">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;color:#9a9a9a;text-transform:uppercase;font-family:Arial,sans-serif">Morada de entrega</p>
      <p style="margin:0;font-size:13px;color:#181818;line-height:1.6;font-family:Arial,sans-serif">
        ${enc.moradaEnvio.rua}<br>
        ${enc.moradaEnvio.codigoPostal} ${enc.moradaEnvio.cidade}<br>
        ${enc.moradaEnvio.pais}
      </p>
    </div>`

  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: `Encomenda recebida — ${enc.referencia}`,
    html: base('Encomenda recebida', corpo),
  })
}

export async function emailComprovanteRecebido(enc: EncomendaEmail, cliente: ClienteEmail) {
  const corpo = `
    <p style="font-size:14px;color:#181818;line-height:1.7;font-family:Arial,sans-serif">
      Olá <strong>${cliente.nome}</strong>,<br><br>
      Recebemos o comprovante de pagamento da encomenda <strong>${enc.referencia}</strong>.
      A nossa equipa irá validar nos próximos momentos.
    </p>
    <div style="background:#fff8e8;border:1px solid #f7c480;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0;font-size:13px;color:#181818;font-family:Arial,sans-serif">
        ⏳ <strong>Em análise</strong> — Serás notificada quando o pagamento for confirmado.
      </p>
    </div>`

  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: `Comprovante recebido — ${enc.referencia}`,
    html: base('Comprovante em análise', corpo),
  })
}

export async function emailEncomendaConfirmada(enc: EncomendaEmail, cliente: ClienteEmail) {
  const corpo = `
    <p style="font-size:14px;color:#181818;line-height:1.7;font-family:Arial,sans-serif">
      Olá <strong>${cliente.nome}</strong>,<br><br>
      O pagamento foi confirmado e a tua encomenda <strong>${enc.referencia}</strong>
      está agora em preparação.
    </p>
    <div style="background:#f0faf4;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0;font-size:13px;color:#181818;font-family:Arial,sans-serif">
        ✓ <strong>Pagamento confirmado</strong> — A preparar a tua encomenda com cuidado.
      </p>
    </div>
    ${tabelaItens(enc.itens, enc.total, enc.portes)}`

  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: `Pagamento confirmado — ${enc.referencia}`,
    html: base('Encomenda confirmada', corpo),
  })
}

export async function emailEncomendaEnviada(
  enc: EncomendaEmail,
  cliente: ClienteEmail,
  tracking: string
) {
  const corpo = `
    <p style="font-size:14px;color:#181818;line-height:1.7;font-family:Arial,sans-serif">
      Olá <strong>${cliente.nome}</strong>,<br><br>
      A tua encomenda <strong>${enc.referencia}</strong> foi enviada e está a caminho!
    </p>
    <div style="background:#f9f6f2;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:3px;color:#9a9a9a;text-transform:uppercase;font-family:Arial,sans-serif">Número de tracking</p>
      <p style="margin:0;font-size:20px;letter-spacing:3px;color:#181818;font-family:'Courier New',monospace">${tracking}</p>
    </div>
    <div style="background:#f9f6f2;border-radius:8px;padding:16px;margin-top:16px">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;color:#9a9a9a;text-transform:uppercase;font-family:Arial,sans-serif">Endereço de entrega</p>
      <p style="margin:0;font-size:13px;color:#181818;line-height:1.6;font-family:Arial,sans-serif">
        ${enc.moradaEnvio.rua}<br>
        ${enc.moradaEnvio.codigoPostal} ${enc.moradaEnvio.cidade}
      </p>
    </div>`

  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: `Encomenda enviada — ${enc.referencia}`,
    html: base('A caminho! 📦', corpo),
  })
}

export async function emailEncomendaCancelada(
  enc: EncomendaEmail,
  cliente: ClienteEmail,
  motivo?: string
) {
  const corpo = `
    <p style="font-size:14px;color:#181818;line-height:1.7;font-family:Arial,sans-serif">
      Olá <strong>${cliente.nome}</strong>,<br><br>
      A encomenda <strong>${enc.referencia}</strong> foi cancelada.
      ${motivo ? `<br><br><em>${motivo}</em>` : ''}
    </p>
    <div style="background:#fff5f5;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0;font-size:13px;color:#181818;font-family:Arial,sans-serif">
        Se tiveres alguma dúvida, responde a este email ou contacta <a href="mailto:hello@kimakyami.com" style="color:#181818">hello@kimakyami.com</a>.
      </p>
    </div>`

  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: `Encomenda cancelada — ${enc.referencia}`,
    html: base('Encomenda cancelada', corpo),
  })
}
