import React, { useEffect, useState } from 'react'
import { PageHeader } from '../app/ui/PageHeader'

interface VersionInfo {
  version: string
  buildDate: string
}

export const InfoPage: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVersion = async () => {
      try {
        // Load version from backend API
        const res = await fetch('/api/version')
        if (res.ok) {
          const data = await res.json()
          setVersionInfo(data)
        }
      } catch (error) {
        console.error('Error loading version info:', error)
      } finally {
        setLoading(false)
      }
    }

    loadVersion()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'unknown') return 'Nieznana'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div>
      <PageHeader title="Informacje" />
      
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        {/* About Section */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: '#333' }}>
            O aplikacji
          </h2>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: 24, 
            borderRadius: 8,
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 12, color: '#495057' }}>
              Baza Kontaktów
            </h3>
            <p style={{ lineHeight: 1.6, color: '#6c757d', marginBottom: 12 }}>
              System zarządzania bazą kontaktów dla <strong>Misjonarzy Werbistów w Lublinie</strong>.
            </p>
            <p style={{ lineHeight: 1.6, color: '#6c757d' }}>
              Aplikacja umożliwia zarządzanie danymi kontaktowymi, generowanie etykiet 
              oraz kopert, a także eksport danych w różnych formatach.
            </p>
          </div>
        </section>

        {/* Version Information */}
        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: '#333' }}>
            Wersja aplikacji
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
              Ładowanie...
            </div>
          ) : versionInfo ? (
            <div style={{ 
              backgroundColor: '#fff', 
              padding: 24, 
              borderRadius: 8,
              border: '1px solid #dee2e6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 20 
              }}>
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  color: '#007bff',
                  fontFamily: 'monospace'
                }}>
                  v{versionInfo.version}
                </div>
              </div>
              
              <div style={{ 
                textAlign: 'center',
                paddingTop: 20,
                borderTop: '1px solid #dee2e6'
              }}>
                <div style={{ color: '#6c757d', fontSize: '0.95em' }}>
                  Data budowy: {formatDate(versionInfo.buildDate)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: 40, 
              color: '#dc3545',
              backgroundColor: '#f8d7da',
              borderRadius: 8,
              border: '1px solid #f5c6cb'
            }}>
              Nie udało się pobrać informacji o wersji
            </div>
          )}
        </section>

        {/* Footer */}
        <footer style={{ 
          marginTop: 48, 
          paddingTop: 24, 
          borderTop: '1px solid #dee2e6',
          textAlign: 'center',
          color: '#6c757d',
          fontSize: '0.9em'
        }}>
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} Misjonarze Werbiści w Lublinie
          </p>
        </footer>
      </div>
    </div>
  )
}

