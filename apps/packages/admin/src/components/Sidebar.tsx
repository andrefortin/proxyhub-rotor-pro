import { HandPlatter, LayoutDashboard, Settings, HandPlatterIcon, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Proxies', path: '/proxies', icon: Users },
  { name: 'Providers', path: '/providers', icon: HandPlatter },
  { name: 'Settings', path: '/settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-side-panel p-4 flex flex-col space-y-4">
      <h1 className="text-xl font-bold">ProxyHub Admin</h1>
      <nav className="flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800"
            >
              <Icon className="w-5 h-5" />
              <span className="">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}