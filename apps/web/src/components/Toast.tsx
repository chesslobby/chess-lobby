'use client'
import { useState, useEffect } from 'react'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

let toastId = 0
const listeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: Toast['type'] = 'info') {
  const toast: Toast = { id: ++toastId, message, type }
  listeners.forEach(l => l(toast))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 3000)
    }
    listeners.push(handler)
    return () => {
      const i = listeners.indexOf(handler)
      if (i > -1) listeners.splice(i, 1)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
      <div style={{ position:'fixed', top:'80px', right:'20px', zIndex:9999, display:'flex', flexDirection:'column', gap:'8px', pointerEvents:'none' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            padding: '12px 20px',
            borderRadius: '8px',
            color: '#fff',
            fontFamily: 'var(--font-crimson), Georgia, serif',
            fontSize: '0.9rem',
            minWidth: '250px',
            maxWidth: '360px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'slideInToast 0.3s ease',
            background: toast.type === 'success' ? '#1e6640' :
                        toast.type === 'error'   ? '#8b1a1a' :
                        toast.type === 'warning' ? '#b85c00' : '#1a2e4a',
            border: `1px solid ${
              toast.type === 'success' ? '#2d9960' :
              toast.type === 'error'   ? '#c9353e' :
              toast.type === 'warning' ? '#c9a84c' : '#c9a84c'
            }`,
          }}>
            {toast.type === 'success' ? '✅ ' :
             toast.type === 'error'   ? '❌ ' :
             toast.type === 'warning' ? '⚠️ ' : 'ℹ️ '}
            {toast.message}
          </div>
        ))}
      </div>
    </>
  )
}
