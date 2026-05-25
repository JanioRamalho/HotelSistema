PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO comodidades (id, rotulo) VALUES
  ('wifi', 'Wi-Fi Grátis'),
  ('pool', 'Piscina'),
  ('gym', 'Academia'),
  ('spa', 'Spa'),
  ('sauna', 'Sauna'),
  ('massage', 'Massagem'),
  ('pet-friendly', 'Pet Friendly'),
  ('restaurant', 'Restaurante'),
  ('bar', 'Bar'),
  ('room-service', 'Serviço de Quarto'),
  ('parking', 'Estacionamento'),
  ('air-conditioning', 'Ar Condicionado'),
  ('breakfast', 'Café da Manhã'),
  ('beach-access', 'Acesso à Praia'),
  ('kids-club', 'Kids Club'),
  ('concierge', 'Concierge'),
  ('laundry', 'Lavanderia'),
  ('business-center', 'Centro de Negócios');

INSERT OR REPLACE INTO hoteis (
  id, nome, slug, descricao, descricao_curta, endereco, cidade, estado, pais, cep,
  latitude, longitude, estrelas, nota, quantidade_avaliacoes, preco_inicial,
  politica_check_in, politica_check_out, politica_cancelamento, politica_pets, politica_criancas,
  contato_telefone, contato_email, contato_site
) VALUES
  (
    '1', 'Grand Hotel Copacabana', 'grand-hotel-copacabana',
    'Hotel de luxo na orla de Copacabana, com vista para o mar, spa, restaurante e quartos amplos.',
    'Luxo à beira-mar em Copacabana', 'Av. Atlântica, 1702', 'Rio de Janeiro', 'RJ', 'Brasil', '22021-001',
    -22.9714, -43.1822, 5, 4.8, 1247, 890,
    '14:00', '12:00', 'Cancelamento gratuito até 48h antes do check-in', 'Não aceitamos pets', 'Crianças até 6 anos não pagam',
    '(21) 3222-1234', 'reservas@grandcopacabana.com.br', 'www.grandcopacabana.com.br'
  ),
  (
    '2', 'Pousada Vila do Mar', 'pousada-vila-do-mar',
    'Pousada familiar em Búzios, perto da praia, com café da manhã e ambiente tranquilo.',
    'Charme e aconchego em Búzios', 'Rua das Pedras, 450', 'Búzios', 'RJ', 'Brasil', '28950-000',
    -22.7496, -41.8817, 3, 4.6, 523, 320,
    '14:00', '11:00', 'Cancelamento gratuito até 72h antes do check-in', 'Aceitamos pets de pequeno porte', 'Crianças de todas as idades são bem-vindas',
    '(22) 2623-4567', 'contato@viladomar.com.br', NULL
  ),
  (
    '3', 'Resort Praia do Forte', 'resort-praia-do-forte',
    'Resort all-inclusive na Bahia com piscina, spa, restaurante e atividades para famílias.',
    'Resort all-inclusive na Bahia', 'Alameda do Sol, s/n', 'Mata de Sao Joao', 'BA', 'Brasil', '48280-000',
    -12.5761, -38.0019, 5, 4.9, 2156, 1650,
    '15:00', '12:00', 'Cancelamento gratuito até 7 dias antes do check-in', 'Não aceitamos pets', 'Crianças até 12 anos não pagam',
    '(71) 3676-8900', 'reservas@resortpraiadoforte.com.br', 'www.resortpraiadoforte.com.br'
  );

INSERT OR REPLACE INTO imagens_hotel (id, hotel_id, url, texto_alternativo, categoria, ordem) VALUES
  ('hi-1-1', '1', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'Fachada do hotel', 'exterior', 1),
  ('hi-2-1', '2', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'Pousada vista externa', 'exterior', 1),
  ('hi-3-1', '3', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 'Vista aérea do resort', 'exterior', 1);

INSERT OR REPLACE INTO quartos (id, hotel_id, nome, descricao, categoria, preco, capacidade, tamanho, disponivel) VALUES
  ('1-1', '1', 'Quarto Standard', 'Quarto com vista para a cidade', 'economic', 890, 2, 28, 1),
  ('2-1', '2', 'Quarto Aconchego', 'Quarto simples e confortável', 'economic', 320, 2, 20, 1),
  ('3-1', '3', 'Apartamento Garden', 'Apartamento térreo com acesso ao jardim', 'standard', 1650, 3, 40, 1);

INSERT OR REPLACE INTO imagens_quarto (id, quarto_id, url, texto_alternativo, ordem) VALUES
  ('ri-1-1', '1-1', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'Quarto Standard', 1),
  ('ri-2-1', '2-1', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800', 'Quarto Aconchego', 1),
  ('ri-3-1', '3-1', 'https://images.unsplash.com/photo-1598928506311-c55e085d3c76?w=800', 'Apartamento Garden', 1);

INSERT OR IGNORE INTO hoteis_comodidades (hotel_id, comodidade_id) VALUES
  ('1', 'wifi'), ('1', 'pool'), ('1', 'gym'), ('1', 'spa'), ('1', 'restaurant'), ('1', 'bar'), ('1', 'room-service'), ('1', 'parking'), ('1', 'air-conditioning'), ('1', 'breakfast'), ('1', 'beach-access'),
  ('2', 'wifi'), ('2', 'pool'), ('2', 'parking'), ('2', 'air-conditioning'), ('2', 'breakfast'), ('2', 'pet-friendly'), ('2', 'beach-access'),
  ('3', 'wifi'), ('3', 'pool'), ('3', 'gym'), ('3', 'spa'), ('3', 'restaurant'), ('3', 'bar'), ('3', 'room-service'), ('3', 'parking'), ('3', 'air-conditioning'), ('3', 'breakfast'), ('3', 'beach-access'), ('3', 'kids-club');

INSERT OR IGNORE INTO quartos_comodidades (quarto_id, comodidade_id) VALUES
  ('1-1', 'wifi'), ('1-1', 'air-conditioning'), ('1-1', 'room-service'),
  ('2-1', 'wifi'), ('2-1', 'air-conditioning'),
  ('3-1', 'wifi'), ('3-1', 'air-conditioning'), ('3-1', 'breakfast');

INSERT OR REPLACE INTO avaliacoes (id, hotel_id, usuario_id, nome_usuario, nota, comentario, data_avaliacao, data_hospedagem) VALUES
  ('r1', '1', NULL, 'Maria Silva', 5, 'Experiência incrível e atendimento muito cuidadoso.', '2024-01-15', '2024-01-10');
