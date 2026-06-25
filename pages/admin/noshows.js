import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Bell, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/AdminLayout'

export default function AdminNoshowsPage() {
  const [stats, setStats]   = useState(null)
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [warning, setWarning]   = useState(null)  // user_id currently being warned
  const [warningSent, setWarningSent] = useState(null)  // track in-flight warn

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/admin/noshows')
      const data = await res.json()
      if (data.success) {
        setStats(data.data.stats)
        setReport(data.data.report)
      } else {
        setError(data.error || 'Failed to load report.')
      }
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReport() }, [fetchReport])

  async function sendWarning(user) {
    setWarning(user.user_id)
    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendTo: 'single',
          user_id: user.user_id,
          title: 'No-Show Warning',
          message: `You have been marked as no-show ${user.count} time${user.count !== 1 ? 's' : ''}. Repeated no-shows may restrict your ability to make future bookings. Please ensure you attend your booked sessions or cancel in advance.`,
          notification_type: 'no-show',
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Warning sent to ${user.user_name.split(' ')[0]}`)
        fetchReport()   // re-fetch so warned_today updates immediately
      } else {
        toast.error(data.error || 'Failed to send warning.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setWarning(null)
    }
  }

  const STAT_CARDS = stats ? [
    { label: 'Total No-Shows',  value: stats.totalNoShows,   color: 'text-red-600',   border: 'border-red-100'   },
    { label: 'Users Affected',  value: stats.usersAffected,  color: 'text-amber-600', border: 'border-amber-100' },
    { label: 'This Month',      value: stats.thisMonthCount, color: 'text-indigo-600',border: 'border-indigo-100'},
  ] : []

  if (loading) {
    return (
      <AdminLayout title="No-Show Report">
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="No-Show Report">
        <div className="flex items-center justify-center py-32">
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="No-Show Report">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {STAT_CARDS.map(({ label, value, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl border ${border} shadow-sm p-4`}>
            <p className={`text-2xl font-extrabold ${color}`} style={{ fontFamily: 'Nunito, sans-serif' }}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Report table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>Users with No-Shows</h2>
          <span className="text-xs text-gray-400">{report.length} user{report.length !== 1 ? 's' : ''}</span>
        </div>

        {report.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <p className="font-semibold text-gray-500">No no-shows recorded</p>
            <p className="text-xs text-gray-400 mt-1">Great attendance across all bookings!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {report.map(r => (
              <div key={r.user_id}>
                <div
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === r.user_id ? null : r.user_id)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm font-bold shrink-0">
                    {r.user_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{r.user_name}</p>
                    <p className="text-xs text-gray-400">{r.user_email} · Latest: {r.latest}</p>
                  </div>

                  {/* Count badge + warn button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      r.count >= 3 ? 'bg-red-100 text-red-700' : r.count >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <AlertCircle size={11} /> {r.count} no-show{r.count !== 1 ? 's' : ''}
                    </span>

                    <button
                      onClick={e => { e.stopPropagation(); sendWarning(r) }}
                      disabled={r.warned_today || warning === r.user_id}
                      title={r.warned_today ? 'Already warned today — can only warn once per day' : 'Send warning notification'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 will-change-transform focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                        r.warned_today
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : warning === r.user_id
                          ? 'bg-amber-50 text-amber-500 cursor-wait'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 hover:scale-105 active:scale-95'
                      }`}
                    >
                      {warning === r.user_id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Bell size={12} />}
                      {warning === r.user_id ? 'Sending…' : r.warned_today ? 'Warned today' : 'Warn'}
                    </button>
                  </div>
                </div>

                {/* Expanded: individual no-show bookings */}
                {expanded === r.user_id && (
                  <div className="bg-gray-50 px-5 py-3 space-y-2 border-t border-gray-100">
                    {r.bookings.map(b => (
                      <div key={b.booking_id} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-100 text-xs">
                        <AlertCircle size={13} className="text-red-400 shrink-0" />
                        <span className="font-medium text-gray-700">{b.facility_name}</span>
                        <span className="text-gray-400">{b.booking_date}</span>
                        <span className="text-gray-400">{b.booking_time_slot}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
