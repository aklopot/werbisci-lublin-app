import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type MenuItem = {
  id?: string
  label: string
  onSelect: () => void
  disabled?: boolean
}

type MenuGroup = {
  label?: string
  items: MenuItem[]
}

interface DropdownMenuProps {
  buttonLabel: string
  buttonAriaLabel?: string
  groups: MenuGroup[]
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ buttonLabel, buttonAriaLabel, groups }) => {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const focusableItemsRef = useRef<HTMLButtonElement[]>([])

  const flatItems = useMemo(() => groups.flatMap(g => g.items), [groups])

  const closeMenu = useCallback(() => {
    setOpen(false)
    // return focus to the toggle button for accessibility
    requestAnimationFrame(() => buttonRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current && !panelRef.current.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    // Collect focusable menu items for keyboard navigation
    const buttons = Array.from(panelRef.current?.querySelectorAll('button[role="menuitem"]') ?? []) as HTMLButtonElement[]
    focusableItemsRef.current = buttons
    // Focus the first enabled item by default
    const first = buttons.find(b => !b.disabled)
    first?.focus()
  }, [open, groups])

  const onKeyDownPanel = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = focusableItemsRef.current
    const active = document.activeElement as HTMLButtonElement | null
    const currentIndex = active ? items.indexOf(active) : -1
    if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (currentIndex + 1 + items.length) % items.length
      items[nextIndex]?.focus()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = (currentIndex - 1 + items.length) % items.length
      items[prevIndex]?.focus()
    }
    if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    }
    if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    }
  }, [closeMenu])

  return (
    <div className="dropdown" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        className="btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={buttonAriaLabel || buttonLabel}
        onClick={() => setOpen(v => !v)}
      >
        {buttonLabel}
        <span aria-hidden style={{ marginLeft: 8 }}>▾</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="menu-panel"
          role="menu"
          aria-label={buttonAriaLabel || buttonLabel}
          onKeyDown={onKeyDownPanel}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            minWidth: 320,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(16, 24, 40, 0.18)',
            padding: 8,
            zIndex: 100,
          }}
        >
          {groups.map((group, gi) => (
            <div key={gi} className="menu-group" style={{ padding: 6 }}>
              {group.label && (
                <div className="menu-group-label" style={{
                  fontWeight: 800,
                  fontSize: '18px',
                  color: 'var(--muted)',
                  padding: '6px 10px',
                }}>{group.label}</div>
              )}
              <div>
                {group.items.map((item, ii) => (
                  <button
                    key={item.id || `${gi}-${ii}`}
                    role="menuitem"
                    className="menu-item"
                    disabled={item.disabled}
                    onClick={() => {
                      item.onSelect()
                      setOpen(false)
                    }}
                    style={{
                      appearance: 'none',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: '1px solid transparent',
                      padding: '14px 16px',
                      borderRadius: 12,
                      fontSize: '20px',
                      minHeight: 52,
                      cursor: 'pointer',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        item.onSelect()
                        setOpen(false)
                      }
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {gi < groups.length - 1 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DropdownMenu


