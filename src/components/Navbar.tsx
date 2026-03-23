import { Leaf } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Menu, X, Globe } from 'lucide-react'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
]

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [showLangHint, setShowLangHint] = useState(false)

useEffect(() => {
  setShowLangHint(true)
  const timer = setTimeout(() => setShowLangHint(false), 4000)
  return () => clearTimeout(timer)
}, [])
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else {
      sessionStorage.setItem('scrollTo', id)
      navigate('/')
    }
  }

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    setLangOpen(false)
    setMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link to="/" className="text-2xl font-bold text-green-600 flex items-center gap-2">
  <Leaf size={24} weight="duotone" color="#16a34a" />
  EcoMint
</Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-green-600 transition">{t('nav.howItWorks')}</button>
          <button onClick={() => scrollTo('features')} className="hover:text-green-600 transition">{t('nav.features')}</button>
          <Link to="/story" className="hover:text-green-600 transition">{t('nav.theStory')}</Link>
          <Link to="/auth" className="hover:text-green-600 transition">{t('nav.signIn')}</Link>

          {/* Language */}
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1 hover:text-green-600 transition">
              <Globe size={16} />
              <span>{languages.find(l => l.code === i18n.language)?.label ?? 'English'}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
                {languages.map(l => (
                  <button key={l.code} onClick={() => changeLanguage(l.code)}
                    className={`w-full text-left px-4 py-2 text-sm transition ${i18n.language === l.code ? 'bg-green-50 text-green-700 font-semibold' : 'hover:bg-green-50 dark:hover:bg-gray-800'}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark mode */}
          <button onClick={() => setDark(!dark)} className="hover:text-green-600 transition">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link to="/auth" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            Sign Up
          </Link>
        </div>

        {/* Mobile right controls */}
        <div className="md:hidden flex items-center gap-3" style={{ position: "relative" }}>
          <button onClick={() => setDark(!dark)} className="text-gray-600 dark:text-gray-300">
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {showLangHint && (
            <div style={{ position: "absolute", right: "0px", top: "36px", background: "#16a34a", color: "#fff", fontSize: "13px", fontWeight: 700, padding: "8px 14px", borderRadius: "10px", whiteSpace: "nowrap", zIndex: 200, boxShadow: "0 4px 12px rgba(22,163,74,0.4)" }}>
              Language / भाषा ↑
            </div>
          )}
          <button className="text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-6 flex flex-col gap-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
          <button onClick={() => scrollTo('how-it-works')} className="text-left hover:text-green-600">{t('nav.howItWorks')}</button>
          <button onClick={() => scrollTo('features')} className="text-left hover:text-green-600">{t('nav.features')}</button>
          <Link to="/story" onClick={() => setMenuOpen(false)} className="hover:text-green-600">{t('nav.theStory')}</Link>
          <Link to="/auth" onClick={() => setMenuOpen(false)} className="hover:text-green-600">{t('nav.signIn')}</Link>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 text-xs">Dark mode</span>
            <button onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Language</p>
            <div className="flex gap-2">
              {languages.map(l => (
                <button key={l.code} onClick={() => changeLanguage(l.code)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition ${i18n.language === l.code ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-50 dark:bg-gray-800 hover:bg-green-50'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}