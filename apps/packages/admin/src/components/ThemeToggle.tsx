import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Switch } from './ui/switch'

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return saved === 'dark' || (!saved && systemDark);
  })

  useEffect(() => {
    console.log('Theme effect running, darkMode:', darkMode);
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode])

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4" />
      <Switch
        dynamicThumb={true}
        checked={darkMode}
        onCheckedChange={(checked) => setDarkMode(!!checked)}
        className="w-8 h-4 mx-1"
        aria-label="Toggle theme"
      />
      <Moon className="h-4 w-4" />
    </div>
  )
}