import { useRef, useState } from 'react'
import { Upload, Loader2, X } from 'lucide-react'
import { upload } from '../api.js'

export default function ImageUpload({ value, onChange, className = '' }) {
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)

  const pick = () => inputRef.current?.click()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const res = await upload(file)
    setLoading(false)
    if (res.code === 200 && res.data?.url) {
      onChange(res.data.url)
    } else {
      alert(res.msg || '上传失败')
    }
  }

  return (
    <div className={className}>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="preview" className="w-24 h-24 object-cover rounded-xl border border-ink-200" />
          <button onClick={() => onChange('')} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-ink-800 text-white rounded-full flex items-center justify-center">
            <X size={12} />
          </button>
        </div>
      ) : (
        <button onClick={pick} disabled={loading}
          className="w-24 h-24 rounded-xl border-2 border-dashed border-ink-300 flex flex-col items-center justify-center text-ink-500 hover:border-brand-400 hover:text-brand-500"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <><Upload size={18} /><span className="text-[10px] mt-1">上传图片</span></>}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  )
}
