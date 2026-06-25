-- Migration: Add per-booking QR check-in token to the bookings table
ALTER TABLE bookings
ADD COLUMN checkin_token VARCHAR(255) NULL;
