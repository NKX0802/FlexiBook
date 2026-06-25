import { useState, useEffect, useRef } from 'react'
import {
  QrCode, CheckCircle2, XCircle, Camera, RefreshCw,
  Clock, AlertTriangle, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/AdminLayout'

export default function AdminQRScanPage() {
  const [scanning, setScanning] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [scanResult, setScanResult] = useState(null) // { success, error, message }
  const [cameraError, setCameraError] = useState(null)

  const scannerRef = useRef(null)

  // Stop scanner when component unmounts
  useEffect(() => {
    return () => {
      cleanupScanner()
    }
  }, [])

  async function cleanupScanner() {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
      } catch (err) {
        console.error('Error stopping scanner during cleanup:', err)
      } finally {
        scannerRef.current = null
      }
    }
  }

  async function startScanner() {
    setScanResult(null)
    setCameraError(null)
    setScanning(true)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      // Stop and clear previous scanner just in case
      await cleanupScanner()

      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7
            return { width: size, height: size }
          }
        },
        async (decodedText) => {
          // Found QR! Stop scanning immediately
          await cleanupScanner()
          setScanning(false)
          await handleVerify(decodedText)
        },
        (error) => {
          // Silent catch for scanning frame mismatches
        }
      )
    } catch (err) {
      console.error("Failed to initialize or start camera scanner:", err)
      setCameraError("Failed to access camera. Please check camera permissions in your browser settings.")
      setScanning(false)
    }
  }

  async function stopScanning() {
    await cleanupScanner()
    setScanning(false)
  }

  function reset() {
    setScanResult(null)
    setCameraError(null)
  }

  async function handleVerify(qrValue) {
    setVerifying(true)
    try {
      const res = await fetch('/api/checkin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrValue }),
      })

      const data = await res.json()
      setScanResult({
        success: data.success,
        error: data.error,
        message: data.message || 'Something went wrong.',
      })

      if (data.success) {
        toast.success(data.message || 'Checked in successfully!')
      } else {
        if (data.error === 'too_early') {
          toast(data.message, { icon: '⏰' })
        } else {
          toast.error(data.message)
        }
      }
    } catch (err) {
      console.error('Verify check-in error:', err)
      setScanResult({
        success: false,
        error: 'network_error',
        message: 'Something went wrong. Please try again.',
      })
      toast.error('Something went wrong. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <AdminLayout title="Scan QR">
      <div className="max-w-lg mx-auto">
        <p className="text-sm text-gray-500 mb-6">Scan a student's booking QR code to check them in</p>

        {/* Core Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">

          {/* 1. Normal/Ready state (Not scanning, No results) */}
          {!scanning && !verifying && !scanResult && (
            <>
              <div className="mx-auto w-52 h-52 mb-5 border-2 border-dashed border-emerald-200 rounded-2xl bg-gray-50 flex flex-col items-center justify-center gap-2">
                <QrCode size={48} className="text-emerald-500/70" />
                <p className="text-xs text-gray-400 font-medium">Ready to scan</p>
              </div>

              {cameraError ? (
                <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-medium">
                  {cameraError}
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-1">Point the camera at the booking QR code</p>
                  <p className="text-xs text-gray-400 mb-6">Check-in is valid within 15 minutes of the booking start time</p>
                </>
              )}

              <button
                onClick={startScanner}
                className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 will-change-transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Camera size={17} /> Start Camera Scanner
              </button>
            </>
          )}

          {/* 2. Scanning state */}
          {scanning && !verifying && !scanResult && (
            <div className="py-4">
              <div className="relative mx-auto w-full max-w-sm rounded-2xl overflow-hidden shadow-inner bg-black aspect-square mb-5">
                <div id="qr-reader" className="w-full h-full" />
              </div>
              <p className="text-sm font-semibold text-gray-700 animate-pulse">Scanning booking QR code…</p>
              <p className="text-xs text-gray-400 mt-1 mb-6">Align the QR code within the scanner frame</p>

              <button
                onClick={stopScanning}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
            </div>
          )}

          {/* 3. Verifying (loading) state */}
          {verifying && (
            <div className="py-12">
              <Loader2 size={36} className="animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-700">Verifying check-in…</p>
              <p className="text-xs text-gray-400 mt-1">Please wait while we check the bookings</p>
            </div>
          )}

          {/* 4. Scan Result state */}
          {scanResult && !verifying && (
            <div className="py-4">
              {scanResult.success ? (
                // Success Case
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 size={32} className="text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-emerald-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Check-in Successful!
                  </h2>
                  <p className="text-sm text-gray-600 mb-6 px-4">
                    {scanResult.message}
                  </p>
                </>
              ) : (
                // Error / Warning Cases
                <>
                  {scanResult.error === 'too_early' ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <Clock size={32} className="text-amber-600" />
                      </div>
                      <h2 className="text-xl font-bold text-amber-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        Too Early
                      </h2>
                    </>
                  ) : scanResult.error === 'no_show_late' || scanResult.error === 'already_no_show' ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                      </div>
                      <h2 className="text-xl font-bold text-red-600 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        Check-in Expired
                      </h2>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <XCircle size={32} className="text-red-500" />
                      </div>
                      <h2 className="text-xl font-bold text-red-600 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        Check-in Failed
                      </h2>
                    </>
                  )}
                  <p className="text-sm text-gray-600 mb-6 px-4">
                    {scanResult.message}
                  </p>
                </>
              )}

              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <RefreshCw size={15} /> Scan Again
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
