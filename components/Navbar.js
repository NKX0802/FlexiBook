import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Building2, LayoutDashboard, Bell, QrCode, Star,
  User, Menu, X, Shield, Sun, Moon, LogOut,
} from 'lucide-react'
import { useRole } from '@/lib/roleContext'
import { useTheme } from '@/lib/themeContext'
import { FAKE_STUDENT, FAKE_ADMIN } from '@/lib/fakeData'
import toast from 'react-hot-toast'

const STUDENT_LINKS = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/facilities',    label: 'Facilities',    icon: Building2 },
  { href: '/favourites',    label: 'Favourites',    icon: Star },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/checkin',       label: 'QR Check-in',   icon: QrCode },
]

export default function Navbar() {
  const { role, switchRole, logout } = useRole()
  const { dark, toggleTheme } = useTheme()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const navRef = useRef(null)

  function confirmLogout() {
    setShowLogoutConfirm(false)
    toast('Logged out. See you next time!', { icon: '👋' })
    setTimeout(() => logout(), 1000)
  }
  const currentUser = role === 'admin' ? FAKE_ADMIN : FAKE_STUDENT

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 12) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [router.pathname])

  useEffect(() => {
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setMobileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function NavLink({ href, label, icon: Icon }) {
    const active = router.pathname === href || router.pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        className={`relative flex items-center gap-1.5 text-sm font-medium px-1 py-0.5 transition-colors duration-200 group
          ${active ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}
      >
        <Icon size={15} className="shrink-0" />
        {label}
        <span className={`absolute -bottom-1 left-0 h-0.5 bg-emerald-600 rounded-full transition-all duration-300
          ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} />
      </Link>
    )
  }

  return (
    <>
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 transition-all duration-300 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors duration-200">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Campus<span className="text-emerald-600">Book</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {STUDENT_LINKS.map(link => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>

          {/* Right: theme toggle + role switcher + user chip */}
          <div className="hidden md:flex items-center gap-2">

            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Role switcher */}
            <div className="flex items-center bg-gray-100 rounded-full p-0.5 gap-0.5">
              <button
                onClick={() => switchRole('user')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  role === 'user' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User size={13} /> User
              </button>
              <button
                onClick={() => switchRole('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  role === 'admin' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield size={13} /> Admin
              </button>
            </div>

            {/* User chip */}
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 group"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {currentUser.user_name.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors max-w-24 truncate">
                {currentUser.user_name.split(' ')[0]}
              </span>
              <User size={12} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </Link>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Log out"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile right: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="p-2 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          {STUDENT_LINKS.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50 active:bg-emerald-50 active:text-emerald-700'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
              </Link>
            )
          })}

          {/* Mobile role switcher */}
          <div className="pt-3 mt-2 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Demo Role</p>
            <div className="flex gap-2">
              <button
                onClick={() => switchRole('user')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <User size={15} /> User
              </button>
              <button
                onClick={() => switchRole('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  role === 'admin' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <Shield size={15} /> Admin
              </button>
            </div>
          </div>

          {/* Mobile profile */}
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-emerald-50 transition-all duration-150"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">
              {currentUser.user_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{currentUser.user_name}</p>
              <p className="text-xs text-gray-400">{currentUser.user_email}</p>
            </div>
          </Link>

          {/* Mobile logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-all duration-150"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </nav>

    {showLogoutConfirm && (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <LogOut size={18} className="text-red-500" />
            </div>
            <button onClick={() => setShowLogoutConfirm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X size={16} />
            </button>
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Log out?
          </h3>
          <p className="text-sm text-gray-500 mb-5">You'll be redirected to the home page.</p>
          <div className="flex gap-3">
            <button
              onClick={confirmLogout}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Yes, log out
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
