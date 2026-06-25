import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Edit2, Trash2, X, Building2, Users, Tag, CheckCircle2, ImagePlus, Upload, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/AdminLayout'
import StatusBadge from '@/components/StatusBadge'

const BLANK = { facility_name: '', facility_capacity: '', facility_type: 'room', facility_status: 'open', facility_description: '', facility_image_url: '' }

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)       // null | 'add' | 'edit'
  const [form, setForm] = useState(BLANK)
  const [imagePreview, setImagePreview] = useState(null)
  const [editId, setEditId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)  // facility object
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const fetchFacilities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/facilities')
      const data = await res.json()
      if (data.success) setFacilities(data.data)
      else toast.error(data.error || 'Failed to load facilities.')
    } catch {
      toast.error('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFacilities() }, [fetchFacilities])

  function openAdd() { setForm(BLANK); setImagePreview(null); setEditId(null); setModal('add') }
  function openEdit(f) {
    setForm({
      facility_name: f.facility_name,
      facility_capacity: f.facility_capacity,
      facility_type: f.facility_type || 'room',
      facility_status: f.facility_status,
      facility_description: f.facility_description || '',
      facility_image_url: f.facility_image_url || '',
    })
    setImagePreview(f.facility_image_url || null)
    setEditId(f.facility_id)
    setModal('edit')
  }
  function closeModal() { setModal(null); setImagePreview(null) }

  async function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return }

    // Show a local preview immediately
    const localPreview = URL.createObjectURL(file)
    setImagePreview(localPreview)

    // Upload to the server and get a real URL
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: ev.target.result, filename: file.name }),
          })
          const data = await res.json()
          if (data.success) {
            setForm(f => ({ ...f, facility_image_url: data.url }))
            toast.success('Image uploaded!')
          } else {
            toast.error(data.error || 'Upload failed.')
            clearImage()
          }
        } catch {
          toast.error('Upload failed.')
          clearImage()
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error('Could not read file.')
      setUploading(false)
    }
  }

  function clearImage() {
    setImagePreview(null)
    setForm(f => ({ ...f, facility_image_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    if (uploading) { toast.error('Please wait for the image to finish uploading.'); return }
    if (!form.facility_name.trim()) { toast.error('Facility name is required.'); return }
    if (!form.facility_capacity || Number(form.facility_capacity) < 1) { toast.error('A valid capacity is required.'); return }

    setSaving(true)
    try {
      const method = modal === 'add' ? 'POST' : 'PUT'
      const url = modal === 'add' ? '/api/admin/facilities' : `/api/admin/facilities?id=${editId}`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, facility_capacity: Number(form.facility_capacity) }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(modal === 'add' ? `"${form.facility_name}" added!` : 'Facility updated!')
        closeModal()
        fetchFacilities()
      } else {
        toast.error(data.error || 'Failed to save facility.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/facilities?id=${deleteConfirm.facility_id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast(`"${deleteConfirm.facility_name}" deleted.`, { icon: '🗑️' })
        setDeleteConfirm(null)
        fetchFacilities()
      } else {
        toast.error(data.error || 'Failed to delete facility.')
        setDeleteConfirm(null)
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout title="Manage Facilities">

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{facilities.length} facilities total</p>
          <button onClick={fetchFacilities} title="Refresh" className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
            <RefreshCw size={14} />
          </button>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 will-change-transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Plus size={16} /> Add Facility
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={26} className="animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Facility', 'Type', 'Capacity', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {facilities.map(f => (
                  <tr key={f.facility_id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {f.facility_image_url ? (
                          <img src={f.facility_image_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <Building2 size={16} className="text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{f.facility_name}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{f.facility_description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-gray-100 text-gray-600">
                        <Tag size={10} /> {f.facility_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-gray-700">
                        <Users size={13} className="text-gray-400" /> {f.facility_capacity}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={f.facility_status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(f)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-all will-change-transform hover:scale-110 active:scale-90 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(f)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all will-change-transform hover:scale-110 active:scale-90 focus:outline-none focus:ring-2 focus:ring-red-400"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {facilities.length === 0 && (
            <div className="py-16 text-center">
              <Building2 size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No facilities yet. Add one above.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 flex flex-col"
            style={{ maxHeight: 'min(90vh, 680px)' }}>

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {modal === 'add' ? 'Add Facility' : 'Edit Facility'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 pb-4 pt-5">
              <div className="space-y-5">

                {/* Image upload from device */}
                <Field label="Facility image">
                  {imagePreview ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 text-white text-xs font-semibold">
                          <Loader2 size={16} className="animate-spin" /> Uploading…
                        </div>
                      )}
                      {!uploading && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-all"
                          >
                            <Upload size={12} /> Replace
                          </button>
                          <button
                            type="button"
                            onClick={clearImage}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-all"
                          >
                            <X size={12} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                    >
                      <ImagePlus size={26} />
                      <div className="text-center">
                        <p className="text-xs font-semibold">Click to upload image</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">PNG, JPG, WEBP — max 5 MB</p>
                      </div>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </Field>

                <Field label="Facility name" required>
                  <input type="text" value={form.facility_name}
                    onChange={e => setForm(f => ({ ...f, facility_name: e.target.value }))}
                    placeholder="e.g. Discussion Room C" className="input-base" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Type">
                    <select value={form.facility_type}
                      onChange={e => setForm(f => ({ ...f, facility_type: e.target.value }))}
                      className="input-base">
                      <option value="room">Room</option>
                      <option value="court">Court</option>
                      <option value="equipment">Equipment</option>
                    </select>
                  </Field>
                  <Field label="Capacity" required>
                    <input type="number" min="1" value={form.facility_capacity}
                      onChange={e => setForm(f => ({ ...f, facility_capacity: e.target.value }))}
                      placeholder="e.g. 10" className="input-base" />
                  </Field>
                </div>

                <Field label="Status">
                  <select value={form.facility_status}
                    onChange={e => setForm(f => ({ ...f, facility_status: e.target.value }))}
                    className="input-base">
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </Field>

                <Field label="Description">
                  <textarea value={form.facility_description}
                    onChange={e => setForm(f => ({ ...f, facility_description: e.target.value }))}
                    rows={4} placeholder="Describe the facility…" className="input-base resize-none" />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 will-change-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {saving ? 'Saving…' : modal === 'add' ? 'Add Facility' : 'Save Changes'}
              </button>
              <button onClick={closeModal}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 will-change-transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Delete facility?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{deleteConfirm.facility_name}</strong>
            </p>
            <p className="text-xs text-gray-400 mb-5">This action cannot be undone. Facilities with existing bookings cannot be deleted — close them instead.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 will-change-transform hover:scale-105 active:scale-95 disabled:opacity-60 transition-all focus:outline-none focus:ring-2 focus:ring-red-500">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          padding: 0.7rem 0.9rem;
          border-radius: 0.75rem;
          border: 1.5px solid #e5e7eb;
          font-size: 0.875rem;
          color: #111827;
          background: #ffffff;
          outline: 2px solid transparent;
          outline-offset: 2px;
          transition: border-color 0.15s, outline-color 0.15s;
          font-family: Outfit, sans-serif;
        }
        .input-base:focus {
          border-color: #059669;
          outline-color: #059669;
          outline-width: 2px;
        }
      `}</style>
    </AdminLayout>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
