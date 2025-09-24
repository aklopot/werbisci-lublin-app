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
      <div className="dialog" style={{ width: 900, maxWidth: '95vw' }}>
        <div className="dialog-header">
          <h3>Podgląd etykiet 3×7</h3>
        </div>
        <div className="dialog-body" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
          <form onSubmit={e => { e.preventDefault(); loadPreview() }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600 }}>Rozmiar czcionki (8-24)</span>
                <input className="input" type="number" min={8} max={24} step={1} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" type="submit" disabled={!canSubmit || loading}>Generuj etykiety</button>
                <button className="btn" type="button" onClick={onPrint} disabled={!blobUrl}>Drukuj</button>
                <button className="btn primary" type="button" onClick={onSavePdf} disabled={!canSubmit}>Zapisz PDF</button>
              </div>
              <div style={{ fontSize: 13, color: '#555' }}>
                Uwaga: Generowane są tylko rekordy oznaczone jako „etykieta”.
              </div>
              {error && <div className="error">{error}</div>}
            </div>
          </form>
          <div style={{ border: '1px solid #ddd', minHeight: 600 }}>
            {loading ? (
              <div style={{ padding: 16 }}>Ładowanie podglądu…</div>
            ) : blobUrl ? (
              <iframe ref={iframeRef} title="Podgląd PDF" src={blobUrl} style={{ width: '100%', height: 600, border: 0 }} />
            ) : (
              <div style={{ padding: 16 }}>Brak podglądu</div>
            )}
          </div>
        </div>
        <div className="dialog-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={onClose}>Zamknij</button>
        </div>
      </div>
    </div>
  )
}

export default LabelsPreview


