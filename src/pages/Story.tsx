import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import { Quotes } from '@phosphor-icons/react'

export default function Story() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col transition-colors duration-300">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-2xl w-full relative">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-10">The Story</h1>
          <Quotes size={120} weight="fill" className="absolute top-16 -left-10 text-green-600 opacity-30 select-none pointer-events-none" />
          <div className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed space-y-6">
            <p>I love nature. Truly. The sunlight, the wind, the rain, the winter, the trees that make all of it special.</p>
            <p>But there is something that has always bothered me deeply. I have watched people throw plastic bottles out of moving cars, as if keeping their car clean was worth poisoning the earth outside it.</p>
            <p>India is beautiful. But we are burying that beauty under our own waste, one plastic bottle at a time.</p>
            <p>EcoMint is not just an app. It is my answer to that frustration. If people will not protect nature out of love for it, maybe they will for money. And if that is what it takes, I will build the system that makes it happen.</p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 italic">— Shaurya Joshi, Founder</p>
          </div>
        </div>
      </main>
    </div>
  )
}