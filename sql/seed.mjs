// Seed script — inserts test bookings for a real registered user
// Run with:  node sql/seed.mjs
//
// Configuration (in .env.local):
//   SEED_USER_EMAIL=your-registered-email@example.com
//
// This script will:
//   1. Find the existing user by SEED_USER_EMAIL (must already be registered)
//   2. Insert 8 facilities if they don't exist yet
//   3. Insert 10 test bookings (various statuses) for that user
//   4. Insert 4 favourites for that user
//   5. Insert 7 notifications for that user
//
// Dates are calculated in Malaysia time (UTC+8).
// Safe to re-run — clears and re-inserts only that user's data.

import mysql from 'mysql2/promise'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ── Load .env.local ────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env.local')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  console.error('❌ Cannot read .env.local — make sure the file exists in the project root.')
  process.exit(1)
}

// ── Validate config ────────────────────────────────────────────────────────
const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL
if (!SEED_USER_EMAIL) {
  console.error('❌ SEED_USER_EMAIL is not set in .env.local')
  console.error('   Add this line to .env.local:')
  console.error('   SEED_USER_EMAIL=your-registered-email@example.com')
  process.exit(1)
}

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '4000'),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:      { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 5,
})

// ── Malaysia time helper (UTC+8) ──────────────────────────────────────────
// Returns a YYYY-MM-DD string offset by N days from today (Malaysia time)
function malaysiaDateFromNow(offsetDays) {
  const OFFSET_HOURS = 8 // Malaysia is UTC+8
  const now = new Date()
  // Shift to Malaysia time, then apply day offset
  const myt = new Date(now.getTime() + OFFSET_HOURS * 60 * 60 * 1000)
  myt.setUTCDate(myt.getUTCDate() + offsetDays)
  return myt.toISOString().split('T')[0] // YYYY-MM-DD
}

// Returns current Malaysia time as a MySQL DATETIME string (YYYY-MM-DD HH:MM:SS)
function malaysiaDatetime(offsetDays = 0) {
  const OFFSET_HOURS = 8
  const now = new Date()
  const myt = new Date(now.getTime() + OFFSET_HOURS * 60 * 60 * 1000)
  myt.setUTCDate(myt.getUTCDate() + offsetDays)
  return myt.toISOString().replace('T', ' ').slice(0, 19) // YYYY-MM-DD HH:MM:SS
}

async function seed() {
  console.log('🌱 Starting seed...')
  console.log(`📧 Target user: ${SEED_USER_EMAIL}`)
  console.log(`🕐 Malaysia time: ${malaysiaDatetime()}\n`)

  // ── 1. LOOK UP EXISTING USER ────────────────────────────────────────────
  const [users] = await pool.query(
    'SELECT user_id, user_name, user_email, user_role FROM users WHERE user_email = ?',
    [SEED_USER_EMAIL]
  )

  if (users.length === 0) {
    console.error(`❌ No user found with email: ${SEED_USER_EMAIL}`)
    console.error('   Please register an account first at http://localhost:3000/register')
    console.error('   Then update SEED_USER_EMAIL in .env.local with that email.')
    await pool.end()
    process.exit(1)
  }

  const seedUser = users[0]
  console.log(`✅ Found user: "${seedUser.user_name}" (id=${seedUser.user_id}, role=${seedUser.user_role})`)

  // ── 2. FACILITIES (insert if not present, update if exists) ─────────────
  const facilities = [
    {
      name: 'Discussion Room A',
      capacity: 8,
      type: 'room',
      desc: 'A quiet discussion room equipped with a whiteboard, projector, and video conferencing capabilities. Perfect for small group meetings and study sessions.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
      status: 'open',
    },
    {
      name: 'Discussion Room B',
      capacity: 10,
      type: 'room',
      desc: 'Spacious discussion room with modular furniture, dual monitors, and natural lighting. Ideal for group projects and presentations.',
      image: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=600&q=80',
      status: 'open',
    },
    {
      name: 'Conference Hall',
      capacity: 50,
      type: 'room',
      desc: 'A large conference hall with a full PA system, stage, projection screen, and theater-style seating. Suitable for seminars, talks, and events.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
      status: 'open',
    },
    {
      name: 'Study Pod 1',
      capacity: 4,
      type: 'room',
      desc: 'An intimate study pod with sound-dampening walls, standing desk option, and a 32-inch monitor. Great for focused individual or pair work.',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
      status: 'closed',
    },
    {
      name: 'Basketball Court',
      capacity: 20,
      type: 'court',
      desc: 'Full-size indoor basketball court with polished hardwood flooring, adjustable hoops, and LED lighting. Suitable for games and training.',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80',
      status: 'open',
    },
    {
      name: 'Badminton Court',
      capacity: 8,
      type: 'court',
      desc: 'Two regulation-size badminton courts with premium lighting and sprung flooring. Rackets and shuttlecocks available at the equipment counter.',
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80',
      status: 'open',
    },
    {
      name: 'Projector Set A',
      capacity: 1,
      type: 'equipment',
      desc: 'Full HD portable projector (4000 lumens) with tripod stand, HDMI/USB-C cables, and carry case. Collect from the equipment counter with your booking QR.',
      image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80',
      status: 'open',
    },
    {
      name: 'Video Recording Kit',
      capacity: 1,
      type: 'equipment',
      desc: 'Professional video recording kit including DSLR camera, tripod, LED ring light, and lavalier microphone. Suitable for video assignments and projects.',
      image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80',
      status: 'closed',
    },
  ]

  const facilityIds = []
  for (const f of facilities) {
    const [existing] = await pool.query(
      'SELECT facility_id FROM facilities WHERE facility_name = ?',
      [f.name]
    )
    if (existing.length > 0) {
      await pool.query(
        `UPDATE facilities SET
           facility_capacity=?, facility_type=?, facility_description=?,
           facility_image_url=?, facility_status=?
         WHERE facility_id=?`,
        [f.capacity, f.type, f.desc, f.image, f.status, existing[0].facility_id]
      )
      facilityIds.push(existing[0].facility_id)
    } else {
      const [result] = await pool.query(
        `INSERT INTO facilities
           (facility_name, facility_capacity, facility_type, facility_description, facility_image_url, facility_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [f.name, f.capacity, f.type, f.desc, f.image, f.status]
      )
      facilityIds.push(result.insertId)
    }
  }

  const [fDiscA, fDiscB, fConf, fPod, fBball, fBadminton, fProj, fVideo] = facilityIds
  console.log(`✅ Facilities: IDs = ${facilityIds.join(', ')}`)

  // ── 3. BOOKINGS (clear old ones for this user, insert fresh) ────────────
  await pool.query('DELETE FROM bookings WHERE user_id = ?', [seedUser.user_id])

  const bookings = [
    // ── UPCOMING (booked) — future dates ──
    {
      fid: fDiscA, date: malaysiaDateFromNow(3),
      slot: '10:00-11:00', size: 5, status: 'booked',
      created: malaysiaDatetime(-1),
    },
    {
      fid: fBball, date: malaysiaDateFromNow(5),
      slot: '15:00-16:00', size: 10, status: 'booked',
      created: malaysiaDatetime(-1),
    },
    {
      fid: fBadminton, date: malaysiaDateFromNow(7),
      slot: '08:00-09:00', size: 4, status: 'booked',
      created: malaysiaDatetime(-2),
    },
    // ── COMPLETED (checked-in) — past dates ──
    {
      fid: fDiscB, date: malaysiaDateFromNow(-5),
      slot: '09:00-10:00', size: 7, status: 'checked-in',
      created: malaysiaDatetime(-8),
    },
    {
      fid: fBadminton, date: malaysiaDateFromNow(-10),
      slot: '17:00-18:00', size: 4, status: 'checked-in',
      created: malaysiaDatetime(-14),
    },
    {
      fid: fProj, date: malaysiaDateFromNow(-15),
      slot: '11:00-12:00', size: 1, status: 'checked-in',
      created: malaysiaDatetime(-18),
    },
    // ── NO-SHOW — past date ──
    {
      fid: fDiscA, date: malaysiaDateFromNow(-20),
      slot: '13:00-14:00', size: 3, status: 'no-show',
      created: malaysiaDatetime(-22),
    },
    // ── CANCELLED — past dates ──
    {
      fid: fDiscB, date: malaysiaDateFromNow(-30),
      slot: '10:00-11:00', size: 6, status: 'cancelled',
      reason: 'Rescheduling to a later date',
      created: malaysiaDatetime(-32),
    },
    {
      fid: fConf, date: malaysiaDateFromNow(-35),
      slot: '08:00-09:00', size: 25, status: 'cancelled',
      reason: 'Event postponed by organiser',
      created: malaysiaDatetime(-37),
    },
    {
      fid: fProj, date: malaysiaDateFromNow(-40),
      slot: '12:00-13:00', size: 1, status: 'cancelled',
      reason: 'Admin: Facility under maintenance',
      created: malaysiaDatetime(-42),
    },
  ]

  const bookingIds = []
  for (const b of bookings) {
    const [result] = await pool.query(
      `INSERT INTO bookings
         (user_id, facility_id, booking_date, booking_time_slot, booking_group_size,
          booking_status, booking_cancel_reason, booking_created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [seedUser.user_id, b.fid, b.date, b.slot, b.size, b.status, b.reason || null, b.created]
    )
    bookingIds.push(result.insertId)
  }
  console.log(`✅ Bookings: ${bookingIds.length} inserted`)
  console.log(`   Upcoming (booked):     ${bookings.filter(b => b.status === 'booked').length} bookings`)
  console.log(`   Completed (checked-in):${bookings.filter(b => b.status === 'checked-in').length} bookings`)
  console.log(`   No-show:               ${bookings.filter(b => b.status === 'no-show').length} bookings`)
  console.log(`   Cancelled:             ${bookings.filter(b => b.status === 'cancelled').length} bookings`)

  // ── 4. FAVOURITES ────────────────────────────────────────────────────────
  await pool.query('DELETE FROM favourites WHERE user_id = ?', [seedUser.user_id])
  const favFacilities = [fDiscA, fBball, fDiscB, fProj]
  for (const fid of favFacilities) {
    await pool.query(
      'INSERT IGNORE INTO favourites (user_id, facility_id) VALUES (?, ?)',
      [seedUser.user_id, fid]
    )
  }
  console.log(`✅ Favourites: 4 added (Discussion Room A, Basketball Court, Discussion Room B, Projector Set A)`)

  // ── 5. NOTIFICATIONS ─────────────────────────────────────────────────────
  await pool.query('DELETE FROM notifications WHERE user_id = ?', [seedUser.user_id])
  await pool.query('DELETE FROM notifications WHERE user_id IS NULL') // clear old broadcasts

  const notifications = [
    // Broadcasts (user_id = NULL — visible to everyone)
    { uid: null, msg: '🏀 Basketball Court will be closed for resurfacing from 14–16 July. Plan your bookings accordingly.', created: malaysiaDatetime(-5) },
    { uid: null, msg: '📢 New facility added: Video Recording Kit is now available for booking. Check it out under Equipment.', created: malaysiaDatetime(-10) },
    { uid: null, msg: '⚠️ Reminder: QR check-in must be done within 15 minutes of your booking slot start time to avoid a no-show.', created: malaysiaDatetime(-20) },
    // User-specific
    { uid: seedUser.user_id, msg: `✅ Your booking for Discussion Room A on ${malaysiaDateFromNow(3)} (10:00–11:00) has been confirmed.`, created: malaysiaDatetime(-1) },
    { uid: seedUser.user_id, msg: `✅ Your booking for Basketball Court on ${malaysiaDateFromNow(5)} (15:00–16:00) has been confirmed.`, created: malaysiaDatetime(-1) },
    { uid: seedUser.user_id, msg: '❌ Your booking for Projector Set A was cancelled. Reason: Admin: Facility under maintenance.', created: malaysiaDatetime(-42) },
    { uid: seedUser.user_id, msg: `🚫 You were marked as a no-show for Discussion Room A on ${malaysiaDateFromNow(-20)}. Repeated no-shows may affect booking privileges.`, created: malaysiaDatetime(-20) },
  ]

  for (const n of notifications) {
    await pool.query(
      'INSERT INTO notifications (user_id, notification_message, notification_created_at) VALUES (?, ?, ?)',
      [n.uid, n.msg, n.created]
    )
  }
  console.log(`✅ Notifications: ${notifications.length} inserted (3 broadcasts + 4 for ${seedUser.user_name})`)

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 Seed complete!\n')
  console.log(`User: ${seedUser.user_name} (${seedUser.user_email})`)
  console.log(`Today (Malaysia time): ${malaysiaDateFromNow(0)}`)
  console.log(`\nUpcoming bookings:`)
  console.log(`  Discussion Room A  → ${malaysiaDateFromNow(3)} at 10:00-11:00`)
  console.log(`  Basketball Court   → ${malaysiaDateFromNow(5)} at 15:00-16:00`)
  console.log(`  Badminton Court    → ${malaysiaDateFromNow(7)} at 08:00-09:00`)
  console.log(`\nFacility IDs:`)
  console.log(`  Discussion Room A   = ${fDiscA}`)
  console.log(`  Discussion Room B   = ${fDiscB}`)
  console.log(`  Conference Hall     = ${fConf}`)
  console.log(`  Study Pod 1         = ${fPod}  (closed)`)
  console.log(`  Basketball Court    = ${fBball}`)
  console.log(`  Badminton Court     = ${fBadminton}`)
  console.log(`  Projector Set A     = ${fProj}`)
  console.log(`  Video Recording Kit = ${fVideo} (closed)`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await pool.end()
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message)
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    console.error('   Check DB_HOST and DB_PORT in .env.local')
  }
  process.exit(1)
})
