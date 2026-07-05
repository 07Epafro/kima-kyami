import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Perguntas Frequentes — Kima Kyami',
  description: 'Respostas às perguntas mais comuns sobre encomendas, entregas, trocas e os sapatos Kima Kyami.',
}

const FAQS = [
  {
    categoria: 'Encomendas & Pagamento',
    itens: [
      {
        q: 'Como posso fazer uma encomenda?',
        a: 'Navega até à nossa coleção, escolhe o modelo, tamanho e cor desejados, e adiciona ao carrinho. No checkout, preenche os teus dados e escolhe o método de pagamento.',
      },
      {
        q: 'Quais os métodos de pagamento aceites?',
        a: 'Aceitamos transferência bancária (IBAN) e pagamento por referência Multicaixa. Após a encomenda, recebes as instruções de pagamento por email.',
      },
      {
        q: 'O meu pagamento é seguro?',
        a: 'Sim. Todas as transações são processadas de forma segura. Não armazenamos dados do teu cartão bancário.',
      },
      {
        q: 'Quanto tempo tenho para efetuar o pagamento?',
        a: 'Tens 48 horas para efetuar o pagamento após a encomenda. Após esse prazo, a encomenda é cancelada automaticamente.',
      },
    ],
  },
  {
    categoria: 'Entregas',
    itens: [
      {
        q: 'Qual é o prazo de entrega?',
        a: 'Para Luanda, entregamos em 2 a 4 dias úteis. Para outras províncias, o prazo é de 5 a 10 dias úteis, dependendo da localização.',
      },
      {
        q: 'Como posso acompanhar a minha encomenda?',
        a: 'Após o envio, recebes um número de tracking por email. Podes também acompanhar o estado da encomenda na tua área de cliente.',
      },
      {
        q: 'Qual é o custo de entrega?',
        a: 'Os portes de entrega variam consoante a localização e o peso da encomenda. O valor exato é calculado no checkout antes de confirmares a compra.',
      },
    ],
  },
  {
    categoria: 'Produtos & Tamanhos',
    itens: [
      {
        q: 'Como escolho o meu tamanho correto?',
        a: 'Recomendamos consultar a nossa tabela de tamanhos disponível na página de cada produto. Em caso de dúvida, fala connosco via WhatsApp e ajudamos na escolha.',
      },
      {
        q: 'Os materiais dos sapatos são de qualidade?',
        a: 'Sim. Todos os nossos modelos são produzidos com materiais de qualidade premium, selecionados para garantir conforto e durabilidade. Cada par é feito com atenção ao detalhe.',
      },
      {
        q: 'Os produtos estão sempre disponíveis em stock?',
        a: 'Alguns modelos são de edição limitada e podem esgotar rapidamente. Activa as notificações ou contacta-nos para saber a disponibilidade de um modelo específico.',
      },
    ],
  },
]

export default function FaqPage() {
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
          PERGUNTAS FREQUENTES
        </h1>
        <div className="w-8 h-px bg-gold mx-auto mt-8" />
      </section>

      <section className="bg-cream pb-24 px-8 lg:px-16">
        <div className="max-w-[860px] mx-auto space-y-14">
          {FAQS.map(grupo => (
            <div key={grupo.categoria}>
              <p
                className="text-[9px] tracking-[0.35em] uppercase text-gold mb-8"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {grupo.categoria}
              </p>
              <div className="space-y-0">
                {grupo.itens.map((item, i) => (
                  <details
                    key={i}
                    className="group border-t border-noir/10 last:border-b"
                  >
                    <summary
                      className="flex items-center justify-between py-5 cursor-pointer list-none gap-4"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      <span className="text-[13px] text-noir tracking-wide">{item.q}</span>
                      <span className="text-gold text-lg leading-none shrink-0 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p
                      className="text-[13px] text-noir/60 leading-[1.9] pb-6 pr-8"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t border-noir/10 pt-12 text-center">
            <p
              className="text-[13px] text-noir/60 mb-6"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Não encontraste a resposta que procuravas?
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
