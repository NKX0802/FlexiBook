// API: POST /api/upload — receive a base64-encoded image, save to public/images/facilities/
// Returns: { success: true, url: '/images/facilities/filename.jpg' }
// Admin only

import fs from 'fs'
import path from 'path'
import { getUser } from '@/lib/auth'

// Increase body size limit to allow image uploads (up to 8 MB base64)
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' })
  }

  const admin = await getUser(req)
  if (!admin) return res.status(401).json({ success: false, error: 'Not logged in.' })
  if (admin.user_role !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required.' })

  const { image, filename } = req.body || {}
  if (!image || !filename) {
    return res.status(400).json({ success: false, error: 'Image data and filename are required.' })
  }

  // Validate base64 data URL
  const matches = image.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/)
  if (!matches) {
    return res.status(400).json({ success: false, error: 'Invalid image format. Use JPEG, PNG, WEBP, or GIF.' })
  }

  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  // Reject oversized images (5 MB decoded)
  if (buffer.byteLength > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, error: 'Image must be under 5 MB.' })
  }

  // Build a safe, unique filename
  const ext = path.extname(filename).toLowerCase() || '.jpg'
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const dir = path.join(process.cwd(), 'public', 'images', 'facilities')

  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, safeName), buffer)
    return res.status(200).json({ success: true, url: `/images/facilities/${safeName}` })
  } catch (err) {
    console.error('POST /api/upload error:', err)
    return res.status(500).json({ success: false, error: 'Failed to save image.' })
  }
}
