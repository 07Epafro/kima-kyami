import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Kima Kyami',
  description: 'Política de privacidade e proteção de dados da Kima Kyami.',
}

export default function PrivacidadePage() {
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
          POLÍTICA DE PRIVACIDADE
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
              titulo: '1. Responsável pelo Tratamento',
              corpo: 'A Kima Kyami é responsável pelo tratamento dos dados pessoais recolhidos através do website kimakyami.ao. Para questões relacionadas com a privacidade, podes contactar-nos através de geral@kimakyami.ao.',
            },
            {
              titulo: '2. Dados Recolhidos',
              corpo: 'Recolhemos os seguintes dados quando interages com o nosso website: nome completo, endereço de email, número de telefone, morada de entrega, e dados de navegação (cookies). Apenas recolhemos os dados estritamente necessários para processar as tuas encomendas e melhorar a tua experiência.',
            },
            {
              titulo: '3. Finalidade do Tratamento',
              corpo: 'Os teus dados são utilizados para: processar e gerir encomendas; comunicar o estado das entregas; responder a pedidos de apoio ao cliente; enviar comunicações de marketing (apenas com o teu consentimento explícito); e cumprir obrigações legais.',
            },
            {
              titulo: '4. Partilha de Dados',
              corpo: 'Não vendemos nem cedemos os teus dados a terceiros. Partilhamos dados apenas com prestadores de serviços essenciais ao processamento das encomendas (transportadoras, processadores de pagamento), sob acordos de confidencialidade.',
            },
            {
              titulo: '5. Segurança',
              corpo: 'Implementamos medidas técnicas e organizacionais adequadas para proteger os teus dados contra acesso não autorizado, perda ou destruição. A transmissão de dados é feita através de ligações encriptadas (HTTPS).',
            },
            {
              titulo: '6. Os Teus Direitos',
              corpo: 'Tens direito a aceder, retificar, apagar, limitar ou opor-te ao tratamento dos teus dados pessoais. Para exercer qualquer um destes direitos, contacta-nos através de geral@kimakyami.ao. Responderemos no prazo máximo de 30 dias.',
            },
            {
              titulo: '7. Cookies',
              corpo: 'Utilizamos cookies essenciais para o funcionamento do website e cookies analíticos para compreender como os visitantes interagem com o site. Podes desativar os cookies nas definições do teu browser, mas algumas funcionalidades do site poderão não funcionar corretamente.',
            },
            {
              titulo: '8. Alterações a esta Política',
              corpo: 'Podemos atualizar esta política periodicamente. Quando o fizermos, atualizamos a data no topo desta página. Recomendamos que a consultes regularmente.',
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
