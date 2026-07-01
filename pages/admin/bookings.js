import { useState, useEffect, useCallback } from 'react'
import { Search, X, CheckCircle2, XCircle, Edit2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/AdminLayout'
import StatusBadge from '@/components/StatusBadge'
import { Skeleton, SkeletonRow } from '@/components/Skeleton'

const STATUS_FILTERS = ['all', 'booked', 'checked-in', 'no-show', 'cancelled']
const EDITABLE_STATUSES = ['booked', 'no-show']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = String(dateStr).slice(0, 10).split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

// Statuses an admin can change a booking TO
const STATUS_OPTIONS = [
  { value: 'booked',     label: 'Booked' },
  { value: 'checked-in', label: 'Checked-In' },
  { value: 'no-show',   label: 'No-Show' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Edit modal
  const [editModal, setEditModal] = useState(null)   // booking object
  const [editStatus, setEditStatus] = useState('')
  const [editReason, setEditReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/bookings?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setBookings(data.data)
      } else {
        toast.error(data.error || 'Failed to load bookings.')
      }
    } catch {
      toast.error('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  function openEdit(b) {
    setEditModal(b)
    setEditStatus(b.booking_status)
    setEditReason(b.booking_cancel_reason || '')
  }

  function closeEdit() {
    setEditModal(null)
    setEditStatus('')
    setEditReason('')
  }

  async function confirmEdit() {
    if (!editStatus) { toast.error('Please select a status.'); return }
    if (editStatus === 'cancelled' && !editReason.trim()) {
      toast.error('A cancellation reason is required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/bookings?id=${editModal.booking_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          cancel_reason: editStatus === 'cancelled' ? editReason.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Booking updated.')
        closeEdit()
        fetchBookings()
      } else {
        toast.error(data.error || 'Failed to update booking.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmCancel() {
    if (!cancelReason.trim()) { toast.error('Please enter a reason.'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/bookings?id=${cancelModal.booking_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancel_reason: cancelReason }),
      })
      const data = await res.json()
      if (data.success) {
        toast('Booking cancelled.', { icon: '🚫' })
        setCancelModal(null)
        setCancelReason('')
        fetchBookings()
      } else {
        toast.error(data.error || 'Failed to cancel booking.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout title="Manage Bookings">

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user or facility…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm hover:border-primary-300 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900 placeholder-gray-300 bg-white"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-150 will-change-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                statusFilter === s ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 dark:hover:border-primary-500'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
          <button
            onClick={fetchBookings}
            title="Refresh"
            aria-label="Refresh bookings"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-300 dark:hover:border-primary-500 transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-3 w-40 mb-3" />
          <div className="sm:hidden space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{bookings.length} booking{bookings.length !== 1 ? 's' : ''} found</p>

          {/* Mobile: stacked cards */}
          <div className="sm:hidden space-y-3">
            {bookings.map(b => {
              const status = (b.booking_status || '').trim().toLowerCase()
              const editable = EDITABLE_STATUSES.includes(status)
              return (
                <div key={b.booking_id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
                        {b.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{b.user_name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{b.user_email}</p>
                      </div>
                    </div>
                    <StatusBadge status={b.booking_status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                    <p><span className="text-gray-400">Facility:</span> {b.facility_name}</p>
                    <p><span className="text-gray-400">Group:</span> {b.booking_group_size}</p>
                    <p><span className="text-gray-400">Date:</span> {formatDate(b.booking_date)}</p>
                    <p><span className="text-gray-400">Time:</span> {b.booking_time_slot}</p>
                  </div>
                  {editable && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => openEdit(b)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      {status !== 'cancelled' && (
                        <button
                          onClick={() => setCancelModal(b)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <XCircle size={13} /> Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {bookings.length === 0 && (
              <div className="py-14 text-center bg-white rounded-xl border border-gray-100">
                <CheckCircle2 size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No bookings match your filters.</p>
              </div>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['User', 'Facility', 'Date & Time', 'Group', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map(b => (
                    <tr key={b.booking_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
                            {b.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-xs whitespace-nowrap">{b.user_name}</p>
                            <p className="text-[10px] text-gray-400">{b.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">{b.facility_name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        <div>{formatDate(b.booking_date)}</div>
                        <div className="text-gray-400">{b.booking_time_slot}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs text-center">{b.booking_group_size}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.booking_status} /></td>
                      <td className="px-4 py-3">
                        {(() => {
                          const status = (b.booking_status || '').trim().toLowerCase()
                          if (!EDITABLE_STATUSES.includes(status)) {
                            return <span className="text-xs text-gray-300">—</span>
                          }
                          return (
                            <div className="flex items-center gap-1">
                              {/* Edit icon — opens the status edit modal */}
                              <button
                                onClick={() => openEdit(b)}
                                title="Edit booking status"
                                aria-label="Edit booking status"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:bg-primary-100 transition-all will-change-transform hover:scale-110 active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary-400"
                              >
                                <Edit2 size={15} />
                              </button>
                              {/* Cancel icon — only when not already cancelled */}
                              {status !== 'cancelled' && (
                                <button
                                  onClick={() => setCancelModal(b)}
                                  title="Cancel booking"
                                  aria-label="Cancel booking"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-all will-change-transform hover:scale-110 active:scale-90 focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                  <XCircle size={15} />
                                </button>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bookings.length === 0 && (
              <div className="py-14 text-center">
                <CheckCircle2 size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No bookings match your filters.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Status Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative bg-white rounded-xl border border-gray-200 shadow-md w-full max-w-sm p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Edit Booking</h3>
              <button onClick={closeEdit} aria-label="Close" className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-0.5">
              <p><span className="font-semibold text-gray-800">{editModal.user_name}</span></p>
              <p>{editModal.facility_name} · {editModal.booking_date} · {editModal.booking_time_slot}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status <span className="text-red-400">*</span></label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm hover:border-primary-300 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {editStatus === 'cancelled' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cancel Reason <span className="text-red-400">*</span></label>
                <textarea
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Facility maintenance scheduled"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm hover:border-primary-300 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none text-gray-900 placeholder-gray-300"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={confirmEdit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 will-change-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={closeEdit}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal (quick cancel from XCircle) */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setCancelModal(null); setCancelReason('') }} />
          <div className="relative bg-white rounded-xl border border-gray-200 shadow-md w-full max-w-sm p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Cancel Booking</h3>
              <button onClick={() => { setCancelModal(null); setCancelReason('') }} aria-label="Close" className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Cancelling <strong>{cancelModal.facility_name}</strong> for <strong>{cancelModal.user_name}</strong> on {cancelModal.booking_date}.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason <span className="text-red-400">*</span></label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                placeholder="e.g. Facility maintenance scheduled"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm hover:border-red-300 dark:hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition resize-none text-gray-900 placeholder-gray-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmCancel}
                disabled={submitting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 will-change-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {submitting ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => { setCancelModal(null); setCancelReason('') }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Keep It
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
