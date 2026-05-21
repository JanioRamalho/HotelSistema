import { Hotel } from './types'

export const hotels: Hotel[] = [
  {
    id: '1',
    name: 'Grand Hotel Copacabana',
    slug: 'grand-hotel-copacabana',
    description: 'Localizado na icônica orla de Copacabana, o Grand Hotel oferece uma experiência única de luxo e sofisticação. Com vista panorâmica para o mar e a apenas passos da praia mais famosa do Brasil, nosso hotel combina elegância atemporal com conforto moderno. Desfrute de nossos restaurantes premiados, spa de classe mundial e serviço impecável.',
    shortDescription: 'Luxo à beira-mar na praia mais famosa do Brasil',
    address: 'Av. Atlântica, 1702',
    city: 'Rio de Janeiro',
    state: 'RJ',
    country: 'Brasil',
    zipCode: '22021-001',
    latitude: -22.9714,
    longitude: -43.1822,
    stars: 5,
    rating: 4.8,
    reviewCount: 1247,
    priceFrom: 890,
    images: [
      { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt: 'Fachada do hotel', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', alt: 'Quarto luxo com vista mar', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', alt: 'Piscina infinita', category: 'pool' },
      { url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800', alt: 'Restaurante gourmet', category: 'restaurant' },
    ],
    amenities: ['wifi', 'pool', 'gym', 'spa', 'sauna', 'massage', 'restaurant', 'bar', 'room-service', 'parking', 'air-conditioning', 'breakfast', 'beach-access', 'concierge', 'laundry', 'business-center'],
    rooms: [
      {
        id: '1-1',
        name: 'Quarto Standard',
        description: 'Confortável quarto com vista para a cidade',
        category: 'economic',
        price: 890,
        capacity: 2,
        size: 28,
        amenities: ['wifi', 'air-conditioning', 'room-service'],
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'],
        available: true
      },
      {
        id: '1-2',
        name: 'Quarto Superior Vista Mar',
        description: 'Amplo quarto com varanda e vista para o mar',
        category: 'standard',
        price: 1290,
        capacity: 2,
        size: 35,
        amenities: ['wifi', 'air-conditioning', 'room-service', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'],
        available: true
      },
      {
        id: '1-3',
        name: 'Suíte Presidencial',
        description: 'Suíte luxuosa com sala de estar e vista panorâmica',
        category: 'luxury',
        price: 2890,
        capacity: 4,
        size: 85,
        amenities: ['wifi', 'air-conditioning', 'room-service', 'breakfast', 'spa', 'concierge'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r1',
        userId: 'u1',
        userName: 'Maria Silva',
        rating: 5,
        comment: 'Experiência incrível! O staff é extremamente atencioso e a vista do quarto é de tirar o fôlego.',
        date: '2024-01-15',
        stayDate: '2024-01-10'
      },
      {
        id: 'r2',
        userId: 'u2',
        userName: 'João Santos',
        rating: 4,
        comment: 'Ótima localização e café da manhã maravilhoso. Recomendo!',
        date: '2024-01-20',
        stayDate: '2024-01-18'
      }
    ],
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Cancelamento gratuito até 48h antes do check-in',
      pets: 'Não aceitamos pets',
      children: 'Crianças até 6 anos não pagam'
    },
    contact: {
      phone: '(21) 3222-1234',
      email: 'reservas@grandcopacabana.com.br',
      website: 'www.grandcopacabana.com.br'
    }
  },
  {
    id: '2',
    name: 'Pousada Vila do Mar',
    slug: 'pousada-vila-do-mar',
    description: 'Uma charmosa pousada familiar em Búzios, perfeita para quem busca tranquilidade e contato com a natureza. Localizada a poucos minutos das praias mais bonitas da região, oferecemos um ambiente acolhedor com café da manhã colonial e quartos decorados com carinho.',
    shortDescription: 'Charme e aconchego no paraíso de Búzios',
    address: 'Rua das Pedras, 450',
    city: 'Búzios',
    state: 'RJ',
    country: 'Brasil',
    zipCode: '28950-000',
    latitude: -22.7496,
    longitude: -41.8817,
    stars: 3,
    rating: 4.6,
    reviewCount: 523,
    priceFrom: 320,
    images: [
      { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', alt: 'Pousada vista externa', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800', alt: 'Quarto aconchegante', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800', alt: 'Área comum', category: 'common' },
    ],
    amenities: ['wifi', 'pool', 'parking', 'air-conditioning', 'breakfast', 'pet-friendly', 'beach-access'],
    rooms: [
      {
        id: '2-1',
        name: 'Quarto Aconchego',
        description: 'Quarto simples e confortável com decoração rústica',
        category: 'economic',
        price: 320,
        capacity: 2,
        size: 20,
        amenities: ['wifi', 'air-conditioning'],
        images: ['https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800'],
        available: true
      },
      {
        id: '2-2',
        name: 'Suíte Charme',
        description: 'Suíte com varanda e rede, perfeita para relaxar',
        category: 'standard',
        price: 480,
        capacity: 2,
        size: 30,
        amenities: ['wifi', 'air-conditioning', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r3',
        userId: 'u3',
        userName: 'Ana Oliveira',
        rating: 5,
        comment: 'Lugar encantador! A dona é muito simpática e o café da manhã é delicioso.',
        date: '2024-02-01',
        stayDate: '2024-01-28'
      }
    ],
    policies: {
      checkIn: '14:00',
      checkOut: '11:00',
      cancellation: 'Cancelamento gratuito até 72h antes do check-in',
      pets: 'Aceitamos pets de pequeno porte',
      children: 'Crianças de todas as idades são bem-vindas'
    },
    contact: {
      phone: '(22) 2623-4567',
      email: 'contato@viladomar.com.br'
    }
  },
  {
    id: '3',
    name: 'Resort Praia do Forte',
    slug: 'resort-praia-do-forte',
    description: 'Um dos resorts mais exclusivos do Nordeste brasileiro, localizado em uma das praias mais preservadas da Bahia. Oferecemos uma experiência all-inclusive com gastronomia premiada, spa completo, e atividades para toda a família. Perfeito para casais em lua de mel ou famílias em busca de diversão.',
    shortDescription: 'Resort all-inclusive no paraíso baiano',
    address: 'Alameda do Sol, s/n',
    city: 'Mata de São João',
    state: 'BA',
    country: 'Brasil',
    zipCode: '48280-000',
    latitude: -12.5761,
    longitude: -38.0019,
    stars: 5,
    rating: 4.9,
    reviewCount: 2156,
    priceFrom: 1650,
    images: [
      { url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', alt: 'Vista aérea do resort', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800', alt: 'Suíte master', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=800', alt: 'Piscina resort', category: 'pool' },
      { url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800', alt: 'Spa relaxante', category: 'amenity' },
    ],
    amenities: ['wifi', 'pool', 'gym', 'spa', 'sauna', 'massage', 'restaurant', 'bar', 'room-service', 'parking', 'air-conditioning', 'breakfast', 'beach-access', 'kids-club', 'concierge', 'laundry'],
    rooms: [
      {
        id: '3-1',
        name: 'Apartamento Garden',
        description: 'Apartamento térreo com acesso direto ao jardim',
        category: 'standard',
        price: 1650,
        capacity: 3,
        size: 40,
        amenities: ['wifi', 'air-conditioning', 'room-service', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1598928506311-c55ez3ce5bba?w=800'],
        available: true
      },
      {
        id: '3-2',
        name: 'Suíte Ocean View',
        description: 'Suíte com vista panorâmica para o oceano',
        category: 'luxury',
        price: 2450,
        capacity: 2,
        size: 55,
        amenities: ['wifi', 'air-conditioning', 'room-service', 'breakfast', 'spa'],
        images: ['https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800'],
        available: true
      },
      {
        id: '3-3',
        name: 'Villa Privativa',
        description: 'Villa exclusiva com piscina privada e mordomo',
        category: 'luxury',
        price: 4500,
        capacity: 6,
        size: 150,
        amenities: ['wifi', 'air-conditioning', 'room-service', 'breakfast', 'spa', 'pool', 'concierge'],
        images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r4',
        userId: 'u4',
        userName: 'Carlos Mendes',
        rating: 5,
        comment: 'Resort dos sonhos! Passamos nossa lua de mel aqui e foi perfeito.',
        date: '2024-02-10',
        stayDate: '2024-02-05'
      },
      {
        id: 'r5',
        userId: 'u5',
        userName: 'Fernanda Lima',
        rating: 5,
        comment: 'As crianças adoraram o kids club e nós aproveitamos o spa. Voltaremos!',
        date: '2024-02-15',
        stayDate: '2024-02-12'
      }
    ],
    policies: {
      checkIn: '15:00',
      checkOut: '12:00',
      cancellation: 'Cancelamento gratuito até 7 dias antes do check-in',
      pets: 'Não aceitamos pets',
      children: 'Crianças até 12 anos não pagam (limite de 2 por quarto)'
    },
    contact: {
      phone: '(71) 3676-8900',
      email: 'reservas@resortpraiadoforte.com.br',
      website: 'www.resortpraiadoforte.com.br'
    }
  },
  {
    id: '4',
    name: 'Hotel Urbano São Paulo',
    slug: 'hotel-urbano-sao-paulo',
    description: 'Moderno hotel executivo no coração da Avenida Paulista. Ideal para viajantes de negócios, oferecemos quartos funcionais, centro de convenções, e fácil acesso aos principais pontos da cidade. Wi-Fi de alta velocidade, business center 24h e academia completa.',
    shortDescription: 'Modernidade e praticidade na Paulista',
    address: 'Av. Paulista, 1230',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    zipCode: '01310-100',
    latitude: -23.5629,
    longitude: -46.6544,
    stars: 4,
    rating: 4.4,
    reviewCount: 892,
    priceFrom: 450,
    images: [
      { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', alt: 'Fachada moderna', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', alt: 'Quarto executivo', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', alt: 'Academia', category: 'amenity' },
    ],
    amenities: ['wifi', 'gym', 'restaurant', 'bar', 'room-service', 'parking', 'air-conditioning', 'breakfast', 'concierge', 'laundry', 'business-center'],
    rooms: [
      {
        id: '4-1',
        name: 'Standard Business',
        description: 'Quarto funcional para o viajante executivo',
        category: 'economic',
        price: 450,
        capacity: 2,
        size: 22,
        amenities: ['wifi', 'air-conditioning'],
        images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'],
        available: true
      },
      {
        id: '4-2',
        name: 'Executive Suite',
        description: 'Suíte com área de trabalho ampla',
        category: 'standard',
        price: 680,
        capacity: 2,
        size: 35,
        amenities: ['wifi', 'air-conditioning', 'room-service', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r6',
        userId: 'u6',
        userName: 'Roberto Alves',
        rating: 4,
        comment: 'Excelente para negócios. Localização perfeita e wifi rápido.',
        date: '2024-01-25',
        stayDate: '2024-01-22'
      }
    ],
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Cancelamento gratuito até 24h antes do check-in',
      pets: 'Não aceitamos pets',
      children: 'Crianças até 10 anos não pagam'
    },
    contact: {
      phone: '(11) 3123-4567',
      email: 'reservas@hotelurbanosp.com.br'
    }
  },
  {
    id: '5',
    name: 'Pousada Serra Gaúcha',
    slug: 'pousada-serra-gaucha',
    description: 'Encantadora pousada em Gramado, com arquitetura europeia e lareira em todos os quartos. Perfeita para casais em busca de romance e famílias que querem curtir o frio da serra. Café colonial farto e chocolate quente à vontade.',
    shortDescription: 'Romance e aconchego nas montanhas gaúchas',
    address: 'Rua das Hortênsias, 890',
    city: 'Gramado',
    state: 'RS',
    country: 'Brasil',
    zipCode: '95670-000',
    latitude: -29.3783,
    longitude: -50.8736,
    stars: 4,
    rating: 4.7,
    reviewCount: 678,
    priceFrom: 520,
    images: [
      { url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800', alt: 'Chalé na serra', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', alt: 'Quarto com lareira', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', alt: 'Café colonial', category: 'restaurant' },
    ],
    amenities: ['wifi', 'spa', 'sauna', 'restaurant', 'bar', 'room-service', 'parking', 'breakfast', 'pet-friendly'],
    rooms: [
      {
        id: '5-1',
        name: 'Chalé Romântico',
        description: 'Chalé aconchegante com lareira e banheira',
        category: 'standard',
        price: 520,
        capacity: 2,
        size: 30,
        amenities: ['wifi', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
        available: true
      },
      {
        id: '5-2',
        name: 'Suíte Família',
        description: 'Ampla suíte para até 5 pessoas',
        category: 'standard',
        price: 780,
        capacity: 5,
        size: 45,
        amenities: ['wifi', 'breakfast', 'room-service'],
        images: ['https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800'],
        available: true
      },
      {
        id: '5-3',
        name: 'Chalé Master com Hidro',
        description: 'O chalé mais luxuoso com hidromassagem privativa',
        category: 'luxury',
        price: 1200,
        capacity: 2,
        size: 50,
        amenities: ['wifi', 'breakfast', 'room-service', 'spa'],
        images: ['https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r7',
        userId: 'u7',
        userName: 'Patrícia Souza',
        rating: 5,
        comment: 'Lugar mágico! O café colonial é imperdível e a lareira deixa tudo mais romântico.',
        date: '2024-02-20',
        stayDate: '2024-02-17'
      }
    ],
    policies: {
      checkIn: '15:00',
      checkOut: '11:00',
      cancellation: 'Cancelamento gratuito até 72h antes do check-in',
      pets: 'Aceitamos pets de pequeno porte com taxa adicional',
      children: 'Crianças até 5 anos não pagam'
    },
    contact: {
      phone: '(54) 3286-1234',
      email: 'reservas@serragaucha.com.br'
    }
  },
  {
    id: '6',
    name: 'Beach Resort Fortaleza',
    slug: 'beach-resort-fortaleza',
    description: 'Resort pé na areia em Fortaleza, com a melhor infraestrutura para suas férias. Piscinas, toboáguas, restaurantes variados e programação de lazer durante todo o dia. Sol o ano inteiro e a hospitalidade cearense.',
    shortDescription: 'Sol, diversão e praia em Fortaleza',
    address: 'Av. Beira Mar, 3500',
    city: 'Fortaleza',
    state: 'CE',
    country: 'Brasil',
    zipCode: '60165-121',
    latitude: -3.7256,
    longitude: -38.4927,
    stars: 4,
    rating: 4.5,
    reviewCount: 1432,
    priceFrom: 680,
    images: [
      { url: 'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=800', alt: 'Resort beira mar', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800', alt: 'Quarto família', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=800', alt: 'Parque aquático', category: 'pool' },
    ],
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'bar', 'room-service', 'parking', 'air-conditioning', 'breakfast', 'beach-access', 'kids-club'],
    rooms: [
      {
        id: '6-1',
        name: 'Quarto Standard',
        description: 'Quarto confortável com ar condicionado',
        category: 'economic',
        price: 680,
        capacity: 3,
        size: 25,
        amenities: ['wifi', 'air-conditioning', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800'],
        available: true
      },
      {
        id: '6-2',
        name: 'Suíte Família Plus',
        description: 'Suíte ampla para famílias com vista mar',
        category: 'standard',
        price: 980,
        capacity: 5,
        size: 45,
        amenities: ['wifi', 'air-conditioning', 'breakfast', 'room-service'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r8',
        userId: 'u8',
        userName: 'Marcos Ribeiro',
        rating: 4,
        comment: 'Ótimo para família! As crianças se divertiram muito nos toboáguas.',
        date: '2024-01-30',
        stayDate: '2024-01-25'
      }
    ],
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Cancelamento gratuito até 5 dias antes do check-in',
      pets: 'Não aceitamos pets',
      children: 'Crianças até 10 anos não pagam (limite de 2 por quarto)'
    },
    contact: {
      phone: '(85) 3242-5678',
      email: 'reservas@beachresortfortaleza.com.br'
    }
  },
  {
    id: '7',
    name: 'Hotel Histórico Salvador',
    slug: 'hotel-historico-salvador',
    description: 'Hospede-se em um casarão do século XVIII restaurado no coração do Pelourinho. Cada quarto conta uma história diferente, com móveis de época e conforto moderno. Experimente a verdadeira essência da Bahia.',
    shortDescription: 'História e cultura no Pelourinho',
    address: 'Largo do Pelourinho, 15',
    city: 'Salvador',
    state: 'BA',
    country: 'Brasil',
    zipCode: '40026-280',
    latitude: -12.9714,
    longitude: -38.5097,
    stars: 4,
    rating: 4.6,
    reviewCount: 567,
    priceFrom: 390,
    images: [
      { url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', alt: 'Casarão histórico', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', alt: 'Quarto colonial', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800', alt: 'Restaurante', category: 'restaurant' },
    ],
    amenities: ['wifi', 'restaurant', 'bar', 'room-service', 'air-conditioning', 'breakfast', 'concierge', 'laundry'],
    rooms: [
      {
        id: '7-1',
        name: 'Quarto Colonial',
        description: 'Quarto com móveis de época restaurados',
        category: 'economic',
        price: 390,
        capacity: 2,
        size: 22,
        amenities: ['wifi', 'air-conditioning', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'],
        available: true
      },
      {
        id: '7-2',
        name: 'Suíte Imperial',
        description: 'Suíte luxuosa com varanda para o largo',
        category: 'luxury',
        price: 720,
        capacity: 2,
        size: 40,
        amenities: ['wifi', 'air-conditioning', 'breakfast', 'room-service', 'concierge'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r9',
        userId: 'u9',
        userName: 'Luciana Costa',
        rating: 5,
        comment: 'Uma viagem no tempo! O hotel é lindo e a localização é perfeita.',
        date: '2024-02-05',
        stayDate: '2024-02-01'
      }
    ],
    policies: {
      checkIn: '14:00',
      checkOut: '11:00',
      cancellation: 'Cancelamento gratuito até 48h antes do check-in',
      pets: 'Não aceitamos pets',
      children: 'Crianças até 7 anos não pagam'
    },
    contact: {
      phone: '(71) 3321-7890',
      email: 'reservas@historicosalvador.com.br'
    }
  },
  {
    id: '8',
    name: 'Eco Lodge Amazônia',
    slug: 'eco-lodge-amazonia',
    description: 'Uma experiência única de imersão na floresta amazônica. Lodge sustentável com chalés sobre palafitas, passeios de canoa, observação de fauna e flora, e culinária regional. Desconecte-se e reconecte-se com a natureza.',
    shortDescription: 'Aventura sustentável na floresta',
    address: 'Igarapé do Tarumã, km 15',
    city: 'Manaus',
    state: 'AM',
    country: 'Brasil',
    zipCode: '69067-000',
    latitude: -3.0219,
    longitude: -60.0217,
    stars: 4,
    rating: 4.8,
    reviewCount: 312,
    priceFrom: 890,
    images: [
      { url: 'https://images.unsplash.com/photo-1596178060810-72660ee8d98e?w=800', alt: 'Lodge na floresta', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', alt: 'Chalé rústico', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=800', alt: 'Floresta amazônica', category: 'common' },
    ],
    amenities: ['wifi', 'restaurant', 'bar', 'breakfast', 'pet-friendly'],
    rooms: [
      {
        id: '8-1',
        name: 'Chalé Floresta',
        description: 'Chalé sobre palafitas com vista para a mata',
        category: 'standard',
        price: 890,
        capacity: 2,
        size: 25,
        amenities: ['wifi', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800'],
        available: true
      },
      {
        id: '8-2',
        name: 'Suíte Vitória-Régia',
        description: 'Suíte premium com deck privativo sobre o rio',
        category: 'luxury',
        price: 1450,
        capacity: 2,
        size: 40,
        amenities: ['wifi', 'breakfast', 'room-service'],
        images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r10',
        userId: 'u10',
        userName: 'Pedro Martins',
        rating: 5,
        comment: 'Experiência transformadora! Ver o nascer do sol na floresta não tem preço.',
        date: '2024-02-18',
        stayDate: '2024-02-14'
      }
    ],
    policies: {
      checkIn: '12:00',
      checkOut: '10:00',
      cancellation: 'Cancelamento gratuito até 14 dias antes do check-in',
      pets: 'Aceitamos pets mediante consulta prévia',
      children: 'Crianças a partir de 6 anos'
    },
    contact: {
      phone: '(92) 3234-5678',
      email: 'reservas@ecolodgeamazonia.com.br'
    }
  },
  {
    id: '9',
    name: 'Hotel Beira Rio Recife',
    slug: 'hotel-beira-rio-recife',
    description: 'Hotel moderno às margens do Rio Capibaribe, no bairro do Recife Antigo. Arquitetura contemporânea com vista para a cidade, próximo aos principais pontos turísticos e culturais. Ideal para turismo e negócios.',
    shortDescription: 'Modernidade no coração do Recife Antigo',
    address: 'Cais do Apolo, 222',
    city: 'Recife',
    state: 'PE',
    country: 'Brasil',
    zipCode: '50030-230',
    latitude: -8.0631,
    longitude: -34.8711,
    stars: 4,
    rating: 4.4,
    reviewCount: 445,
    priceFrom: 380,
    images: [
      { url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800', alt: 'Hotel moderno', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', alt: 'Quarto confortável', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', alt: 'Piscina rooftop', category: 'pool' },
    ],
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'bar', 'room-service', 'parking', 'air-conditioning', 'breakfast', 'business-center'],
    rooms: [
      {
        id: '9-1',
        name: 'Quarto Cidade',
        description: 'Quarto com vista para a cidade',
        category: 'economic',
        price: 380,
        capacity: 2,
        size: 24,
        amenities: ['wifi', 'air-conditioning', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'],
        available: true
      },
      {
        id: '9-2',
        name: 'Suíte Rio View',
        description: 'Suíte com vista panorâmica para o rio',
        category: 'standard',
        price: 580,
        capacity: 2,
        size: 35,
        amenities: ['wifi', 'air-conditioning', 'breakfast', 'room-service'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r11',
        userId: 'u11',
        userName: 'Juliana Freitas',
        rating: 4,
        comment: 'Localização excelente e equipe muito prestativa. Adorei!',
        date: '2024-02-12',
        stayDate: '2024-02-08'
      }
    ],
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Cancelamento gratuito até 48h antes do check-in',
      pets: 'Não aceitamos pets',
      children: 'Crianças até 8 anos não pagam'
    },
    contact: {
      phone: '(81) 3424-5678',
      email: 'reservas@beirariorecife.com.br'
    }
  },
  {
    id: '10',
    name: 'Pousada Dunas Natal',
    slug: 'pousada-dunas-natal',
    description: 'Aconchegante pousada em Ponta Negra, a poucos passos do Morro do Careca. Ambiente familiar, quartos confortáveis e o melhor custo-benefício da cidade. Passeios de buggy saem direto da pousada.',
    shortDescription: 'Economia e conforto em Ponta Negra',
    address: 'Rua Erivan França, 120',
    city: 'Natal',
    state: 'RN',
    country: 'Brasil',
    zipCode: '59090-100',
    latitude: -5.8769,
    longitude: -35.1736,
    stars: 3,
    rating: 4.3,
    reviewCount: 289,
    priceFrom: 220,
    images: [
      { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt: 'Pousada externa', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800', alt: 'Quarto simples', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', alt: 'Praia próxima', category: 'common' },
    ],
    amenities: ['wifi', 'pool', 'parking', 'air-conditioning', 'breakfast', 'pet-friendly', 'beach-access'],
    rooms: [
      {
        id: '10-1',
        name: 'Quarto Econômico',
        description: 'Quarto simples e funcional',
        category: 'economic',
        price: 220,
        capacity: 2,
        size: 18,
        amenities: ['wifi', 'air-conditioning'],
        images: ['https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800'],
        available: true
      },
      {
        id: '10-2',
        name: 'Quarto Conforto',
        description: 'Quarto maior com varanda',
        category: 'standard',
        price: 320,
        capacity: 3,
        size: 25,
        amenities: ['wifi', 'air-conditioning', 'breakfast'],
        images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r12',
        userId: 'u12',
        userName: 'Ricardo Santos',
        rating: 4,
        comment: 'Ótimo custo-benefício! A praia é pertinho e o café da manhã é bom.',
        date: '2024-02-22',
        stayDate: '2024-02-19'
      }
    ],
    policies: {
      checkIn: '13:00',
      checkOut: '11:00',
      cancellation: 'Cancelamento gratuito até 48h antes do check-in',
      pets: 'Aceitamos pets de pequeno porte',
      children: 'Crianças até 5 anos não pagam'
    },
    contact: {
      phone: '(84) 3219-4567',
      email: 'reservas@dunasnatal.com.br'
    }
  },
  {
    id: '11',
    name: 'Palace Hotel Curitiba',
    slug: 'palace-hotel-curitiba',
    description: 'Elegante hotel no centro de Curitiba, próximo ao famoso Jardim Botânico. Arquitetura clássica, serviço refinado e gastronomia de alto nível. Perfeito para quem aprecia cultura e qualidade de vida.',
    shortDescription: 'Elegância e tradição na capital paranaense',
    address: 'Rua XV de Novembro, 800',
    city: 'Curitiba',
    state: 'PR',
    country: 'Brasil',
    zipCode: '80020-310',
    latitude: -25.4284,
    longitude: -49.2733,
    stars: 5,
    rating: 4.7,
    reviewCount: 623,
    priceFrom: 650,
    images: [
      { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt: 'Fachada clássica', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', alt: 'Suíte elegante', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', alt: 'Restaurante fino', category: 'restaurant' },
    ],
    amenities: ['wifi', 'gym', 'spa', 'sauna', 'restaurant', 'bar', 'room-service', 'parking', 'air-conditioning', 'breakfast', 'concierge', 'laundry', 'business-center'],
    rooms: [
      {
        id: '11-1',
        name: 'Classic Room',
        description: 'Quarto clássico com móveis de design',
        category: 'standard',
        price: 650,
        capacity: 2,
        size: 30,
        amenities: ['wifi', 'air-conditioning', 'breakfast', 'room-service'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'],
        available: true
      },
      {
        id: '11-2',
        name: 'Suíte Palace',
        description: 'Suíte luxuosa com sala de estar',
        category: 'luxury',
        price: 1100,
        capacity: 2,
        size: 50,
        amenities: ['wifi', 'air-conditioning', 'breakfast', 'room-service', 'spa', 'concierge'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r13',
        userId: 'u13',
        userName: 'Adriana Mello',
        rating: 5,
        comment: 'Hotel impecável! O spa é maravilhoso e o restaurante surpreende.',
        date: '2024-02-25',
        stayDate: '2024-02-21'
      }
    ],
    policies: {
      checkIn: '15:00',
      checkOut: '12:00',
      cancellation: 'Cancelamento gratuito até 72h antes do check-in',
      pets: 'Não aceitamos pets',
      children: 'Crianças até 10 anos não pagam'
    },
    contact: {
      phone: '(41) 3333-4567',
      email: 'reservas@palacecuritiba.com.br',
      website: 'www.palacecuritiba.com.br'
    }
  },
  {
    id: '12',
    name: 'Pousada Costa Verde',
    slug: 'pousada-costa-verde',
    description: 'Refúgio paradisíaco em Paraty, entre o mar e a montanha. Pousada boutique com apenas 8 suítes, jardim tropical e piscina com vista. Acesso privativo a uma praia deserta. Experiência exclusiva e intimista.',
    shortDescription: 'Exclusividade no paraíso de Paraty',
    address: 'Estrada Paraty-Cunha, km 8',
    city: 'Paraty',
    state: 'RJ',
    country: 'Brasil',
    zipCode: '23970-000',
    latitude: -23.2178,
    longitude: -44.7131,
    stars: 5,
    rating: 4.9,
    reviewCount: 198,
    priceFrom: 980,
    images: [
      { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', alt: 'Pousada boutique', category: 'exterior' },
      { url: 'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800', alt: 'Suíte luxo', category: 'room' },
      { url: 'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=800', alt: 'Piscina infinita', category: 'pool' },
    ],
    amenities: ['wifi', 'pool', 'spa', 'massage', 'restaurant', 'bar', 'room-service', 'parking', 'air-conditioning', 'breakfast', 'beach-access', 'concierge', 'laundry'],
    rooms: [
      {
        id: '12-1',
        name: 'Suíte Jardim',
        description: 'Suíte com varanda para o jardim tropical',
        category: 'luxury',
        price: 980,
        capacity: 2,
        size: 40,
        amenities: ['wifi', 'air-conditioning', 'breakfast', 'room-service'],
        images: ['https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800'],
        available: true
      },
      {
        id: '12-2',
        name: 'Suíte Master Vista Mar',
        description: 'A melhor suíte com vista panorâmica para o mar',
        category: 'luxury',
        price: 1680,
        capacity: 2,
        size: 60,
        amenities: ['wifi', 'air-conditioning', 'breakfast', 'room-service', 'spa', 'massage', 'concierge'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'],
        available: true
      }
    ],
    reviews: [
      {
        id: 'r14',
        userId: 'u14',
        userName: 'Camila Rocha',
        rating: 5,
        comment: 'O lugar mais lindo que já me hospedei. A praia privativa é um sonho!',
        date: '2024-03-01',
        stayDate: '2024-02-26'
      }
    ],
    policies: {
      checkIn: '15:00',
      checkOut: '12:00',
      cancellation: 'Cancelamento gratuito até 7 dias antes do check-in',
      pets: 'Não aceitamos pets',
      children: 'Apenas adultos (18+)'
    },
    contact: {
      phone: '(24) 3371-8901',
      email: 'reservas@costaverdeparaty.com.br',
      website: 'www.costaverdeparaty.com.br'
    }
  }
]

// Função para buscar hotéis com filtros
export function searchHotels(filters: {
  city?: string
  state?: string
  guests?: number
  priceMin?: number
  priceMax?: number
  amenities?: string[]
  minRating?: number
  stars?: number[]
}): Hotel[] {
  return hotels.filter(hotel => {
    // Filtro por cidade
    if (filters.city && !hotel.city.toLowerCase().includes(filters.city.toLowerCase())) {
      return false
    }
    
    // Filtro por estado
    if (filters.state && hotel.state !== filters.state) {
      return false
    }
    
    // Filtro por capacidade (verifica se algum quarto atende)
    if (filters.guests) {
      const hasCapacity = hotel.rooms.some(room => room.capacity >= filters.guests!)
      if (!hasCapacity) return false
    }
    
    // Filtro por preço mínimo
    if (filters.priceMin && hotel.priceFrom < filters.priceMin) {
      return false
    }
    
    // Filtro por preço máximo
    if (filters.priceMax && hotel.priceFrom > filters.priceMax) {
      return false
    }
    
    // Filtro por comodidades
    if (filters.amenities && filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every(amenity => 
        hotel.amenities.includes(amenity as any)
      )
      if (!hasAllAmenities) return false
    }
    
    // Filtro por avaliação mínima
    if (filters.minRating && hotel.rating < filters.minRating) {
      return false
    }
    
    // Filtro por estrelas
    if (filters.stars && filters.stars.length > 0) {
      if (!filters.stars.includes(hotel.stars)) return false
    }
    
    return true
  })
}

// Função para buscar hotel por slug
export function getHotelBySlug(slug: string): Hotel | undefined {
  return hotels.find(hotel => hotel.slug === slug)
}

// Função para buscar hotel por ID
export function getHotelById(id: string): Hotel | undefined {
  return hotels.find(hotel => hotel.id === id)
}

// Obter cidades únicas
export function getUniqueCities(): { city: string; state: string }[] {
  const unique = new Map<string, { city: string; state: string }>()
  hotels.forEach(hotel => {
    const key = `${hotel.city}-${hotel.state}`
    if (!unique.has(key)) {
      unique.set(key, { city: hotel.city, state: hotel.state })
    }
  })
  return Array.from(unique.values())
}

// Obter estados únicos
export function getUniqueStates(): string[] {
  const states = new Set<string>()
  hotels.forEach(hotel => states.add(hotel.state))
  return Array.from(states).sort()
}
