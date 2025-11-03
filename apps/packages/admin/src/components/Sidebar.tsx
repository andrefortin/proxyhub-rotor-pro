import { HandPlatter, LayoutDashboard, Settings, HandPlatterIcon, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Proxies', path: '/proxies', icon: Users },
  { name: 'Providers', path: '/providers', icon: HandPlatter },
  { name: 'Settings', path: '/settings', icon: Settings },
]

export default function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const sidebarClass = isCollapsed ? 'w-16' : 'w-64';
  const headerClass = isCollapsed ? 'text-sm' : 'text-xl';
  const linkClass = isCollapsed ? 'justify-center space-x-0' : 'space-x-2';
  const spanClass = isCollapsed ? 'hidden' : '';

  return (
    <aside className={`h-screen bg-side-panel p-4 flex flex-col space-y-4 transition-width duration-300 ${sidebarClass}`}>
      <h1 className={`font-bold truncate ${headerClass}`}>{isCollapsed ? 'PH' : 'ProxyHub Admin'}</h1>
      <nav className="flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center p-2 rounded hover:bg-gray-800 hover:text-white dark:hover:text-white ${linkClass}`}
            >
              <Icon className="w-5 h-5" />
              <span className={spanClass}>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}