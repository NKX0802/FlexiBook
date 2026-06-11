import { useState, useRef, useEffect } from 'react'
import { Search, SlidersHorizontal, Building2, ChevronDown, Check } from 'lucide-react'
import FacilityCard from '@/components/FacilityCard'
import { FACILITIES, FAVOURITES } from '@/lib/fakeData'

const TYPE_OPTIONS = [
  { value: 'all',       label: 'All Types',  dot: 'bg-gray-400'    },
  { value: 'room',      label: 'Room',        dot: 'bg-blue-500'    },
  { value: 'court',     label: 'Court',       dot: 'bg-orange-500'  },
  { value: 'equipment', label: 'Equipment',   dot: 'bg-purple-500'  },
]

const STATUS_OPTIONS = [
  { value: 'all',    label: 'All Status', dot: 'bg-gray-400'    },
  { value: 'open',   label: 'Open',       dot: 'bg-emerald-500' },
  { value: 'closed', label: 'Closed',     dot: 'bg-red-500'     },
]

function CustomSelect({ value, onChange, options, minWidth = 'min-w-40' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${minWidth} w-full sm:w-auto`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-emerald-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dot}`} />
        <span className="flex-1 text-left truncate">{selected.label}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl border border-gray-100 shadow-xl z-30 overflow-hidden py-1.5 min-w-full">
          {options.map(opt => {
            const isActive = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all duration-100 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                <span className="font-medium flex-1 text-left">{opt.label}</span>
                {isActive && <Check size={14} className="text-emerald-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FacilitiesPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [favourites, setFavourites] = useState(FAVOURITES.map(f => f.facility_id))

  function toggleFavourite(id) {
    setFavourites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const filtered = FACILITIES.filter(f => {
    const matchSearch = f.facility_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.facility_type || '').toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || f.facility_type === typeFilter
    const matchStatus = statusFilter === 'all' || f.facility_status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  return (
    <div className="min-h-screen bg-green-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Facilities
          </h1>
          <p className="text-sm text-gray-500 mt-1">Browse and book campus rooms, courts, and equipment</p>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search facilities…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-gray-900 placeholder-gray-300"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal size={15} className="text-gray-400 shrink-0 hidden sm:block" />
            <CustomSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPE_OPTIONS}
              minWidth="sm:min-w-44"
            />
          </div>

          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            minWidth="sm:min-w-36"
          />
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-400 mb-4">
          Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {FACILITIES.length} facilities
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map(f => (
              <FacilityCard
                key={f.facility_id}
                facility={f}
                isFavourited={favourites.includes(f.facility_id)}
                onToggleFavourite={toggleFavourite}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Building2 size={28} className="text-gray-300" />
            </div>
            <h3 className="font-semibold text-gray-500 mb-1">No facilities found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all') }}
              className="mt-4 px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 active:bg-emerald-200 transition-all will-change-transform hover:scale-105 active:scale-95"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
