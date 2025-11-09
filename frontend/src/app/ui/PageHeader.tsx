import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="page-header pro" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 'var(--space-3)' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>{title}</h2>
        {subtitle && (
          <div style={{ color: 'var(--muted)', marginTop: 4 }}>{subtitle}</div>
        )}
      </div>
      <div className="page-actions" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        {actions}
      </div>
    </div>
  )
}

export default PageHeader


