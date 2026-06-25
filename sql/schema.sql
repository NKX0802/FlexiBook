-- Smart Campus Facility Booking System — database schema
-- Run this once in the TiDB Cloud SQL editor to create all 5 tables.
-- TiDB is MySQL-compatible so standard MySQL DDL works fine here.

CREATE TABLE IF NOT EXISTS users (
  user_id        INT          NOT NULL AUTO_INCREMENT,
  user_name      VARCHAR(100) NOT NULL,
  user_email     VARCHAR(150) NOT NULL,
  user_password  VARCHAR(255) NOT NULL,
  user_role      VARCHAR(10)  NOT NULL DEFAULT 'user',
  user_created_at DATETIME    NOT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_user_email (user_email)
);

CREATE TABLE IF NOT EXISTS facilities (
  facility_id          INT          NOT NULL AUTO_INCREMENT,
  facility_name        VARCHAR(100) NOT NULL,
  facility_capacity    INT          NOT NULL,
  facility_type        VARCHAR(50)  NULL,
  facility_description TEXT         NULL,
  facility_image_url   VARCHAR(255) NULL,
  facility_status      VARCHAR(10)  NOT NULL DEFAULT 'open',
  PRIMARY KEY (facility_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id            INT          NOT NULL AUTO_INCREMENT,
  user_id               INT          NOT NULL,
  facility_id           INT          NOT NULL,
  booking_date          DATE         NOT NULL,
  booking_time_slot     VARCHAR(20)  NOT NULL,
  booking_group_size    INT          NOT NULL,
  booking_status        VARCHAR(15)  NOT NULL DEFAULT 'booked',
  booking_cancel_reason VARCHAR(255) NULL,
  booking_created_at    DATETIME     NOT NULL,
  checked_in_at         DATETIME     NULL,
  no_show_marked_at     DATETIME     NULL,
  checkin_token         VARCHAR(255) NULL,
  PRIMARY KEY (booking_id),
  CONSTRAINT fk_bookings_user     FOREIGN KEY (user_id)     REFERENCES users(user_id),
  CONSTRAINT fk_bookings_facility FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
);

CREATE TABLE IF NOT EXISTS favourites (
  favourite_id INT NOT NULL AUTO_INCREMENT,
  user_id      INT NOT NULL,
  facility_id  INT NOT NULL,
  PRIMARY KEY (favourite_id),
  UNIQUE KEY uq_favourite (user_id, facility_id),
  CONSTRAINT fk_favourites_user     FOREIGN KEY (user_id)     REFERENCES users(user_id),
  CONSTRAINT fk_favourites_facility FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id         INT          NOT NULL AUTO_INCREMENT,
  user_id                 INT          NULL,
  notification_message    VARCHAR(255) NOT NULL,
  notification_created_at DATETIME     NOT NULL,
  PRIMARY KEY (notification_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
