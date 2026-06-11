import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard, Building2, Calendar, AlertCircle,
  Bell, User, ChevronLeft, ChevronRight, Building,
  Shield,
} from 'lucide-react'
import { useRole } from '@/lib/roleContext'

const ADMIN_LINKS = [
  { href: '/admin/dashboard',      label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/admin/facilities',     label: 'Manage Facilities', icon: Building2 },
  { href: '/admin/bookings',       label: 'Manage Bookings',   icon: Calendar },
  { href: '/admin/noshows',        label: 'No-Show Report',    icon: AlertCircle },
  { href: '/admin/notifications',  label: 'Notifications',     icon: Bell },
  { href: '/admin/profile',        label: 'My Profile',        icon: User },
]

export default function AdminSidebar() {
  const router = useRouter()
  const { switchRole } = useRole()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`hidden md:flex flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out shrink-0
      ${collapsed ? 'w-16' : 'w-60'}`}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-gray-800 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
          <Building size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Campus<span className="text-emerald-400">Book</span>
          </span>
        )}
      </div>

      {/* Admin label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Admin Panel</p>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
          const active = router.pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${collapsed ? 'justify-center' : ''}
                ${active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white active:bg-gray-700'
                }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Role switcher */}
      <div className={`px-2 py-3 border-t border-gray-800 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Demo Role</p>
        )}
        <button
          onClick={() => switchRole('user')}
          title={collapsed ? 'Switch to User' : undefined}
          className={`w-full flex items-center gap-2 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:bg-gray-800 hover:text-white active:bg-gray-700 transition-all duration-150
            ${collapsed ? 'justify-center px-0' : 'px-3'}`}
        >
          <User size={15} />
          {!collapsed && 'Switch to User'}
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="px-2 pb-4 border-t border-gray-800 pt-3">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-800 hover:text-white active:bg-gray-700 transition-all duration-150"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  )
}

