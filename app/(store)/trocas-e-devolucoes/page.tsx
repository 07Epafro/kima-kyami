import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Trocas e Devoluções — Kima Kyami',
  description: 'Política de trocas e devoluções da Kima Kyami. Saiba como trocar ou devolver um artigo.',
}

export default function TrocasEDevolucoes() {
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
          TROCAS E DEVOLUÇÕES
        </h1>
        <div className="w-8 h-px bg-gold mx-auto mt-8" />
      </section>

      <section className="bg-cream pb-24 px-8 lg:px-16">
        <div className="max-w-[860px] mx-auto space-y-14">

          {/* Prazo */}
          <div>
            <p
              className="text-[9px] tracking-[0.35em] uppercase text-gold mb-6"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Prazo
            </p>
            <p className="text-[13px] text-noir/70 leading-[1.9]" style={{ fontFamily: 'var(--font-sans)' }}>
              Tens <strong className="text-noir font-medium">15 dias</strong> a partir da data de recepção do artigo para solicitar uma troca ou devolução.
              Após esse prazo, não nos é possível aceitar devoluções.
            </p>
          </div>

          {/* Condições */}
          <div>
            <p
              className="text-[9px] tracking-[0.35em] uppercase text-gold mb-6"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Condições
            </p>
            <ul className="space-y-4">
              {[
                'O artigo deve ser devolvido nas condições originais — sem sinais de uso, sem marcas e sem danos.',
                'O artigo deve estar na embalagem original com todos os acessórios incluídos.',
                'Artigos de coleção limitada, personalizados ou em promoção não são elegíveis para devolução.',
                'Os portes de devolução são da responsabilidade do cliente.',
              ].map((cond, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-gold text-xs mt-0.5 shrink-0">—</span>
                  <p className="text-[13px] text-noir/60 leading-[1.8]" style={{ fontFamily: 'var(--font-sans)' }}>{cond}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Como proceder */}
          <div>
            <p
              className="text-[9px] tracking-[0.35em] uppercase text-gold mb-8"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Como Proceder
            </p>
            <ol className="space-y-6">
              {[
                { n: '01', t: 'Contacta-nos', d: 'Envia-nos um email para geral@kimakyami.ao ou uma mensagem via WhatsApp, indicando o número da encomenda e o motivo da devolução.' },
                { n: '02', t: 'Aguarda a confirmação', d: 'A nossa equipa analisará o teu pedido e confirmará se o artigo é elegível para devolução em até 2 dias úteis.' },
                { n: '03', t: 'Envia o artigo', d: 'Após aprovação, envia o artigo para a morada indicada, devidamente embalado. Guarda o comprovativo de envio.' },
                { n: '04', t: 'Processamento', d: 'Após recebermos e verificarmos o artigo, processamos a troca ou reembolso em até 5 dias úteis.' },
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

          <div className="border-t border-noir/10 pt-12 text-center">
            <p className="text-[13px] text-noir/60 mb-6" style={{ fontFamily: 'var(--font-sans)' }}>
              Precisas de ajuda com uma devolução?
            </p>
            <Link
              href="/contactos"
              className="inline-block border border-noir text-noir text-[10px] tracking-[0.3em] uppercase px-10 py-4 hover:bg-noir hover:text-cream transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              FALAR CONNOSCO
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
