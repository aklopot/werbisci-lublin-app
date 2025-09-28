import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchBlob } from '../../app/api'

interface Props {
  open: boolean
  onClose: () => void
}

export const LabelsPreview: React.FC<Props> = ({ open, onClose }) => {
  const [fontSize, setFontSize] = useState(11)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const prevUrlRef = useRef<string | null>(null)

  const canSubmit = useMemo(() => fontSize >= 8 && fontSize <= 24, [fontSize])

  const buildPath = useCallback(() => {
    const params = new URLSearchParams({ font_size: String(fontSize) })
    return `/api/print/labels?${params.toString()}`
  }, [fontSize])

  const loadPreview = useCallback(async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const blob = await fetchBlob(buildPath(), { method: 'GET' })
      const url = URL.createObjectURL(blob)
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = url
      setBlobUrl(url)
    } catch (err: any) {
      setError(err?.message ?? 'Błąd pobierania PDF')
    } finally {
      setLoading(false)
    }
  }, [buildPath, canSubmit])

  useEffect(() => {
    if (open) {
      void loadPreview()
    }
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
        prevUrlRef.current = null
      }
    }
  }, [open])

  const onPrint = useCallback(() => {
    const iframe = iframeRef.current
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    }
  }, [])

  const onSavePdf = useCallback(async () => {
    try {
      const blob = await fetchBlob(buildPath(), { method: 'GET' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `labels-3x7.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err?.message ?? 'Błąd zapisu PDF')
    }
  }, [buildPath])

  if (!open) return null

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog" style={{ width: 1200, maxWidth: '95vw', height: '85vh' }}>
        {/* Header with title and close button */}
        <div className="dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Podgląd etykiet 3×7</h3>
          <button 
            className="btn" 
            onClick={onClose}
            style={{ 
              padding: '8px 16px', 
              fontSize: '14px',
              border: '1px solid #dc3545',
              borderRadius: '4px',
              backgroundColor: '#dc3545',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Zamknij
          </button>
        </div>
        
        {/* Compact controls */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafbfc' }}>
          <form onSubmit={e => { e.preventDefault(); loadPreview() }} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>Rozmiar czcionki:</span>
              <input 
                className="input" 
                type="number" 
                min={8} 
                max={24} 
                step={1} 
                value={fontSize} 
                onChange={e => setFontSize(Number(e.target.value))}
                style={{ width: 60, padding: '4px 6px', fontSize: '13px' }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button 
                className="btn" 
                type="submit" 
                disabled={!canSubmit || loading}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                {loading ? 'Ładowanie...' : 'Generuj etykiety'}
              </button>
              <button 
                className="btn" 
                type="button" 
                onClick={onPrint} 
                disabled={!blobUrl}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Drukuj
              </button>
              <button 
                className="btn primary" 
                type="button" 
                onClick={onSavePdf} 
                disabled={!canSubmit}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Zapisz PDF
              </button>
            </div>
          </form>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
            Uwaga: Generowane są tylko rekordy oznaczone jako „etykieta".
          </div>
          {error && <div className="error" style={{ marginTop: 8, padding: '6px 10px', fontSize: '13px' }}>{error}</div>}
        </div>

        {/* Preview area with proper scaling */}
        <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#f5f5f5', padding: '8px' }}>
          <div style={{ 
            height: '100%', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}>
            {loading ? (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '14px',
                color: '#666'
              }}>
                Ładowanie podglądu…
              </div>
            ) : blobUrl ? (
              <iframe 
                ref={iframeRef} 
                title="Podgląd PDF" 
                src={blobUrl} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 0,
                  borderRadius: '4px',
                  minHeight: '500px'
                }} 
              />
            ) : (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '14px',
                color: '#666'
              }}>
                Brak podglądu
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabelsPreview


