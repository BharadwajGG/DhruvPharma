import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// In-memory + sessionStorage scroll restoration registry
const scrollPositions = new Map()

/**
 * Smart Scroll & State Restoration Manager
 * Remembers exact scroll positions for every visited page (Home, Medicine Store, My Orders, etc.).
 * When navigating back to a section, restores the exact scroll position (e.g. New Trends, Product 25).
 * When visiting a new page for the first time, smoothly starts at the top.
 */
export default function ScrollToTop() {
    const location = useLocation()
    const activePathRef = useRef(location.pathname)

    // Continuously monitor and record scroll position for the active page
    useEffect(() => {
        activePathRef.current = location.pathname

        const handleScroll = () => {
            const currentPath = activePathRef.current
            scrollPositions.set(currentPath, window.scrollY)
            try {
                sessionStorage.setItem('dhruv_scroll_' + currentPath, String(window.scrollY))
            } catch (e) {
                // Ignore storage limits
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [location.pathname])

    // On route change: restore previous scroll position or default to top
    useEffect(() => {
        const path = location.pathname
        let targetY = scrollPositions.get(path)

        if (targetY === undefined) {
            try {
                const saved = sessionStorage.getItem('dhruv_scroll_' + path)
                if (saved !== null) {
                    targetY = parseFloat(saved)
                }
            } catch (e) {}
        }

        let userHasInteracted = false
        const markInteracted = () => {
            userHasInteracted = true
        }

        window.addEventListener('wheel', markInteracted, { passive: true, once: true })
        window.addEventListener('touchstart', markInteracted, { passive: true, once: true })

        if (targetY !== undefined && targetY > 0) {
            // Restore position immediately
            window.scrollTo({ top: targetY, left: 0, behavior: 'instant' })

            // Multi-frame alignment to ensure dynamic layouts (images, cards) snap into place seamlessly
            const frame1 = requestAnimationFrame(() => {
                if (!userHasInteracted) window.scrollTo({ top: targetY, left: 0, behavior: 'instant' })
            })

            const timer1 = setTimeout(() => {
                if (!userHasInteracted) window.scrollTo({ top: targetY, left: 0, behavior: 'instant' })
            }, 60)

            const timer2 = setTimeout(() => {
                if (!userHasInteracted) window.scrollTo({ top: targetY, left: 0, behavior: 'instant' })
            }, 200)

            return () => {
                cancelAnimationFrame(frame1)
                clearTimeout(timer1)
                clearTimeout(timer2)
                window.removeEventListener('wheel', markInteracted)
                window.removeEventListener('touchstart', markInteracted)
            }
        } else {
            // First time visiting this page: start cleanly at top
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
            return () => {
                window.removeEventListener('wheel', markInteracted)
                window.removeEventListener('touchstart', markInteracted)
            }
        }
    }, [location.pathname])

    return null
}
