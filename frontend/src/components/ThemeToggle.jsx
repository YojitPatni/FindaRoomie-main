import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      className="btn btn-ghost btn-circle"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === 'light' ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5"/>}
    </button>
  );
}
