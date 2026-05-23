PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO amenities (id, label) VALUES
  ('wifi', 'Wi-Fi Gratis'),
  ('pool', 'Piscina'),
  ('gym', 'Academia'),
  ('spa', 'Spa'),
  ('sauna', 'Sauna'),
  ('massage', 'Massagem'),
  ('pet-friendly', 'Pet Friendly'),
  ('restaurant', 'Restaurante'),
  ('bar', 'Bar'),
  ('room-service', 'Servico de Quarto'),
  ('parking', 'Estacionamento'),
  ('air-conditioning', 'Ar Condicionado'),
  ('breakfast', 'Cafe da Manha'),
  ('beach-access', 'Acesso a Praia'),
  ('kids-club', 'Kids Club'),
  ('concierge', 'Concierge'),
  ('laundry', 'Lavanderia'),
  ('business-center', 'Centro de Negocios');

INSERT OR REPLACE INTO hotels (
  id, name, slug, description, short_description, address, city, state, country, zip_code,
  latitude, longitude, stars, rating, review_count, price_from,
  policy_check_in, policy_check_out, policy_cancellation, policy_pets, policy_children,
  contact_phone, contact_email, contact_website
) VALUES
  (
    '1', 'Grand Hotel Copacabana', 'grand-hotel-copacabana',
    'Hotel de luxo na orla de Copacabana, com vista para o mar, spa, restaurante e quartos amplos.',
    'Luxo a beira-mar em Copacabana', 'Av. Atlantica, 1702', 'Rio de Janeiro', 'RJ', 'Brasil', '22021-001',
    -22.9714, -43.1822, 5, 4.8, 1247, 890,
    '14:00', '12:00', 'Cancelamento gratuito ate 48h antes do check-in', 'Nao aceitamos pets', 'Criancas ate 6 anos nao pagam',
    '(21) 3222-1234', 'reservas@grandcopacabana.com.br', 'www.grandcopacabana.com.br'
  ),
  (
    '2', 'Pousada Vila do Mar', 'pousada-vila-do-mar',
    'Pousada familiar em Buzios, perto da praia, com cafe da manha e ambiente tranquilo.',
    'Charme e aconchego em Buzios', 'Rua das Pedras, 450', 'Buzios', 'RJ', 'Brasil', '28950-000',
    -22.7496, -41.8817, 3, 4.6, 523, 320,
    '14:00', '11:00', 'Cancelamento gratuito ate 72h antes do check-in', 'Aceitamos pets de pequeno porte', 'Criancas de todas as idades sao bem-vindas',
    '(22) 2623-4567', 'contato@viladomar.com.br', NULL
  ),
  (
    '3', 'Resort Praia do Forte', 'resort-praia-do-forte',
    'Resort all-inclusive na Bahia com piscina, spa, restaurante e atividades para familias.',
    'Resort all-inclusive na Bahia', 'Alameda do Sol, s/n', 'Mata de Sao Joao', 'BA', 'Brasil', '48280-000',
    -12.5761, -38.0019, 5, 4.9, 2156, 1650,
    '15:00', '12:00', 'Cancelamento gratuito ate 7 dias antes do check-in', 'Nao aceitamos pets', 'Criancas ate 12 anos nao pagam',
    '(71) 3676-8900', 'reservas@resortpraiadoforte.com.br', 'www.resortpraiadoforte.com.br'
  );

INSERT OR REPLACE INTO hotel_images (id, hotel_id, url, alt, category, sort_order) VALUES
  ('hi-1-1', '1', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'Fachada do hotel', 'exterior', 1),
  ('hi-2-1', '2', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'Pousada vista externa', 'exterior', 1),
  ('hi-3-1', '3', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 'Vista aerea do resort', 'exterior', 1);

INSERT OR REPLACE INTO rooms (id, hotel_id, name, description, category, price, capacity, size, available) VALUES
  ('1-1', '1', 'Quarto Standard', 'Quarto com vista para a cidade', 'economic', 890, 2, 28, 1),
  ('2-1', '2', 'Quarto Aconchego', 'Quarto simples e confortavel', 'economic', 320, 2, 20, 1),
  ('3-1', '3', 'Apartamento Garden', 'Apartamento terreo com acesso ao jardim', 'standard', 1650, 3, 40, 1);

INSERT OR REPLACE INTO room_images (id, room_id, url, alt, sort_order) VALUES
  ('ri-1-1', '1-1', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'Quarto Standard', 1),
  ('ri-2-1', '2-1', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800', 'Quarto Aconchego', 1),
  ('ri-3-1', '3-1', 'https://images.unsplash.com/photo-1598928506311-c55ez3ce5bba?w=800', 'Apartamento Garden', 1);

INSERT OR IGNORE INTO hotel_amenities (hotel_id, amenity_id) VALUES
  ('1', 'wifi'), ('1', 'pool'), ('1', 'gym'), ('1', 'spa'), ('1', 'restaurant'), ('1', 'bar'), ('1', 'room-service'), ('1', 'parking'), ('1', 'air-conditioning'), ('1', 'breakfast'), ('1', 'beach-access'),
  ('2', 'wifi'), ('2', 'pool'), ('2', 'parking'), ('2', 'air-conditioning'), ('2', 'breakfast'), ('2', 'pet-friendly'), ('2', 'beach-access'),
  ('3', 'wifi'), ('3', 'pool'), ('3', 'gym'), ('3', 'spa'), ('3', 'restaurant'), ('3', 'bar'), ('3', 'room-service'), ('3', 'parking'), ('3', 'air-conditioning'), ('3', 'breakfast'), ('3', 'beach-access'), ('3', 'kids-club');

INSERT OR IGNORE INTO room_amenities (room_id, amenity_id) VALUES
  ('1-1', 'wifi'), ('1-1', 'air-conditioning'), ('1-1', 'room-service'),
  ('2-1', 'wifi'), ('2-1', 'air-conditioning'),
  ('3-1', 'wifi'), ('3-1', 'air-conditioning'), ('3-1', 'breakfast');

INSERT OR REPLACE INTO reviews (id, hotel_id, user_id, user_name, rating, comment, date, stay_date) VALUES
  ('r1', '1', NULL, 'Maria Silva', 5, 'Experiencia incrivel e atendimento muito cuidadoso.', '2024-01-15', '2024-01-10');
