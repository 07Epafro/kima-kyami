import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Envios — Kima Kyami',
  description: 'Informações sobre envios, zonas de entrega, prazos e portes para as encomendas Kima Kyami.',
}

const ZONAS = [
  { zona: 'Luanda', prazo: '2 – 4 dias úteis', portes: 'A calcular no checkout' },
  { zona: 'Outras Províncias', prazo: '5 – 10 dias úteis', portes: 'A calcular no checkout' },
]

export default function EnviosPage() {
  return (
    <>
      <section className="bg-cream pt-20 pb-12 text-center px-8">
        <p
          className="text-[9px] tracking-[0.45em] uppercase text-gold mb-4"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Apoio ao Cliente
        </p>
        <h1
          className="text-noir text-[clamp(32px,5vw,56px)] font-light tracking-[0.15em] uppercase"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          ENVIOS
        </h1>
        <div className="w-8 h-px bg-gold mx-auto mt-8" />
      </section>

      <section className="bg-cream pb-24 px-8 lg:px-16">
        <div className="max-w-[860px] mx-auto space-y-14">

          {/* Zonas de entrega */}
          <div>
            <p
              className="text-[9px] tracking-[0.35em] uppercase text-gold mb-8"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Zonas de Entrega
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-noir/10">
                    {['Zona', 'Prazo Estimado', 'Portes'].map(h => (
                      <th
                        key={h}
                        className="pb-4 text-[9px] tracking-[0.25em] uppercase text-noir/40 font-normal"
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ZONAS.map(z => (
                    <tr key={z.zona} className="border-b border-noir/8">
                      <td className="py-5 text-[13px] text-noir" style={{ fontFamily: 'var(--font-sans)' }}>{z.zona}</td>
                      <td className="py-5 text-[13px] text-noir/60" style={{ fontFamily: 'var(--font-sans)' }}>{z.prazo}</td>
                      <td className="py-5 text-[13px] text-noir/60" style={{ fontFamily: 'var(--font-sans)' }}>{z.portes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Como funciona */}
          <div>
            <p
              className="text-[9px] tracking-[0.35em] uppercase text-gold mb-8"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Como Funciona
            </p>
            <ol className="space-y-6">
              {[
                { n: '01', t: 'Encomenda Confirmada', d: 'Após o pagamento ser validado, a tua encomenda entra em preparação.' },
                { n: '02', t: 'Preparação do Envio', d: 'Os teus sapatos são cuidadosamente embalados. Receberes uma notificação quando o envio for despachado.' },
                { n: '03', t: 'Acompanhamento', d: 'Recebes o número de tracking por email. Podes acompanhar a encomenda em tempo real.' },
                { n: '04', t: 'Entrega', d: 'A entrega é feita no endereço indicado no momento da encomenda.' },
              ].map(passo => (
                <li key={passo.n} className="flex gap-6 items-start">
                  <span
                    className="text-[11px] text-gold tracking-[0.2em] shrink-0 mt-0.5"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {passo.n}
                  </span>
                  <div>
                    <p className="text-[13px] text-noir mb-1" style={{ fontFamily: 'var(--font-sans)' }}>{passo.t}</p>
                    <p className="text-[13px] text-noir/55 leading-[1.8]" style={{ fontFamily: 'var(--font-sans)' }}>{passo.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Notas */}
          <div className="border-t border-noir/10 pt-10">
            <p
              className="text-[9px] tracking-[0.35em] uppercase text-gold mb-6"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Informação Adicional
            </p>
            <ul className="space-y-3">
              {[
                'Os prazos indicados são estimativas e podem variar em período de alta procura.',
                'Para encomendas de valor superior, pode ser necessária assinatura na entrega.',
                'Em caso de ausência, será deixado um aviso para reagendamento.',
                'A Kima Kyami não se responsabiliza por atrasos causados pelo operador de transporte.',
              ].map((nota, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-gold text-xs mt-0.5 shrink-0">—</span>
                  <p className="text-[13px] text-noir/60 leading-[1.8]" style={{ fontFamily: 'var(--font-sans)' }}>{nota}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-noir/10 pt-12 text-center">
            <p className="text-[13px] text-noir/60 mb-6" style={{ fontFamily: 'var(--font-sans)' }}>
              Questões sobre a tua encomenda?
            </p>
            <Link
              href="/contactos"
              className="inline-block border border-noir text-noir text-[10px] tracking-[0.3em] uppercase px-10 py-4 hover:bg-noir hover:text-cream transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              CONTACTAR
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
