'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard' },
  { href: '/members',      label: 'Members' },
  { href: '/payments',     label: 'Payments' },
  { href: '/slips',        label: 'Payment Slips' },
  { href: '/funds',        label: 'Funds' },
  { href: '/expenses',     label: 'Expenses' },
  { href: '/salaries',     label: 'Salaries' },
  { href: '/announcements',label: 'Announcements' },
  { href: '/letters',      label: 'Letters & Docs' },
  { href: '/janaza',       label: 'Janaza' },
  { href: '/jumma',        label: 'Jumma Programs' },
  { href: '/ramadan',      label: 'Ramadan' },
  { href: '/madarsa',      label: 'Madarsa' },
  { href: '/projects',     label: 'Dev Projects' },
  { href: '/reports',      label: 'Reports' },
  { href: '/audit',        label: 'Audit Logs' },
  { href: '/settings',     label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220,
      background: 'var(--color-deep-teal)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      <div style={{ padding: '24px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>MasjidHub LK</div>
      </div>
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '10px 20px',
                color: active ? 'white' : 'rgba(255,255,255,0.7)',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                borderLeft: active ? '3px solid var(--color-gold)' : '3px solid transparent',
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
