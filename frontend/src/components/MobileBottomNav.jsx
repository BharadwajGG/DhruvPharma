import { Link, useLocation } from 'react-router-dom'
import { Home, Pill, FileUp, Package, ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function MobileBottomNav() {
    const location = useLocation()
    const { totalItems } = useCart()

    const navItems = [
        {
            label: 'Home',
            path: '/',
            icon: Home,
            isActive: location.pathname === '/',
        },
        {
            label: 'Medicines',
            path: '/medicines',
            icon: Pill,
            isActive: location.pathname.startsWith('/medicines'),
        },
        {
            label: 'Upload Rx',
            path: '/prescription',
            icon: FileUp,
            isCenter: true,
            isActive: location.pathname === '/prescription',
        },
        {
            label: 'My Orders',
            path: '/my-orders',
            icon: Package,
            isActive: location.pathname === '/my-orders' || location.pathname === '/track-order',
        },
        {
            label: 'Cart',
            path: '/cart',
            icon: ShoppingCart,
            badge: totalItems,
            isActive: location.pathname === '/cart',
        },
    ]

    return (
        <aside 
            aria-label="Mobile Navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
            <nav className="flex items-center justify-around px-2 pt-1.5 h-14">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = item.isActive

                    if (item.isCenter) {
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className="relative -top-3 flex flex-col items-center group active:scale-95 transition-transform"
                                aria-label="Upload Doctor Prescription"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                                    active 
                                        ? 'bg-blue-700 text-white shadow-blue-500/40 ring-4 ring-blue-100' 
                                        : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-600/30'
                                }`}>
                                    <Icon className="w-5 h-5 stroke-[2.3]" />
                                </div>
                                <span className={`text-[10px] font-semibold tracking-tight mt-0.5 ${
                                    active ? 'text-blue-700 font-bold' : 'text-slate-600'
                                }`}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full py-1 active:scale-95 transition-transform relative ${
                                active ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                                {item.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] tracking-tight mt-0.5">
                                {item.label}
                            </span>
                            {active && (
                                <span className="absolute bottom-0 w-6 h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
