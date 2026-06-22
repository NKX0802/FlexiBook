import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Calendar, AlertTriangle, X, Loader2 } from 'lucide-react'
import BookingCard from '@/components/BookingCard'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'booked',    label: 'Upcoming',  statuses: ['booked'] },
  { key: 'completed', label: 'Completed', statuses: ['checked-in'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['no-show', 'cancelled'] },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('booked')
  const [bookings, setBookings] = useState([])
  const [favCount, setFavCount] = useState(0)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelConfirmId, setCancelConfirmId] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const cancelTarget = bookings.find(b => b.booking_id === cancelConfirmId)

  // Fetch all data on mount
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch current user
      const meRes = await fetch('/api/me')
      if (!meRes.ok) {
        setError('You must be logged in to view your dashboard.')
        setLoading(false)
        return
      }
      const meData = await meRes.json()
      if (!meData.success) {
        setError('You must be logged in to view your dashboard.')
        setLoading(false)
        return
      }
      setUser(meData.data)

      // Fetch bookings and favourites in parallel
      const [bookingsRes, favsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/favourites'),
      ])

      const bookingsData = await bookingsRes.json()
      const favsData = await favsRes.json()

      if (bookingsData.success) setBookings(bookingsData.data)
      if (favsData.success) setFavCount(favsData.data.length)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function requestCancel(id) {
    setCancelConfirmId(id)
  }

  async function confirmCancel() {
    if (!cancelConfirmId) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings?id=${cancelConfirmId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        // Update the booking in local state immediately
        setBookings(prev =>
          prev.map(b =>
            b.booking_id === cancelConfirmId
              ? { ...b, booking_status: 'cancelled', booking_cancel_reason: 'Cancelled by user' }
              : b
          )
        )
        toast('Booking cancelled.', { icon: '🚫' })
      } else {
        toast.error(data.error || 'Failed to cancel booking.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setCancelling(false)
      setCancelConfirmId(null)
    }
  }

  const upcomingCount = bookings.filter(b => b.booking_status === 'booked').length
  const activeStatuses = TABS.find(t => t.key === activeTab)?.statuses ?? []
  const filtered = bookings.filter(b => activeStatuses.includes(b.booking_status))

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 pt-16 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  // ── Error / not logged in ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-green-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Dashboard
            </h1>
            {user && (
              <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user.user_name} 👋</p>
            )}
            <p className="text-sm text-gray-400 mt-1">
              {upcomingCount > 0
                ? `${upcomingCount} upcoming ${upcomingCount === 1 ? 'booking' : 'bookings'}`
                : 'No upcoming bookings'}
              {favCount > 0 && ` · ${favCount} saved ${favCount === 1 ? 'favourite' : 'favourites'}`}
            </p>
          </div>
          <Link
            href="/facilities"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
          >
            <Plus size={15} /> Add Booking
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-7">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Booking list */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(booking => (
              <BookingCard key={booking.booking_id} booking={booking} onCancel={requestCancel} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Calendar size={24} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">No bookings here</p>
            {activeTab === 'booked' && (
              <>
                <p className="text-xs text-gray-400 mb-5">Start by browsing available facilities.</p>
                <Link
                  href="/facilities"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <Plus size={15} /> Browse Facilities
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {cancelConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Cancel booking?
                </h3>
                {cancelTarget && (
                  <p className="text-sm text-gray-500 mt-1">
                    {cancelTarget.facility_name} · {cancelTarget.booking_time_slot}
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
              </div>
              <button
                onClick={() => setCancelConfirmId(null)}
                className="ml-auto p-1 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
              </button>
              <button
                onClick={() => setCancelConfirmId(null)}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
