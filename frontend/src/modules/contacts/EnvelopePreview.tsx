import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchBlob } from '../../app/api'

interface Props {
  addressId: number | null
  open: boolean
  onClose: () => void
}

export const EnvelopePreview: React.FC<Props> = ({ addressId, open, onClose }) => {
  const [bold, setBold] = useState(true) // default: bold ON
  const [fontSize, setFontSize] = useState(14)
  const [format, setFormat] = useState<'A4' | 'C6'>('C6')
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const prevUrlRef = useRef<string | null>(null)

  const canSubmit = useMemo(
    () => Boolean(addressId) && fontSize >= 10 && fontSize <= 36,
    [addressId, fontSize]
  )

  const buildPath = useCallback(() => {
    if (!addressId) return ''
    const params = new URLSearchParams({ bold: String(bold), font_size: String(fontSize), format })
    return `/api/print/envelope/${addressId}?${params.toString()}`
  }, [addressId, bold, fontSize, format])

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

  // Initial load when dialog opens
  useEffect(() => {
    if (open) void loadPreview()
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
        prevUrlRef.current = null
      }
    }
  }, [open])

  // Auto refresh preview on parameter change (bold / fontSize / addressId)
  useEffect(() => {
    if (!open) return
    if (!canSubmit) return
    // small debounce to avoid rapid reload during fast typing
    const handle = setTimeout(() => {
      void loadPreview()
    }, 250)
    return () => clearTimeout(handle)
  }, [bold, fontSize, format, addressId, canSubmit, open, loadPreview])

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
      a.download = `envelope-${addressId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err?.message ?? 'Błąd zapisu PDF')
    }
  }, [addressId, buildPath])

  if (!open) return null

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" style={{ alignItems: 'center' }}>
      <div className="dialog" style={{ width: 1200, maxWidth: '95vw', height: 'auto', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header with title and close button */}
        <div className="dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Podgląd wydruku - Koperta</h3>
          <button 
            className="btn" 
            onClick={onClose}
            style={{ 
              padding: '6px 12px', 
              fontSize: '13px',
              minHeight: 'unset',
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
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafbfc', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>Format:</span>
              <select
                value={format}
                onChange={e => setFormat(e.target.value as 'A4' | 'C6')}
                style={{ padding: '4px 6px', fontSize: '13px', minHeight: 'unset' }}
              >
                <option value="A4">Dokument A4</option>
                <option value="C6">Koperta C6 (114×162 mm)</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={bold}
                onChange={e => setBold(e.target.checked)}
                style={{ transform: 'scale(1.0)' }}
              />
              <span style={{ fontWeight: 500, fontSize: '13px' }}>Pogrubienie</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>Rozmiar czcionki:</span>
              <input
                className="input"
                type="number"
                min={10}
                max={36}
                step={1}
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                style={{ width: 60, padding: '4px 6px', fontSize: '13px', minHeight: 'unset' }}
              />
            </label>
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              <button
                className="btn"
                type="button"
                onClick={onPrint}
                disabled={!blobUrl}
                style={{ padding: '5px 10px', fontSize: '13px', minHeight: 'unset' }}
              >
                Drukuj
              </button>
              <button
                className="btn primary"
                type="button"
                onClick={onSavePdf}
                disabled={!canSubmit}
                style={{ padding: '5px 10px', fontSize: '13px', minHeight: 'unset' }}
              >
                Zapisz PDF
              </button>
            </div>
          </div>
          {error && <div className="error" style={{ marginTop: 6, padding: '4px 8px', fontSize: '12px' }}>{error}</div>}
        </div>

        {/* Preview area with proper scaling */}
        <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#f5f5f5', padding: '6px', minHeight: 0 }}>
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
                fontSize: '13px',
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
                  minHeight: '400px'
                }} 
              />
            ) : (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '13px',
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

export default EnvelopePreview


