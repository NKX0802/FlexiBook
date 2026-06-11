import { useState } from 'react'
import Link from 'next/link'
import { Plus, Calendar, AlertTriangle, X } from 'lucide-react'
import BookingCard from '@/components/BookingCard'
import { BOOKINGS } from '@/lib/fakeData'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'booked',    label: 'Upcoming',  statuses: ['booked'] },
  { key: 'completed', label: 'Completed', statuses: ['checked-in'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['no-show', 'cancelled'] },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('booked')
  const [bookings, setBookings] = useState(BOOKINGS)
  const [cancelConfirmId, setCancelConfirmId] = useState(null)

  const cancelTarget = bookings.find(b => b.booking_id === cancelConfirmId)

  function requestCancel(id) {
    setCancelConfirmId(id)
  }

  function confirmCancel() {
    setBookings(prev =>
      prev.map(b =>
        b.booking_id === cancelConfirmId
          ? { ...b, booking_status: 'cancelled', booking_cancel_reason: 'Cancelled by user' }
          : b
      )
    )
    toast('Booking cancelled.', { icon: '🚫' })
    setCancelConfirmId(null)
  }

  const upcomingCount = bookings.filter(b => b.booking_status === 'booked').length
  const activeStatuses = TABS.find(t => t.key === activeTab)?.statuses ?? []
  const filtered = bookings.filter(b => activeStatuses.includes(b.booking_status))

  return (
    <div className="min-h-screen bg-green-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {upcomingCount > 0
                ? `${upcomingCount} upcoming ${upcomingCount === 1 ? 'booking' : 'bookings'}`
                : 'No upcoming bookings'}
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

        {/* List */}
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
            <p className="text-sm text-gray-500 font-medium mb-1">No booking yet</p>
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
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Yes, cancel it
              </button>
              <button
                onClick={() => setCancelConfirmId(null)}
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
