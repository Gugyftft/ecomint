import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import {
  MapPin,
  Fingerprint,
  ArrowsClockwise,
  CurrencyInr,
  Lightning,
  Eye,
  ChartLineUp,
  Trophy,
  ShieldCheck,
  Bank,
} from '@phosphor-icons/react'

export default function Landing() {
  const { t, i18n } = useTranslation()
  const [showLangModal, setShowLangModal] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (!saved) {
      setShowLangModal(true)
    } else {
      i18n.changeLanguage(saved)
    }

    const scrollTarget = sessionStorage.getItem('scrollTo')
    if (scrollTarget) {
      sessionStorage.removeItem('scrollTo')
      setTimeout(() => {
        document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth' })
      }, 800)
    }
  }, [])

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    setShowLangModal(false)
  }

  const howItWorksSteps = t('howItWorks.steps', { returnObjects: true }) as { title: string; desc: string }[]
  const featuresList = t('features.list', { returnObjects: true }) as { title: string; desc: string }[]

  const stepIcons = [
    <MapPin size={28} weight="duotone" className="text-green-600" />,
    <Fingerprint size={28} weight="duotone" className="text-green-600" />,
    <ArrowsClockwise size={28} weight="duotone" className="text-green-600" />,
    <CurrencyInr size={28} weight="duotone" className="text-green-600" />,
  ]

  const featureIcons = [
    <Lightning size={28} weight="duotone" className="text-green-600" />,
    <Eye size={28} weight="duotone" className="text-green-600" />,
    <ChartLineUp size={28} weight="duotone" className="text-green-600" />,
    <Trophy size={28} weight="duotone" className="text-green-600" />,
    <ShieldCheck size={28} weight="duotone" className="text-green-600" />,
    <Bank size={28} weight="duotone" className="text-green-600" />,
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      {/* Language Selection Modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl px-8 py-10 mx-4 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
              <MapPin size={24} weight="duotone" className="text-green-600" />
            </div>
            <div className="flex flex-col gap-2 mb-8">
              <p className="text-gray-800 dark:text-white font-semibold text-base">Select your language</p>
              <p className="text-gray-800 dark:text-white font-semibold text-base">अपनी भाषा चुनें</p>
              <p className="text-gray-800 dark:text-white font-semibold text-base">तुमची भाषा निवडा</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => changeLanguage('en')}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition font-semibold text-gray-800 dark:text-white text-sm"
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition font-semibold text-gray-800 dark:text-white text-sm"
              >
                हिंदी
              </button>
              <button
                onClick={() => changeLanguage('mr')}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition font-semibold text-gray-800 dark:text-white text-sm"
              >
                मराठी
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-28 bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950">
        <span className="text-sm font-semibold text-green-600 tracking-widest uppercase mb-4">
          Sustainable Sanitation
        </span>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white max-w-3xl leading-tight mb-6">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mb-10">
          {t('hero.subtitle')}
        </p>
        <div className="flex gap-4">
          <Link to="/auth" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition">
            {t('hero.cta')}
          </Link>
          <Link to="/auth" className="border border-gray-300 dark:border-gray-600 hover:border-green-600 text-gray-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition">
            {t('hero.signIn')}
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 max-w-5xl mx-auto scroll-mt-32">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-14">
          {t('howItWorks.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {Array.isArray(howItWorksSteps) && howItWorksSteps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700/60 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                {stepIcons[i]}
              </div>
              <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white">{s.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-10 px-12 bg-gray-50 dark:bg-gray-900 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-14">
            {t('features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.isArray(featuresList) && featuresList.map((f, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  {featureIcons[i]}
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-100 dark:border-gray-800">
        © {new Date().getFullYear()} EcoMint. All rights reserved.
      </footer>
    </div>
  )
}