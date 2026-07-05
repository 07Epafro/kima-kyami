import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos e Condições — Kima Kyami',
  description: 'Termos e condições de utilização do website e loja online da Kima Kyami.',
}

export default function TermosPage() {
  return (
    <>
      <section className="bg-cream pt-20 pb-12 text-center px-8">
        <p
          className="text-[9px] tracking-[0.45em] uppercase text-gold mb-4"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Legal
        </p>
        <h1
          className="text-noir text-[clamp(32px,5vw,56px)] font-light tracking-[0.15em] uppercase"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          TERMOS E CONDIÇÕES
        </h1>
        <div className="w-8 h-px bg-gold mx-auto mt-8" />
      </section>

      <section className="bg-cream pb-24 px-8 lg:px-16">
        <div className="max-w-[860px] mx-auto space-y-10">
          <p className="text-[11px] text-noir/40 tracking-wide" style={{ fontFamily: 'var(--font-sans)' }}>
            Última atualização: Julho de 2025
          </p>

          {[
            {
              titulo: '1. Identificação',
              corpo: 'O website kimakyami.ao é operado pela Kima Kyami, com sede em Luanda, Angola. Para contacto: geral@kimakyami.ao.',
            },
            {
              titulo: '2. Aceitação dos Termos',
              corpo: 'Ao aceder e utilizar o website kimakyami.ao, aceitas estes Termos e Condições na sua totalidade. Se não concordares com algum destes termos, não deves utilizar o website.',
            },
            {
              titulo: '3. Registo e Conta',
              corpo: 'Para realizares uma encomenda, poderás ser necessário fornecer dados pessoais verídicos. São responsável pela confidencialidade dos teus dados de acesso e por todas as atividades realizadas na tua conta.',
            },
            {
              titulo: '4. Encomendas e Preços',
              corpo: 'Todos os preços apresentados incluem os impostos aplicáveis. A Kima Kyami reserva-se o direito de alterar preços a qualquer momento, sem aviso prévio. O preço aplicável à tua encomenda é o que estava indicado no momento da confirmação da compra.',
            },
            {
              titulo: '5. Disponibilidade de Produtos',
              corpo: 'A disponibilidade dos produtos pode variar. Reservamo-nos o direito de limitar as quantidades vendidas e de cancelar encomendas em caso de erro de preço, indisponibilidade de stock ou suspeita de fraude.',
            },
            {
              titulo: '6. Propriedade Intelectual',
              corpo: 'Todo o conteúdo do website, incluindo imagens, textos, logótipos e design, é propriedade da Kima Kyami e está protegido por direitos de autor. A reprodução, distribuição ou utilização não autorizada é proibida.',
            },
            {
              titulo: '7. Limitação de Responsabilidade',
              corpo: 'A Kima Kyami não se responsabiliza por danos indiretos resultantes da utilização do website ou dos produtos adquiridos, exceto nos casos previstos pela legislação angolana aplicável.',
            },
            {
              titulo: '8. Lei Aplicável',
              corpo: 'Estes termos são regidos pela lei angolana. Qualquer litígio decorrente da utilização do website ou das compras realizadas será submetido à jurisdição dos tribunais de Luanda, Angola.',
            },
            {
              titulo: '9. Alterações',
              corpo: 'A Kima Kyami reserva-se o direito de alterar estes Termos e Condições a qualquer momento. As alterações produzem efeitos imediatos após a sua publicação no website.',
            },
          ].map(secao => (
            <div key={secao.titulo} className="space-y-3">
              <p
                className="text-[13px] text-noir font-medium tracking-wide"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {secao.titulo}
              </p>
              <p
                className="text-[13px] text-noir/60 leading-[1.9]"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {secao.corpo}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
