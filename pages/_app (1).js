import '@/styles/globals.css'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { RoleProvider, useRole } from '@/lib/roleContext'
import { ThemeProvider } from '@/lib/themeContext'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/router'

function AppContent({ Component, pageProps }) {
  const router = useRouter()
  const { role } = useRole()
  const isAdminPage = router.pathname.startsWith('/admin')
  const isHomePage = router.pathname === '/'
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register'

  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => { setHasMounted(true) }, [])
  useEffect(() => {
    if (!hasMounted) return
    if (isAdminPage && role !== 'admin') {
      router.replace('/403')
    }
  }, [hasMounted, role, isAdminPage])

  return (
    <>
      {!isAdminPage && !isHomePage && !isAuthPage && <Navbar />}
      <main>
        <Component {...pageProps} />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />
    </>
  )
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <RoleProvider>
        <AppContent Component={Component} pageProps={pageProps} />
      </RoleProvider>
    </ThemeProvider>
  )
}
