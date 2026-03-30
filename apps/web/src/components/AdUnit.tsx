'use client'
// @ts-nocheck
import { useEffect, useRef } from 'react'

interface AdUnitProps {
  slot: string
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  style?: React.CSSProperties
  className?: string
}

const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'

export default function AdUnit({ slot, format = 'auto', style, className }: AdUnitProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
        const script = document.createElement('script')
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
        script.async = true
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
      }

      setTimeout(() => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({})
        } catch {
          // AdSense not loaded yet — OK in dev or before approval
        }
      }, 200)
    } catch {
      // Silently ignore any AdSense errors
    }
  }, [])

  // In development: show a labelled placeholder so placement is visible
  if (process.env.NODE_ENV === 'development') {
    const height = format === 'rectangle' ? 250 : 90
    return (
      <div
        style={{
          background: 'rgba(201,168,76,0.07)',
          border: '1px dashed rgba(201,168,76,0.25)',
          borderRadius: 8,
          padding: '10px 16px',
          textAlign: 'center',
          color: '#4a5568',
          fontSize: '0.75rem',
          minHeight: height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          ...style,
        }}
        className={className}
      >
        <span style={{ fontSize: '1rem' }}>📢</span>
        <span>Ad unit — {format}</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>slot: {slot}</span>
      </div>
    )
  }

  return (
    <div style={style} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
