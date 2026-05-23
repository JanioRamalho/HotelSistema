PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified_at TEXT,
  avatar_url TEXT,
  google_id TEXT UNIQUE,
  password_hash TEXT,
  phone TEXT,
  document TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  zip_code TEXT NOT NULL,
  latitude REAL NOT NULL DEFAULT 0,
  longitude REAL NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  rating REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  price_from INTEGER NOT NULL DEFAULT 0,
  policy_check_in TEXT NOT NULL DEFAULT '14:00',
  policy_check_out TEXT NOT NULL DEFAULT '12:00',
  policy_cancellation TEXT NOT NULL DEFAULT '',
  policy_pets TEXT NOT NULL DEFAULT '',
  policy_children TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_website TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hotel_images (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  url TEXT NOT NULL,
  s3_key TEXT,
  alt TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exterior', 'room', 'amenity', 'restaurant', 'pool', 'common')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS amenities (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hotel_amenities (
  hotel_id TEXT NOT NULL,
  amenity_id TEXT NOT NULL,
  PRIMARY KEY (hotel_id, amenity_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('economic', 'standard', 'luxury')),
  price INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 1,
  size INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS room_images (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  url TEXT NOT NULL,
  s3_key TEXT,
  alt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS room_amenities (
  room_id TEXT NOT NULL,
  amenity_id TEXT NOT NULL,
  PRIMARY KEY (room_id, amenity_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  date TEXT NOT NULL,
  stay_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER NOT NULL,
  total_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_document TEXT NOT NULL,
  special_requests TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, hotel_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hotels_city_state ON hotels(city, state);
CREATE INDEX IF NOT EXISTS idx_hotels_price_from ON hotels(price_from);
CREATE INDEX IF NOT EXISTS idx_hotels_rating ON hotels(rating);
CREATE INDEX IF NOT EXISTS idx_hotels_stars ON hotels(stars);
CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel ON hotel_images(hotel_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_capacity ON rooms(capacity);
CREATE INDEX IF NOT EXISTS idx_room_images_room ON room_images(room_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_reviews_hotel ON reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_id, check_in, check_out);
