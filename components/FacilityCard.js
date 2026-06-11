import Link from 'next/link'
import { Heart } from 'lucide-react'
import StatusBadge from './StatusBadge'
import toast from 'react-hot-toast'

const TYPE_COLORS = {
  room:      'bg-blue-100 text-blue-700',
  court:     'bg-orange-100 text-orange-700',
  equipment: 'bg-purple-100 text-purple-700',
}

export default function FacilityCard({ facility, isFavourited = false, onToggleFavourite }) {
  const typeColor = TYPE_COLORS[facility.facility_type] || 'bg-gray-100 text-gray-700'

  function handleFavourite(e) {
    e.preventDefault()
    e.stopPropagation()
    if (onToggleFavourite) onToggleFavourite(facility.facility_id)
    if (isFavourited) {
      toast('Removed from favourites', { icon: '💔' })
    } else {
      toast.success('Added to favourites!')
    }
  }

  return (
    <Link href={`/facilities/${facility.facility_id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-shadow duration-300 hover:shadow-xl cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden h-44">
          <img
            src={facility.facility_image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'}
            alt={facility.facility_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Favourite button */}
          <button
            onClick={handleFavourite}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-colors duration-200 ${
              isFavourited
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white/80 text-gray-400 hover:text-red-500'
            }`}
            aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Heart size={16} className={isFavourited ? 'fill-current' : ''} />
          </button>

          {/* Status badge overlay */}
          <div className="absolute bottom-3 left-3">
            <StatusBadge status={facility.facility_status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-emerald-700 transition-colors">
            {facility.facility_name}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${typeColor}`}>
              {facility.facility_type}
            </span>
            <span className="text-xs text-gray-500">
              Up to {facility.facility_capacity}
            </span>
          </div>

          {facility.facility_description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-auto">
              {facility.facility_description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
