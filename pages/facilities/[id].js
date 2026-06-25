import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  ArrowLeft, Users, Heart, Calendar, Clock,
  AlertCircle, ChevronRight, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import StatusBadge from '@/components/StatusBadge'
import { TIME_SLOTS } from '@/lib/fakeData'

function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

// A slot on today's date is "past" once its start time has already gone by
function isSlotPast(selectedDate, slot) {
  if (selectedDate !== getTodayString()) return false
  const slotStart = slot.split('-')[0]
  const slotStartDate = new Date(`${selectedDate}T${slotStart}:00`)
  return slotStartDate.getTime() <= Date.now()
}

const TYPE_COLORS = {
  room:      'bg-blue-100 text-blue-700',
  court:     'bg-orange-100 text-orange-700',
  equipment: 'bg-purple-100 text-purple-700',
}

export default function FacilityDetailPage() {
  const router = useRouter()
  const { id } = router.query

  const [facility, setFacility] = useState(null)
  const [bookedSlots, setBookedSlots] = useState([])
  const [isFav, setIsFav] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [favLoading, setFavLoading] = useState(false)

  // Fetch facility details on mount (once id is available)
  useEffect(() => {
    if (!id) return

    async function fetchFacility() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/facilities/${id}?booking_date=${selectedDate}`)
        const data = await res.json()
        if (!data.success) {
          setError('Facility not found.')
          return
        }
        setFacility(data.data)
        setBookedSlots(data.data.booked_slots || [])
        setIsFav(!!data.data.is_favourited)
      } catch {
        setError('Failed to load facility.')
      } finally {
        setLoading(false)
      }
    }

    fetchFacility()
  // Only re-run when id changes — date changes handled separately below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Re-fetch booked slots whenever the selected date changes (after initial load)
  useEffect(() => {
    if (!id || loading) return

    async function fetchSlots() {
      setSlotsLoading(true)
      try {
        const res = await fetch(`/api/facilities/${id}?booking_date=${selectedDate}`)
        const data = await res.json()
        if (data.success) {
          setBookedSlots(data.data.booked_slots || [])
        }
      } catch {
        // silently ignore slot fetch errors
      } finally {
        setSlotsLoading(false)
      }
    }

    fetchSlots()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  async function toggleFav() {
    if (favLoading) return
    setFavLoading(true)
    try {
      let res
      if (isFav) {
        res = await fetch(`/api/favourites?facility_id=${id}`, { method: 'DELETE' })
      } else {
        res = await fetch('/api/favourites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facility_id: Number(id) }),
        })
      }

      if (res.status === 401) {
        toast.error('Please log in to save favourites.')
        return
      }

      const data = await res.json()
      if (data.success) {
        setIsFav(f => !f)
        toast(isFav ? 'Removed from favourites' : 'Added to favourites!', {
          icon: isFav ? '💔' : '⭐',
        })
      } else {
        toast.error(data.error || 'Failed to update favourites.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setFavLoading(false)
    }
  }

  function handleBook() {
    if (!selectedSlot) {
      toast.error('Please select a time slot first.')
      return
    }
    router.push(
      `/book?facilityId=${facility.facility_id}&date=${selectedDate}&slot=${encodeURIComponent(selectedSlot)}`
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 pt-16 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  // ── Error / not found ────────────────────────────────────────────────────
  if (error || !facility) {
    return (
      <div className="min-h-screen bg-green-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">{error || 'Facility not found.'}</p>
          <Link href="/facilities" className="text-emerald-600 font-semibold hover:underline">← Back to Facilities</Link>
        </div>
      </div>
    )
  }

  const typeColor = TYPE_COLORS[facility.facility_type] || 'bg-gray-100 text-gray-700'

  return (
    <div className="min-h-screen bg-green-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link
          href="/facilities"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-700 transition-colors mb-5 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Facilities
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Hero image */}
          <div className="relative h-56 sm:h-72 overflow-hidden">
            <img
              src={facility.facility_image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'}
              alt={facility.facility_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

            <div className="absolute bottom-4 left-4">
              <StatusBadge status={facility.facility_status} />
            </div>

            <button
              onClick={toggleFav}
              disabled={favLoading}
              className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-sm transition-all duration-200 will-change-transform hover:scale-110 active:scale-95 disabled:opacity-70 ${
                isFav ? 'bg-red-500 text-white shadow-lg' : 'bg-white/80 text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart size={20} className={isFav ? 'fill-current' : ''} />
            </button>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {facility.facility_name}
                </h1>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                  <Users size={14} />
                  <span>Capacity: up to <strong>{facility.facility_capacity}</strong> {facility.facility_capacity === 1 ? 'person' : 'people'}</span>
                </div>
              </div>
            </div>

            {facility.facility_description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-6 border-t border-gray-100 pt-4">
                {facility.facility_description}
              </p>
            )}

            {/* Booking section */}
            {facility.facility_status === 'open' ? (
              <div className="border-t border-gray-100 pt-5">
                <h2 className="font-bold text-gray-800 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Select a date &amp; time slot
                </h2>

                <div className="mb-4">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar size={14} />
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={getTodayString()}
                    onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(null) }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-gray-900"
                  />
                </div>

                <div className="mb-5">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
                    <Clock size={14} />
                    Available time slots
                    {slotsLoading && <Loader2 size={12} className="animate-spin text-emerald-400 ml-1" />}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {TIME_SLOTS.map(slot => {
                      const booked = bookedSlots.includes(slot)
                      const past = !booked && isSlotPast(selectedDate, slot)
                      const selected = selectedSlot === slot
                      return (
                        <button
                          key={slot}
                          disabled={booked || past || slotsLoading}
                          onClick={() => setSelectedSlot(slot)}
                          title={past ? 'This time slot has already passed' : undefined}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold text-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400
                            ${booked || past
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                              : selected
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-green-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={!selectedSlot}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 will-change-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200 shadow-md shadow-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Continue to Booking <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle size={20} className="text-red-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-700 text-sm">Facility currently closed</p>
                    <p className="text-xs text-red-400 mt-0.5">This facility is unavailable for booking. Check back later.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
