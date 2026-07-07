import type { Metadata } from 'next'
import { Mail, Phone, MapPin, Instagram } from 'lucide-react'
import db from '@/lib/db'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contactos — Kima Kyami',
  description: 'Fala connosco. Email, WhatsApp e Instagram da Kima Kyami.',
}

const DEFAULTS = {
  email: 'geral@kimakyami.ao',
  whatsapp: '+244 943771341',
  whatsappUrl: 'https://wa.me/244943771341',
  instagram: '@kimakyami',
  instagramUrl: 'https://instagram.com/kimakyami',
  localizacao: 'Luanda, Angola',
  horario: 'Segunda — Sexta: 09h00 – 18h00\nSábado: 10h00 – 14h00\nDomingo: Encerrado',
}

export default async function ContactosPage() {
  let config = DEFAULTS
  try {
    const row = await db.configLoja.findUnique({ where: { id: 'singleton' } })
    if (row) config = row
  } catch {
    // fall through to defaults
  }

  const horarioLinhas = config.horario.split('\n')

  return (
    <>
      {/* ─── Header ─── */}
      <section className="bg-cream pt-16 lg:pt-35 pb-12 text-center px-8">
        <p className="text-[9px] tracking-[0.45em] uppercase text-gold mb-4 font-sans">
          Fala Connosco
        </p>
        <h1 className="text-noir text-[clamp(32px,5vw,56px)] font-light tracking-[0.15em] uppercase font-serif">
          CONTACTOS
        </h1>
        <div className="w-8 h-px bg-gold mx-auto mt-8" />
      </section>

      {/* ─── Grid: Info + Form ─── */}
      <section className="bg-cream section-pb px-8 lg:px-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Info */}
          <div className="space-y-10">
            <div>
              <p className="text-[9px] tracking-[0.35em] uppercase text-noir/55 mb-8 font-sans">
                Informações
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail size={15} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-noir/55 mb-1 font-sans">
                      Email
                    </p>
                    <a
                      href={`mailto:${config.email}`}
                      className="text-[13px] text-noir hover:text-gold transition-colors tracking-wide font-sans"
                    >
                      {config.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone size={15} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-noir/55 mb-1 font-sans">
                      WhatsApp
                    </p>
                    <a
                      href={config.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-noir hover:text-gold transition-colors tracking-wide font-sans"
                    >
                      {config.whatsapp}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin size={15} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-noir/55 mb-1 font-sans">
                      Localização
                    </p>
                    <p className="text-[13px] text-noir tracking-wide font-sans">
                      {config.localizacao}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Instagram size={15} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-noir/55 mb-1 font-sans">
                      Instagram
                    </p>
                    <a
                      href={config.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-noir hover:text-gold transition-colors tracking-wide font-sans"
                    >
                      {config.instagram}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-noir/8 pt-10">
              <p className="text-[9px] tracking-[0.35em] uppercase text-noir/55 mb-4 font-sans">
                Horário de Atendimento
              </p>
              <p className="text-[13px] text-noir/60 leading-[1.9] font-sans">
                {horarioLinhas.map((linha, i) => (
                  <span key={i}>
                    {linha}
                    {i < horarioLinhas.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Form */}
          <div>
            <p className="text-[9px] tracking-[0.35em] uppercase text-noir/55 mb-8 font-sans">
              Enviar Mensagem
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}
