import { PrismaClient, Categoria, EstadoEncomenda, EstadoPagamento, RoleAdmin } from '@prisma/client'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'

const prisma = new PrismaClient()

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function gerarStock(tamanhos: number[], cores: { nome: string; hex: string }[]): Record<string, number> {
  const stock: Record<string, number> = {}
  const quantidades = [0, 1, 2, 3, 4, 5]
  for (const tamanho of tamanhos) {
    for (const cor of cores) {
      const idx = Math.abs((tamanho * 7 + cor.nome.length * 3) % quantidades.length)
      stock[`${tamanho}-${cor.nome}`] = quantidades[idx]
    }
  }
  return stock
}

async function main() {
  await prisma.itemEncomenda.deleteMany()
  await prisma.pagamento.deleteMany()
  await prisma.encomenda.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.produto.deleteMany()
  await prisma.admin.deleteMany()

  const senhaAdmin = await bcrypt.hash('Admin@2024!', 12)

  await prisma.admin.create({
    data: {
      nome: 'Administrador',
      email: 'admin@kimakyami.com',
      password: senhaAdmin,
      role: RoleAdmin.SUPER_ADMIN,
    },
  })

  const coresLunaNoir = [
    { nome: 'Noir', hex: '#181818' },
    { nome: 'Nude', hex: '#c4a882' },
  ]
  const coresAuroraGold = [
    { nome: 'Gold', hex: '#f7c480' },
    { nome: 'Camel', hex: '#c19a6b' },
  ]
  const coresEclatNoir = [{ nome: 'Noir', hex: '#181818' }]
  const coresSofiaNude = [
    { nome: 'Nude', hex: '#c4a882' },
    { nome: 'Branco', hex: '#f5f5f0' },
  ]
  const coresEbeneClassic = [
    { nome: 'Noir', hex: '#181818' },
    { nome: 'Camel', hex: '#c19a6b' },
  ]
  const coresSiennaBronze = [
    { nome: 'Bronze', hex: '#cd7f32' },
    { nome: 'Ouro', hex: '#f7c480' },
  ]
  const coresIvoryPearl = [
    { nome: 'Creme', hex: '#eadeca' },
    { nome: 'Rose', hex: '#e8b4b8' },
  ]
  const coresOnyxMule = [{ nome: 'Noir', hex: '#181818' }]
  const coresVelvetTaupe = [
    { nome: 'Taupe', hex: '#8b7355' },
    { nome: 'Camel', hex: '#c19a6b' },
  ]
  const coresNoirAbsolu = [
    { nome: 'Noir', hex: '#181818' },
    { nome: 'Or', hex: '#f7c480' },
  ]
  const coresSaharaDreams = [
    { nome: 'Sahara', hex: '#c2956c' },
    { nome: 'Creme', hex: '#eadeca' },
  ]
  const coresLumiereDOr = [{ nome: 'Dourado', hex: '#d4af37' }]

  const tamanhos3541 = [35, 36, 37, 38, 39, 40, 41]
  const tamanhos3641 = [36, 37, 38, 39, 40, 41]
  const tamanhos3640 = [36, 37, 38, 39, 40]

  const nomeLunaNoir = 'Luna Noir'
  const nomeAuroraGold = 'Aurora Gold'
  const nomeEclatNoir = 'Éclat Noir'
  const nomeSofiaNude = 'Sofia Nude'
  const nomeEbeneClassic = 'Ébène Classic'
  const nomeSiennaBronze = 'Sienna Bronze'
  const nomeIvoryPearl = 'Ivory Pearl'
  const nomeOnyxMule = 'Onyx Mule'
  const nomeVelvetTaupe = 'Velvet Taupe'
  const nomeNoirAbsolu = 'Noir Absolu'
  const nomeSaharaDreams = 'Sahara Dreams'
  const nomeLumiereDOr = "Lumière d'Or"

  const produtos: Prisma.ProdutoCreateInput[] = [
    {
      nome: nomeLunaNoir,
      slug: gerarSlug(nomeLunaNoir),
      descricao: 'Salto elegante em acabamento noir, perfeito para ocasiões especiais.',
      preco: 185,
      categoria: Categoria.SALTOS,
      imagens: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80'],
      tamanhos: tamanhos3541,
      cores: coresLunaNoir,
      stock: gerarStock(tamanhos3541, coresLunaNoir),
      destaque: true,
    },
    {
      nome: nomeAuroraGold,
      slug: gerarSlug(nomeAuroraGold),
      descricao: 'Salto dourado com brilho suave, ideal para noites inesquecíveis.',
      preco: 220,
      precoAntes: 265,
      categoria: Categoria.SALTOS,
      imagens: ['https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80'],
      tamanhos: tamanhos3541,
      cores: coresAuroraGold,
      stock: gerarStock(tamanhos3541, coresAuroraGold),
    },
    {
      nome: nomeEclatNoir,
      slug: gerarSlug(nomeEclatNoir),
      descricao: 'Salto minimalista com acabamento polido, elegância sem esforço.',
      preco: 195,
      categoria: Categoria.SALTOS,
      imagens: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80'],
      tamanhos: tamanhos3640,
      cores: coresEclatNoir,
      stock: gerarStock(tamanhos3640, coresEclatNoir),
      emBreve: true,
    },
    {
      nome: nomeSofiaNude,
      slug: gerarSlug(nomeSofiaNude),
      descricao: 'Sandália nude que alonga a silhueta com suavidade e feminilidade.',
      preco: 145,
      categoria: Categoria.SANDALIAS,
      imagens: ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80'],
      tamanhos: tamanhos3541,
      cores: coresSofiaNude,
      stock: gerarStock(tamanhos3541, coresSofiaNude),
      destaque: true,
    },
    {
      nome: nomeEbeneClassic,
      slug: gerarSlug(nomeEbeneClassic),
      descricao: 'Sandália clássica em tons escuros, versátil para o dia a dia.',
      preco: 125,
      categoria: Categoria.SANDALIAS,
      imagens: ['https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80'],
      tamanhos: tamanhos3541,
      cores: coresEbeneClassic,
      stock: gerarStock(tamanhos3541, coresEbeneClassic),
    },
    {
      nome: nomeSiennaBronze,
      slug: gerarSlug(nomeSiennaBronze),
      descricao: 'Sandália bronze com detalhes dourados, luxo ao alcance dos pés.',
      preco: 165,
      precoAntes: 195,
      categoria: Categoria.SANDALIAS,
      imagens: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80'],
      tamanhos: tamanhos3641,
      cores: coresSiennaBronze,
      stock: gerarStock(tamanhos3641, coresSiennaBronze),
      destaque: true,
    },
    {
      nome: nomeIvoryPearl,
      slug: gerarSlug(nomeIvoryPearl),
      descricao: 'Mule em creme pérola com acabamento acetinado, conforto e estilo.',
      preco: 135,
      categoria: Categoria.MULES,
      imagens: ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80'],
      tamanhos: tamanhos3541,
      cores: coresIvoryPearl,
      stock: gerarStock(tamanhos3541, coresIvoryPearl),
      destaque: true,
    },
    {
      nome: nomeOnyxMule,
      slug: gerarSlug(nomeOnyxMule),
      descricao: 'Mule noir de linha depurada, presença discreta e sofisticada.',
      preco: 155,
      categoria: Categoria.MULES,
      imagens: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80'],
      tamanhos: tamanhos3541,
      cores: coresOnyxMule,
      stock: gerarStock(tamanhos3541, coresOnyxMule),
    },
    {
      nome: nomeVelvetTaupe,
      slug: gerarSlug(nomeVelvetTaupe),
      descricao: 'Mule em veludo taupe, textura única para um look outonal.',
      preco: 145,
      categoria: Categoria.MULES,
      imagens: ['https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80'],
      tamanhos: tamanhos3640,
      cores: coresVelvetTaupe,
      stock: gerarStock(tamanhos3640, coresVelvetTaupe),
      emBreve: true,
    },
    {
      nome: nomeNoirAbsolu,
      slug: gerarSlug(nomeNoirAbsolu),
      descricao: 'Peça exclusiva da coleção Noite Africana, noir absoluto com detalhes dourados.',
      preco: 245,
      categoria: Categoria.COLECAO_LIMITADA,
      colecao: 'Noite Africana',
      imagens: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80'],
      tamanhos: tamanhos3640,
      cores: coresNoirAbsolu,
      stock: gerarStock(tamanhos3640, coresNoirAbsolu),
      destaque: true,
    },
    {
      nome: nomeSaharaDreams,
      slug: gerarSlug(nomeSaharaDreams),
      descricao: 'Inspirada nas areias do Sahara, tons quentes e texturas naturais.',
      preco: 225,
      categoria: Categoria.COLECAO_LIMITADA,
      colecao: 'Noite Africana',
      imagens: ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80'],
      tamanhos: tamanhos3641,
      cores: coresSaharaDreams,
      stock: gerarStock(tamanhos3641, coresSaharaDreams),
    },
    {
      nome: nomeLumiereDOr,
      slug: gerarSlug(nomeLumiereDOr),
      descricao: 'Brilho dourado da Noite Africana, peça de edição ultra-limitada.',
      preco: 235,
      precoAntes: 280,
      categoria: Categoria.COLECAO_LIMITADA,
      colecao: 'Noite Africana',
      imagens: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80'],
      tamanhos: tamanhos3640,
      cores: coresLumiereDOr,
      stock: gerarStock(tamanhos3640, coresLumiereDOr),
      emBreve: true,
    },
  ]

  const produtosCriados = await Promise.all(
    produtos.map((p) => prisma.produto.create({ data: p }))
  )

  const clientes: Prisma.ClienteCreateInput[] = [
    {
      nome: 'Ana Ferreira',
      email: 'ana.ferreira@email.com',
      telefone: '+351 912 345 678',
      morada: {
        rua: 'Rua Augusta 45',
        codigoPostal: '1100-048',
        cidade: 'Lisboa',
        pais: 'Portugal',
      },
    },
    {
      nome: 'Sofia Mendes',
      email: 'sofia.mendes@gmail.com',
    },
    {
      nome: 'Lara Costa',
      email: 'lara.costa@hotmail.com',
      telefone: '+351 934 567 890',
    },
    {
      nome: 'Beatriz Santos',
      email: 'beatriz.santos@email.pt',
    },
    {
      nome: 'Clara Oliveira',
      email: 'clara.oliveira@gmail.com',
      morada: {
        rua: 'Rua Garrett 12',
        codigoPostal: '1200-203',
        cidade: 'Lisboa',
        pais: 'Portugal',
      },
    },
  ]

  const clientesCriados = await Promise.all(
    clientes.map((c) => prisma.cliente.create({ data: c }))
  )

  const [anaFerreira, sofiaMendes, laraCosta] = clientesCriados

  const lunaNoir = produtosCriados.find((p) => p.slug === gerarSlug(nomeLunaNoir))!
  const sofiaNude = produtosCriados.find((p) => p.slug === gerarSlug(nomeSofiaNude))!
  const auroraGold = produtosCriados.find((p) => p.slug === gerarSlug(nomeAuroraGold))!
  const noirAbsolu = produtosCriados.find((p) => p.slug === gerarSlug(nomeNoirAbsolu))!

  const IBAN_DESTINO = 'PT50 0023 0000 1234 5678 9015 4'
  const moradaAna = {
    rua: 'Rua Augusta 45',
    codigoPostal: '1100-048',
    cidade: 'Lisboa',
    pais: 'Portugal',
  }

  const subtotal1 = lunaNoir.preco * 1 + sofiaNude.preco * 1
  const total1 = subtotal1

  await prisma.encomenda.create({
    data: {
      referencia: 'KK-2024-0001',
      clienteId: anaFerreira.id,
      subtotal: subtotal1,
      portes: 0,
      total: total1,
      moradaEnvio: moradaAna,
      estado: EstadoEncomenda.ENTREGUE,
      itens: {
        create: [
          {
            produtoId: lunaNoir.id,
            tamanho: 38,
            cor: 'Noir',
            quantidade: 1,
            precoUnit: lunaNoir.preco,
          },
          {
            produtoId: sofiaNude.id,
            tamanho: 37,
            cor: 'Nude',
            quantidade: 1,
            precoUnit: sofiaNude.preco,
          },
        ],
      },
      pagamento: {
        create: {
          valor: total1,
          ibanDestinatario: IBAN_DESTINO,
          referencia: 'KK-2024-0001',
          estado: EstadoPagamento.CONFIRMADO_ADMIN,
          validacaoAdmin: true,
        },
      },
    },
  })

  const subtotal2 = auroraGold.preco * 1
  const total2 = subtotal2

  await prisma.encomenda.create({
    data: {
      referencia: 'KK-2024-0002',
      clienteId: sofiaMendes.id,
      subtotal: subtotal2,
      portes: 0,
      total: total2,
      moradaEnvio: { rua: '', codigoPostal: '', cidade: '', pais: 'Portugal' },
      estado: EstadoEncomenda.PAGAMENTO_ANALISE,
      itens: {
        create: [
          {
            produtoId: auroraGold.id,
            tamanho: 39,
            cor: 'Gold',
            quantidade: 1,
            precoUnit: auroraGold.preco,
          },
        ],
      },
      pagamento: {
        create: {
          valor: total2,
          ibanDestinatario: IBAN_DESTINO,
          referencia: 'KK-2024-0002',
          comprovante: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
          estado: EstadoPagamento.COMPROVANTE_SUBMETIDO,
        },
      },
    },
  })

  const subtotal3 = noirAbsolu.preco * 1
  const total3 = subtotal3

  await prisma.encomenda.create({
    data: {
      referencia: 'KK-2024-0003',
      clienteId: laraCosta.id,
      subtotal: subtotal3,
      portes: 0,
      total: total3,
      moradaEnvio: { rua: '', codigoPostal: '', cidade: '', pais: 'Portugal' },
      estado: EstadoEncomenda.PENDENTE,
      itens: {
        create: [
          {
            produtoId: noirAbsolu.id,
            tamanho: 37,
            cor: 'Noir',
            quantidade: 1,
            precoUnit: noirAbsolu.preco,
          },
        ],
      },
      pagamento: {
        create: {
          valor: total3,
          ibanDestinatario: IBAN_DESTINO,
          referencia: 'KK-2024-0003',
          estado: EstadoPagamento.AGUARDA_COMPROVANTE,
        },
      },
    },
  })

  console.log('Seed concluído')
}

main().catch(console.error).finally(() => prisma.$disconnect())
