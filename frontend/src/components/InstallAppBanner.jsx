import { useState, useEffect } from 'react'
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react'

export default function InstallAppBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [installedSuccess, setInstalledSuccess] = useState(false)

    useEffect(() => {
        // 1. Check if already running as installed standalone PWA
        const isStandaloneMode = 
            window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://')

        if (isStandaloneMode) {
            setIsStandalone(true)
            localStorage.setItem('pwa_installed', 'true')
            return
        }

        // 2. Check if user recently dismissed the banner (7 days timeout)
        const dismissedUntil = localStorage.getItem('pwa_dismissed_until')
        if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
            return
        }

        // 3. Detect iOS Safari
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream
        const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)
        
        if (isIosDevice && isSafari && !isStandaloneMode) {
            setIsIOS(true)
            // Show iOS guide after a short pleasant 4-second delay so page loads first
            const timer = setTimeout(() => setShowBanner(true), 4000)
            return () => clearTimeout(timer)
        }

        // 4. Android / Chrome / Edge Native Install Event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Show install banner smoothly
            setShowBanner(true)
        }

        const handleAppInstalled = () => {
            setInstalledSuccess(true)
            setShowBanner(false)
            setDeferredPrompt(null)
            localStorage.setItem('pwa_installed', 'true')
        }

        // Listen for manual trigger from navbar / footer buttons
        const handleManualTrigger = () => {
            setShowBanner(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)
        window.addEventListener('trigger-pwa-install', handleManualTrigger)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
            window.removeEventListener('trigger-pwa-install', handleManualTrigger)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setInstalledSuccess(true)
            setShowBanner(false)
            localStorage.setItem('pwa_installed', 'true')
        }
        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setShowBanner(false)
        // Dismiss for 7 days
        localStorage.setItem('pwa_dismissed_until', (Date.now() + 7 * 86400000).toString())
    }

    if (isStandalone || !showBanner) return null

    return (
        <aside 
            aria-label="Install App"
            className="fixed bottom-16 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
            <div className="bg-slate-900/95 backdrop-blur-xl text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 ring-1 ring-white/10 flex flex-col gap-2.5">
                
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/icons/icon-192.png" 
                            alt="Dhruv Pharma App Icon" 
                            className="w-12 h-12 rounded-xl shadow-md border border-white/20 shrink-0" 
                        />
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-white">Dhruv Pharma</span>
                                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-blue-500/30 text-blue-300 border border-blue-400/30 px-1.5 py-0.2 rounded-full">
                                    App
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 leading-tight">
                                {isIOS ? 'Install on your iPhone home screen' : 'Install for faster medicine ordering & alerts'}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={handleDismiss}
                        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors -mr-1"
                        aria-label="Dismiss app install banner"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body: Android 1-click or iOS Safari manual guide */}
                {isIOS ? (
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 space-y-1.5">
                        <p className="font-medium text-slate-200">2 quick taps to add to your Home Screen:</p>
                        <div className="flex items-center gap-2 text-slate-200">
                            <span className="w-5 h-5 rounded-full bg-blue-600/40 text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                            <span>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /> below in Safari</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-200">
                            <span className="w-5 h-5 rounded-full bg-blue-600/40 text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                            <span>Select <strong>'Add to Home Screen'</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" /></span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 pt-0.5">
                        <button
                            onClick={handleInstallClick}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 active:scale-98 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>Install App (Free)</span>
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 text-xs py-2 px-3 rounded-xl transition-colors"
                        >
                            Not Now
                        </button>
                    </div>
                )}

                {/* Trust badge */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 px-0.5">
                    <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-emerald-400" /> Standalone mode • No ads
                    </span>
                    <span className="text-slate-400 font-medium">Size: &lt; 2 MB</span>
                </div>
            </div>
        </aside>
    )
}
