import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  ArrowLeft, Building2, Calendar, Clock, Users,
  CheckCircle2, ChevronRight, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function BookPage() {
  const router = useRouter()
  const { facilityId, date, slot } = router.query

  const [facility, setFacility] = useState(null)
  const [user, setUser] = useState(null)
  const [groupSize, setGroupSize] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [bookingId, setBookingId] = useState(null)
  const [error, setError] = useState(null)

  // Fetch facility info and current user once router is ready
  useEffect(() => {
    if (!router.isReady || !facilityId) return

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [facilityRes, meRes] = await Promise.all([
          fetch(`/api/facilities/${facilityId}`),
          fetch('/api/me'),
        ])

        const facilityData = await facilityRes.json()
        const meData = await meRes.json()

        if (!facilityData.success) {
          setError('Facility not found.')
          return
        }
        setFacility(facilityData.data)

        if (!meData.success) {
          setError('You must be logged in to make a booking.')
          return
        }
        setUser(meData.data)
      } catch {
        setError('Failed to load booking details.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router.isReady, facilityId])

  async function handleConfirm(e) {
    e.preventDefault()
    if (!facility || !user) return

    if (groupSize < 1 || groupSize > facility.facility_capacity) {
      toast.error(`Group size must be between 1 and ${facility.facility_capacity}.`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facility_id: facility.facility_id,
          booking_date: date,
          booking_time_slot: slot,
          booking_group_size: groupSize,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setBookingId(data.data.booking_id)
        setConfirmed(true)
        toast.success('Booking confirmed! Check your notifications.')
      } else {
        toast.error(data.error || 'Failed to create booking.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 pt-16 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-green-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Link href="/facilities" className="text-emerald-600 font-semibold hover:underline">← Back to Facilities</Link>
        </div>
      </div>
    )
  }

  // ── Missing query params ─────────────────────────────────────────────────
  if (!facility || !date || !slot) {
    return (
      <div className="min-h-screen bg-green-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">Invalid booking request.</p>
          <Link href="/facilities" className="text-emerald-600 font-semibold hover:underline">← Back to Facilities</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        <Link
          href={facility ? `/facilities/${facility.facility_id}` : '/facilities'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-700 transition-colors mb-5 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </Link>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {confirmed ? 'Booking Confirmed' : 'Confirm Your Booking'}
        </h1>

        {confirmed ? (
          /* ── Success state ── */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
              You&apos;re all set!
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Your booking has been confirmed. Show the QR code at the entrance to check in.
            </p>

            {/* Summary */}
            <div className="bg-green-50 rounded-xl p-4 text-left mb-5 space-y-2">
              <Detail icon={Building2} label="Facility" value={facility?.facility_name} />
              <Detail icon={Calendar} label="Date" value={date} />
              <Detail icon={Clock} label="Time" value={slot} />
              <Detail icon={Users} label="Group size" value={`${groupSize} ${groupSize === 1 ? 'person' : 'people'}`} />
            </div>

            <p className="text-xs text-gray-400 mb-5">
              Booking ID: <span className="font-bold text-gray-700">#{bookingId}</span>
            </p>

            {/* QR placeholder */}
            <div className="inline-flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
              <div className="w-32 h-32 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 100 100" width="100" height="100" className="opacity-80">
                  <rect x="10" y="10" width="30" height="30" rx="3" fill="#059669"/>
                  <rect x="60" y="10" width="30" height="30" rx="3" fill="#059669"/>
                  <rect x="10" y="60" width="30" height="30" rx="3" fill="#059669"/>
                  <rect x="17" y="17" width="16" height="16" fill="white"/>
                  <rect x="67" y="17" width="16" height="16" fill="white"/>
                  <rect x="17" y="67" width="16" height="16" fill="white"/>
                  <rect x="60" y="60" width="8" height="8" fill="#059669"/>
                  <rect x="72" y="60" width="8" height="8" fill="#059669"/>
                  <rect x="60" y="72" width="8" height="8" fill="#059669"/>
                  <rect x="72" y="72" width="8" height="8" fill="#059669"/>
                  <rect x="84" y="72" width="6" height="6" fill="#059669"/>
                  <rect x="45" y="10" width="8" height="8" fill="#059669"/>
                  <rect x="45" y="26" width="8" height="8" fill="#059669"/>
                  <rect x="45" y="45" width="8" height="8" fill="#059669"/>
                  <rect x="10" y="45" width="8" height="8" fill="#059669"/>
                  <rect x="26" y="45" width="8" height="8" fill="#059669"/>
                </svg>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Check-in QR Code</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 will-change-transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                View My Bookings <ChevronRight size={15} />
              </Link>
              <Link
                href="/facilities"
                className="flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 will-change-transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Browse More
              </Link>
            </div>
          </div>
        ) : (
          /* ── Booking form ── */
          <div className="space-y-4">
            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-widest mb-3">Booking Summary</h2>
              <div className="space-y-2">
                <Detail icon={Building2} label="Facility" value={facility.facility_name} />
                <Detail icon={Calendar} label="Date" value={date} />
                <Detail icon={Clock} label="Time Slot" value={slot} />
              </div>
            </div>

            {/* Group size form */}
            <form onSubmit={handleConfirm} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Group size
                  <span className="ml-1 text-xs font-normal text-gray-400">(max {facility.facility_capacity})</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGroupSize(g => Math.max(1, g - 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 active:scale-90 transition-all"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-gray-900 w-8 text-center">{groupSize}</span>
                  <button
                    type="button"
                    onClick={() => setGroupSize(g => Math.min(facility.facility_capacity, g + 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 active:scale-90 transition-all"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-400 ml-1">people</span>
                </div>
              </div>

              {/* Booked by (real user) */}
              {user && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Booked by</label>
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {user.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.user_name}</p>
                      <p className="text-xs text-gray-400">{user.user_email}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 will-change-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100 transition-all duration-200 shadow-md shadow-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Confirming…
                  </span>
                ) : (
                  <><CheckCircle2 size={16} /> Confirm Booking</>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={14} className="text-emerald-600 shrink-0" />
      <span className="text-xs text-gray-500">{label}:</span>
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    </div>
  )
}
