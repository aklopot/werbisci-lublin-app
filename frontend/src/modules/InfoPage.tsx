import React, { useEffect, useState } from 'react'
import { PageHeader } from '../app/ui/PageHeader'

interface VersionInfo {
  version: string
  commit: string
  buildDate: string
}

export const InfoPage: React.FC = () => {
  const [backendVersion, setBackendVersion] = useState<VersionInfo | null>(null)
  const [frontendVersion, setFrontendVersion] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVersions = async () => {
      try {
        // Load backend version
        const backendRes = await fetch('/api/version')
        if (backendRes.ok) {
          const backendData = await backendRes.json()
          setBackendVersion(backendData)
        }

        // Load frontend version
        const frontendRes = await fetch('/version.json')
        if (frontendRes.ok) {
          const frontendData = await frontendRes.json()
          setFrontendVersion(frontendData)
        }
      } catch (error) {
        console.error('Error loading version info:', error)
      } finally {
        setLoading(false)
      }
    }

    loadVersions()
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
              System zarządzania bazą kontaktów dla Misjonarzy Werbistów w Lublinie.
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
            Informacje o wersji
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
              Ładowanie...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Backend Version */}
              {backendVersion && (
                <div style={{ 
                  backgroundColor: '#fff', 
                  padding: 20, 
                  borderRadius: 8,
                  border: '1px solid #dee2e6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    marginBottom: 12, 
                    color: '#495057',
                    borderBottom: '2px solid #007bff',
                    paddingBottom: 8
                  }}>
                    Backend
                  </h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, color: '#6c757d' }}>Wersja:</span>
                      <span style={{ fontFamily: 'monospace', color: '#212529' }}>
                        {backendVersion.version}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, color: '#6c757d' }}>Commit:</span>
                      <span style={{ fontFamily: 'monospace', color: '#212529', fontSize: '0.9em' }}>
                        {backendVersion.commit}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, color: '#6c757d' }}>Data budowy:</span>
                      <span style={{ color: '#212529', fontSize: '0.9em' }}>
                        {formatDate(backendVersion.buildDate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Frontend Version */}
              {frontendVersion && (
                <div style={{ 
                  backgroundColor: '#fff', 
                  padding: 20, 
                  borderRadius: 8,
                  border: '1px solid #dee2e6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    marginBottom: 12, 
                    color: '#495057',
                    borderBottom: '2px solid #28a745',
                    paddingBottom: 8
                  }}>
                    Frontend
                  </h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, color: '#6c757d' }}>Wersja:</span>
                      <span style={{ fontFamily: 'monospace', color: '#212529' }}>
                        {frontendVersion.version}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, color: '#6c757d' }}>Commit:</span>
                      <span style={{ fontFamily: 'monospace', color: '#212529', fontSize: '0.9em' }}>
                        {frontendVersion.commit}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, color: '#6c757d' }}>Data budowy:</span>
                      <span style={{ color: '#212529', fontSize: '0.9em' }}>
                        {formatDate(frontendVersion.buildDate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Docker Image Tag Info */}
              {(backendVersion || frontendVersion) && (
                <div style={{ 
                  backgroundColor: '#e7f3ff', 
                  padding: 16, 
                  borderRadius: 8,
                  border: '1px solid #b3d9ff',
                  marginTop: 8
                }}>
                  <p style={{ margin: 0, fontSize: '0.9em', color: '#004085', lineHeight: 1.5 }}>
                    <strong>Tag obrazu Docker:</strong>{' '}
                    <code style={{ 
                      backgroundColor: 'white', 
                      padding: '2px 6px', 
                      borderRadius: 4,
                      fontFamily: 'monospace'
                    }}>
                      {backendVersion?.version || frontendVersion?.version}-
                      {backendVersion?.commit || frontendVersion?.commit}
                    </code>
                  </p>
                </div>
              )}
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

