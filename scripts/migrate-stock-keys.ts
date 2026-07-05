import db from '../lib/db'

async function main() {
  const produtos = await db.produto.findMany({ select: { id: true, nome: true, stock: true } })

  if (produtos.length === 0) {
    console.log('Nenhum produto encontrado.')
    return
  }

  let migrados = 0
  for (const p of produtos) {
    const keys = Object.keys(p.stock as Record<string, number>)
    const temUnderscore = keys.some(k => k.includes('_') && !k.includes('-'))

    if (temUnderscore) {
      const novoStock: Record<string, number> = {}
      for (const [k, v] of Object.entries(p.stock as Record<string, number>)) {
        novoStock[k.replace(/_/g, '-')] = v
      }
      await db.produto.update({ where: { id: p.id }, data: { stock: novoStock } })
      console.log(`✔ Migrado: ${p.nome}`)
      console.log(`  Antes:  ${JSON.stringify(p.stock)}`)
      console.log(`  Depois: ${JSON.stringify(novoStock)}`)
      migrados++
    } else {
      console.log(`✓ OK:     ${p.nome} — ${JSON.stringify(p.stock)}`)
    }
  }

  console.log(`\nTotal: ${produtos.length} produto(s), ${migrados} migrado(s).`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
