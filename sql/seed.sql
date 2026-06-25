-- =============================================================================
-- Smart Campus Facility Booking System — Seed Data
-- Run this in the TiDB Cloud SQL editor AFTER running schema.sql
--
-- Includes:
--   • 1 admin + 8 regular users
--   • 8 facilities (rooms, courts, equipment)
--   • 30 bookings across various statuses
--   • Favourites for several users
--   • System notifications (booking confirmations, cancellations, no-shows)
--
-- IMPORTANT: Passwords below are bcrypt hashes of "Password123!"
--            All users can log in with that password for testing.
-- =============================================================================

-- ─── Disable FK checks + clear tables (safe to re-run) ──────────────────────
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE favourites;
TRUNCATE TABLE bookings;
TRUNCATE TABLE facilities;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── Users ───────────────────────────────────────────────────────────────────
INSERT INTO users (user_id, user_name, user_email, user_password, user_role, user_created_at) VALUES
  (1,  'Dr. Siti Nur',        'siti.nur@campus.edu.my',      '$2b$10$Xz3Kq1Y8eW5mP2nH7vLdO.vQkGpJwRyTsA6UfCbDiMlN9oZeXt4Ki', 'admin', '2023-01-10 08:00:00'),
  (2,  'Lim Wei Jie',         'weijie@campus.edu.my',         '$2b$10$Xz3Kq1Y8eW5mP2nH7vLdO.vQkGpJwRyTsA6UfCbDiMlN9oZeXt4Ki', 'user',  '2024-08-15 10:00:00'),
  (3,  'Aisha Binti Razak',   'aisha.razak@campus.edu.my',   '$2b$10$Xz3Kq1Y8eW5mP2nH7vLdO.vQkGpJwRyTsA6UfCbDiMlN9oZeXt4Ki', 'user',  '2024-09-01 09:30:00'),
  (4,  'Tan Chee Keong',      'cheekeong@campus.edu.my',     '$2b$10$Xz3Kq1Y8eW5mP2nH7vLdO.vQkGpJwRyTsA6UfCbDiMlN9oZeXt4Ki', 'user',  '2024-09-05 11:00:00'),
  (5,  'Priya Subramaniam',   'priya.sub@campus.edu.my',     '$2b$10$Xz3Kq1Y8eW5mP2nH7vLdO.vQkGpJwRyTsA6UfCbDiMlN9oZeXt4Ki', 'user',  '2024-09-10 14:00:00'),
  (6,  'Muhammad Hafiz',      'hafiz@campus.edu.my',         '$2b$10$Xz3Kq1Y8eW5mP2nH7vLdO.vQkGpJwRyTsA6UfCbDiMlN9oZeXt4Ki', 'user',  '2024-10-01 08:30:00'),
  (7,  'Nurul Izzah',         'izzah@campus.edu.my',         '$2b$10$Xz3Kq1Y8eW5mP2nH7vLdO.vQkGpJwRyTsA6UfCbDiMlN9oZeXt4Ki', 'user',  '2024-10-12 10:00:00'),
  (8,  'Chen Jia Hui',        'jiahui@campus.edu.my',        '$2b$10$Xz3Kq1Y8eW5mP2nH7vLdO.vQkGpJwRyTsA6UfCbDiMlN9oZeXt4Ki', 'user',  '2024-11-03 09:00:00'),
  (9,  'Rajesh Kumar',        'rajesh@campus.edu.my',        '$2b$10$Xz3Kq1Y8eW5mP2nH7vLdO.vQkGpJwRyTsA6UfCbDiMlN9oZeXt4Ki', 'user',  '2025-01-20 13:00:00');

-- ─── Facilities ───────────────────────────────────────────────────────────────
INSERT INTO facilities (facility_id, facility_name, facility_capacity, facility_type, facility_description, facility_image_url, facility_status) VALUES
  (1, 'Discussion Room A',   8,  'room',      'A quiet discussion room equipped with a whiteboard, projector, and video conferencing capabilities. Perfect for small group meetings and study sessions.',        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80', 'open'),
  (2, 'Discussion Room B',   10, 'room',      'Spacious discussion room with modular furniture, dual monitors, and natural lighting. Ideal for group projects and presentations.',                               'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=600&q=80', 'open'),
  (3, 'Conference Hall',     50, 'room',      'A large conference hall with a full PA system, stage, projection screen, and theater-style seating. Suitable for seminars, talks, and events.',                 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80', 'open'),
  (4, 'Study Pod 1',          4, 'room',      'An intimate study pod with sound-dampening walls, standing desk option, and a 32-inch monitor. Great for focused individual or pair work.',                    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', 'closed'),
  (5, 'Basketball Court',   20,  'court',     'Full-size indoor basketball court with polished hardwood flooring, adjustable hoops, and LED lighting. Suitable for games and training.',                       'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80', 'open'),
  (6, 'Badminton Court',     8,  'court',     'Two regulation-size badminton courts with premium lighting and sprung flooring. Rackets and shuttlecocks available at the equipment counter.',                  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80', 'open'),
  (7, 'Projector Set A',     1,  'equipment', 'Full HD portable projector (4000 lumens) with tripod stand, HDMI/USB-C cables, and carry case. Collect from the equipment counter with your booking QR.',     'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80', 'open'),
  (8, 'Video Recording Kit', 1,  'equipment', 'Professional video recording kit including DSLR camera, tripod, LED ring light, and lavalier microphone. Suitable for video assignments and projects.',        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80', 'closed');

-- ─── Bookings ─────────────────────────────────────────────────────────────────
-- checkin_token values are sample UUIDs (real tokens are generated by the app)
INSERT INTO bookings
  (booking_id, user_id, facility_id, booking_date, booking_time_slot, booking_group_size,
   booking_status, booking_cancel_reason, booking_created_at, checked_in_at, no_show_marked_at, checkin_token)
VALUES
  -- ── Lim Wei Jie (user 2) ─────────────────────────────────────────────────
  (1,  2, 1, '2026-06-28', '10:00-11:00', 5,  'booked',     NULL,                                    '2026-06-22 08:30:00', NULL,                  NULL,                  'tok-a1b2c3d4-0001'),
  (2,  2, 5, '2026-06-29', '15:00-16:00', 10, 'booked',     NULL,                                    '2026-06-22 09:00:00', NULL,                  NULL,                  'tok-a1b2c3d4-0002'),
  (3,  2, 3, '2026-06-25', '14:00-15:00', 30, 'booked',     NULL,                                    '2026-06-21 14:00:00', NULL,                  NULL,                  'tok-a1b2c3d4-0003'),
  (4,  2, 2, '2026-06-20', '09:00-10:00', 7,  'checked-in', NULL,                                    '2026-06-18 10:00:00', '2026-06-20 09:08:00', NULL,                  'tok-a1b2c3d4-0004'),
  (5,  2, 6, '2026-06-18', '17:00-18:00', 4,  'checked-in', NULL,                                    '2026-06-15 11:30:00', '2026-06-18 17:05:00', NULL,                  'tok-a1b2c3d4-0005'),
  (6,  2, 7, '2026-06-10', '11:00-12:00', 1,  'checked-in', NULL,                                    '2026-06-08 09:00:00', '2026-06-10 11:03:00', NULL,                  'tok-a1b2c3d4-0006'),
  (7,  2, 1, '2026-06-05', '13:00-14:00', 3,  'no-show',    NULL,                                    '2026-06-03 16:00:00', NULL,                  '2026-06-05 13:20:00', 'tok-a1b2c3d4-0007'),
  (8,  2, 5, '2026-05-28', '16:00-17:00', 8,  'no-show',    NULL,                                    '2026-05-26 12:00:00', NULL,                  '2026-05-28 16:20:00', 'tok-a1b2c3d4-0008'),
  (9,  2, 2, '2026-05-20', '10:00-11:00', 6,  'cancelled',  'Rescheduling to a later date',          '2026-05-18 08:00:00', NULL,                  NULL,                  NULL),
  (10, 2, 3, '2026-05-12', '08:00-09:00', 25, 'cancelled',  'Event postponed by organiser',          '2026-05-10 10:00:00', NULL,                  NULL,                  NULL),

  -- ── Aisha Binti Razak (user 3) ───────────────────────────────────────────
  (11, 3, 2, '2026-06-28', '14:00-15:00', 6,  'booked',     NULL,                                    '2026-06-22 10:00:00', NULL,                  NULL,                  'tok-b2c3d4e5-0011'),
  (12, 3, 6, '2026-06-25', '09:00-10:00', 4,  'checked-in', NULL,                                    '2026-06-20 13:00:00', '2026-06-25 09:10:00', NULL,                  'tok-b2c3d4e5-0012'),
  (13, 3, 1, '2026-06-15', '11:00-12:00', 5,  'no-show',    NULL,                                    '2026-06-12 09:30:00', NULL,                  '2026-06-15 11:18:00', 'tok-b2c3d4e5-0013'),
  (14, 3, 7, '2026-06-08', '13:00-14:00', 1,  'cancelled',  'Admin: Projector under maintenance',    '2026-06-05 11:00:00', NULL,                  NULL,                  NULL),

  -- ── Tan Chee Keong (user 4) ──────────────────────────────────────────────
  (15, 4, 5, '2026-06-27', '16:00-17:00', 12, 'booked',     NULL,                                    '2026-06-21 15:00:00', NULL,                  NULL,                  'tok-c3d4e5f6-0015'),
  (16, 4, 3, '2026-06-24', '10:00-11:00', 35, 'checked-in', NULL,                                    '2026-06-19 09:00:00', '2026-06-24 10:07:00', NULL,                  'tok-c3d4e5f6-0016'),
  (17, 4, 2, '2026-06-14', '15:00-16:00', 8,  'no-show',    NULL,                                    '2026-06-11 14:00:00', NULL,                  '2026-06-14 15:19:00', 'tok-c3d4e5f6-0017'),
  (18, 4, 6, '2026-06-03', '08:00-09:00', 4,  'cancelled',  'Personal commitment',                   '2026-06-01 08:00:00', NULL,                  NULL,                  NULL),

  -- ── Priya Subramaniam (user 5) ───────────────────────────────────────────
  (19, 5, 3, '2026-06-30', '09:00-10:00', 40, 'booked',     NULL,                                    '2026-06-23 11:00:00', NULL,                  NULL,                  'tok-d4e5f6g7-0019'),
  (20, 5, 1, '2026-06-22', '13:00-14:00', 4,  'checked-in', NULL,                                    '2026-06-19 10:00:00', '2026-06-22 13:04:00', NULL,                  'tok-d4e5f6g7-0020'),
  (21, 5, 7, '2026-06-12', '10:00-11:00', 1,  'no-show',    NULL,                                    '2026-06-09 15:00:00', NULL,                  '2026-06-12 10:22:00', 'tok-d4e5f6g7-0021'),

  -- ── Muhammad Hafiz (user 6) ──────────────────────────────────────────────
  (22, 6, 6, '2026-06-28', '08:00-09:00', 4,  'booked',     NULL,                                    '2026-06-22 07:30:00', NULL,                  NULL,                  'tok-e5f6g7h8-0022'),
  (23, 6, 2, '2026-06-23', '11:00-12:00', 9,  'checked-in', NULL,                                    '2026-06-20 11:00:00', '2026-06-23 11:02:00', NULL,                  'tok-e5f6g7h8-0023'),
  (24, 6, 1, '2026-06-10', '16:00-17:00', 3,  'cancelled',  'Admin: Room reserved for exam prep',    '2026-06-08 09:00:00', NULL,                  NULL,                  NULL),

  -- ── Nurul Izzah (user 7) ─────────────────────────────────────────────────
  (25, 7, 5, '2026-06-27', '14:00-15:00', 15, 'booked',     NULL,                                    '2026-06-21 12:00:00', NULL,                  NULL,                  'tok-f6g7h8i9-0025'),
  (26, 7, 3, '2026-06-21', '08:00-09:00', 20, 'checked-in', NULL,                                    '2026-06-18 08:00:00', '2026-06-21 08:09:00', NULL,                  'tok-f6g7h8i9-0026'),
  (27, 7, 6, '2026-06-08', '15:00-16:00', 6,  'no-show',    NULL,                                    '2026-06-05 10:00:00', NULL,                  '2026-06-08 15:17:00', 'tok-f6g7h8i9-0027'),

  -- ── Chen Jia Hui (user 8) ────────────────────────────────────────────────
  (28, 8, 7, '2026-06-26', '12:00-13:00', 1,  'booked',     NULL,                                    '2026-06-21 09:00:00', NULL,                  NULL,                  'tok-g7h8i9j0-0028'),
  (29, 8, 2, '2026-06-18', '10:00-11:00', 7,  'checked-in', NULL,                                    '2026-06-15 14:00:00', '2026-06-18 10:06:00', NULL,                  'tok-g7h8i9j0-0029'),

  -- ── Rajesh Kumar (user 9) ────────────────────────────────────────────────
  (30, 9, 1, '2026-06-29', '09:00-10:00', 4,  'booked',     NULL,                                    '2026-06-23 08:00:00', NULL,                  NULL,                  'tok-h8i9j0k1-0030');

-- ─── Favourites ───────────────────────────────────────────────────────────────
INSERT INTO favourites (favourite_id, user_id, facility_id) VALUES
  (1,  2, 1),  -- Wei Jie → Discussion Room A
  (2,  2, 5),  -- Wei Jie → Basketball Court
  (3,  2, 2),  -- Wei Jie → Discussion Room B
  (4,  2, 7),  -- Wei Jie → Projector Set A
  (5,  3, 6),  -- Aisha   → Badminton Court
  (6,  3, 2),  -- Aisha   → Discussion Room B
  (7,  4, 5),  -- Chee Keong → Basketball Court
  (8,  4, 3),  -- Chee Keong → Conference Hall
  (9,  5, 3),  -- Priya   → Conference Hall
  (10, 6, 6),  -- Hafiz   → Badminton Court
  (11, 7, 5),  -- Izzah   → Basketball Court
  (12, 8, 7);  -- Jia Hui → Projector Set A

-- ─── Notifications ────────────────────────────────────────────────────────────
-- System auto-notifications for booking confirmations, cancellations, no-shows
INSERT INTO notifications
  (notification_id, user_id, title, message, notification_type, is_read, created_by, created_at)
VALUES
  -- Booking confirmations
  (1,  2, 'Booking Confirmed', 'Your booking for Discussion Room A on 28 Jun (10:00-11:00) has been confirmed.',             'booking',    0, NULL, '2026-06-22 08:30:05'),
  (2,  2, 'Booking Confirmed', 'Your booking for Basketball Court on 29 Jun (15:00-16:00) has been confirmed.',              'booking',    0, NULL, '2026-06-22 09:00:05'),
  (3,  3, 'Booking Confirmed', 'Your booking for Discussion Room B on 28 Jun (14:00-15:00) has been confirmed.',             'booking',    0, NULL, '2026-06-22 10:00:05'),
  (4,  4, 'Booking Confirmed', 'Your booking for Basketball Court on 27 Jun (16:00-17:00) has been confirmed.',              'booking',    0, NULL, '2026-06-21 15:00:05'),
  (5,  5, 'Booking Confirmed', 'Your booking for Conference Hall on 30 Jun (09:00-10:00) has been confirmed.',               'booking',    0, NULL, '2026-06-23 11:00:05'),
  (6,  6, 'Booking Confirmed', 'Your booking for Badminton Court on 28 Jun (08:00-09:00) has been confirmed.',               'booking',    0, NULL, '2026-06-22 07:30:05'),
  (7,  7, 'Booking Confirmed', 'Your booking for Basketball Court on 27 Jun (14:00-15:00) has been confirmed.',              'booking',    0, NULL, '2026-06-21 12:00:05'),
  (8,  8, 'Booking Confirmed', 'Your booking for Projector Set A on 26 Jun (12:00-13:00) has been confirmed.',               'booking',    0, NULL, '2026-06-21 09:00:05'),
  (9,  9, 'Booking Confirmed', 'Your booking for Discussion Room A on 29 Jun (09:00-10:00) has been confirmed.',             'booking',    0, NULL, '2026-06-23 08:00:05'),

  -- Cancellation notifications
  (10, 2, 'Booking Cancelled', 'Your booking for Discussion Room B on 20 May has been cancelled. Reason: Rescheduling to a later date.',   'cancelled', 1, NULL, '2026-05-18 08:05:00'),
  (11, 2, 'Booking Cancelled', 'Your booking for Conference Hall on 12 May has been cancelled. Reason: Event postponed by organiser.',      'cancelled', 1, NULL, '2026-05-10 10:05:00'),
  (12, 3, 'Booking Cancelled by Admin', 'Your booking for Projector Set A on 08 Jun has been cancelled. Reason: Admin: Projector under maintenance.', 'cancelled', 1, 1, '2026-06-05 11:05:00'),
  (13, 4, 'Booking Cancelled', 'Your booking for Badminton Court on 03 Jun has been cancelled. Reason: Personal commitment.',               'cancelled', 1, NULL, '2026-06-01 08:05:00'),
  (14, 6, 'Booking Cancelled by Admin', 'Your booking for Discussion Room A on 10 Jun has been cancelled. Reason: Admin: Room reserved for exam prep.', 'cancelled', 1, 1, '2026-06-08 09:05:00'),

  -- No-show notifications
  (15, 2, 'No-Show Recorded', 'You were marked as no-show for Discussion Room A on 05 Jun (13:00-14:00). Repeated no-shows may affect your booking privileges.', 'no-show', 1, NULL, '2026-06-05 13:20:05'),
  (16, 2, 'No-Show Recorded', 'You were marked as no-show for Basketball Court on 28 May (16:00-17:00). Repeated no-shows may affect your booking privileges.',  'no-show', 1, NULL, '2026-05-28 16:20:05'),
  (17, 3, 'No-Show Recorded', 'You were marked as no-show for Discussion Room A on 15 Jun (11:00-12:00). Repeated no-shows may affect your booking privileges.', 'no-show', 1, NULL, '2026-06-15 11:18:05'),
  (18, 4, 'No-Show Recorded', 'You were marked as no-show for Discussion Room B on 14 Jun (15:00-16:00). Repeated no-shows may affect your booking privileges.', 'no-show', 1, NULL, '2026-06-14 15:19:05'),
  (19, 5, 'No-Show Recorded', 'You were marked as no-show for Projector Set A on 12 Jun (10:00-11:00). Repeated no-shows may affect your booking privileges.',   'no-show', 0, NULL, '2026-06-12 10:22:05'),
  (20, 7, 'No-Show Recorded', 'You were marked as no-show for Badminton Court on 08 Jun (15:00-16:00). Repeated no-shows may affect your booking privileges.',   'no-show', 0, NULL, '2026-06-08 15:17:05'),

  -- Check-in confirmations
  (21, 2, 'Check-In Successful', 'You have successfully checked in for Discussion Room B on 20 Jun (09:00-10:00). Enjoy your session!',  'check-in',   1, NULL, '2026-06-20 09:08:05'),
  (22, 2, 'Check-In Successful', 'You have successfully checked in for Badminton Court on 18 Jun (17:00-18:00). Enjoy your session!',    'check-in',   1, NULL, '2026-06-18 17:05:05'),
  (23, 3, 'Check-In Successful', 'You have successfully checked in for Badminton Court on 25 Jun (09:00-10:00). Enjoy your session!',    'check-in',   0, NULL, '2026-06-25 09:10:05'),
  (24, 4, 'Check-In Successful', 'You have successfully checked in for Conference Hall on 24 Jun (10:00-11:00). Enjoy your session!',    'check-in',   0, NULL, '2026-06-24 10:07:05'),

  -- Admin announcement (sent manually by admin to all users)
  (25, 2, 'System Announcement', 'Reminder: QR check-in must be done within 15 minutes of your slot start time to avoid a no-show.', 'announcement', 1, 1, '2026-06-01 08:00:00'),
  (26, 3, 'System Announcement', 'Reminder: QR check-in must be done within 15 minutes of your slot start time to avoid a no-show.', 'announcement', 1, 1, '2026-06-01 08:00:00'),
  (27, 4, 'System Announcement', 'Reminder: QR check-in must be done within 15 minutes of your slot start time to avoid a no-show.', 'announcement', 1, 1, '2026-06-01 08:00:00'),
  (28, 5, 'System Announcement', 'Reminder: QR check-in must be done within 15 minutes of your slot start time to avoid a no-show.', 'announcement', 1, 1, '2026-06-01 08:00:00'),
  (29, 6, 'System Announcement', 'Reminder: QR check-in must be done within 15 minutes of your slot start time to avoid a no-show.', 'announcement', 1, 1, '2026-06-01 08:00:00'),
  (30, 7, 'System Announcement', 'Reminder: QR check-in must be done within 15 minutes of your slot start time to avoid a no-show.', 'announcement', 0, 1, '2026-06-01 08:00:00'),
  (31, 8, 'System Announcement', 'Reminder: QR check-in must be done within 15 minutes of your slot start time to avoid a no-show.', 'announcement', 0, 1, '2026-06-01 08:00:00'),
  (32, 9, 'System Announcement', 'Reminder: QR check-in must be done within 15 minutes of your slot start time to avoid a no-show.', 'announcement', 0, 1, '2026-06-01 08:00:00');

-- =============================================================================
-- AUTO_INCREMENT note:
-- TiDB automatically tracks the highest inserted ID, so no ALTER TABLE is needed.
-- New rows inserted after this seed will continue from the next available ID.
-- =============================================================================

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;
