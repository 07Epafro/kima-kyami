import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export default function PageHeader({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 lg:mb-16">
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2.5 rounded-lg bg-a-gold/10 shrink-0">
          <Icon size={20} strokeWidth={1.5} className="text-a-gold" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-[28px] leading-[1.2] font-medium text-a-charcoal">{title}</h1>
          <p className="text-sm leading-[1.5] text-a-muted mt-1 max-w-2xl">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0 *:w-full sm:*:w-auto">{action}</div>}
    </div>
  )
}
