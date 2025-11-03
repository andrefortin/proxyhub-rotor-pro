import { useState } from 'react'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'
import { Menu } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen">
      <Sidebar isCollapsed={isCollapsed} />
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b p-4 flex justify-between items-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Menu className="h-6 w-6" />
          </button>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}