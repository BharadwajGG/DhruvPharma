import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { DeliveryProvider } from './context/DeliveryContext'
import { AdminRoute, PrescriptionQueueRoute } from './components/ProtectedRoute'

// Eager customer components (critical path)
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MobileBottomNav from './components/MobileBottomNav'
import OrderViaCallWidget from './components/OrderViaCallWidget'
import HomePage from './pages/HomePage'
import ScrollToTop from './components/ScrollToTop'

// Code-split customer pages (lazy loaded on demand)
const MedicineStorePage = lazy(() => import('./pages/MedicineStorePage'))
const MedicineDetailPage = lazy(() => import('./pages/MedicineDetailPage'))
const PrescriptionPage = lazy(() => import('./pages/PrescriptionPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'))
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

// Code-split auth & admin portals (saves ~400kB on initial customer load)
const UserLoginPage = lazy(() => import('./pages/UserLoginPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const PrescriptionQueueLoginPage = lazy(() => import('./pages/PrescriptionQueueLoginPage'))
const PrescriptionQueuePage = lazy(() => import('./pages/PrescriptionQueuePage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminPrescriptions = lazy(() => import('./pages/admin/AdminPrescriptions'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'))
const AdminPricing = lazy(() => import('./pages/admin/AdminPricing'))

const PageLoader = () => (
    <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
)

function CustomerLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">
                <Outlet />
            </main>
            <OrderViaCallWidget />
            <MobileBottomNav />
            <Footer />
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <WishlistProvider>
                    <DeliveryProvider>
                        <Router>
                            <ScrollToTop />
                            <Suspense fallback={<PageLoader />}>
                                <Routes>
                                {/* ── Public Authentication Pages ── */}
                                <Route path="/login" element={<UserLoginPage />} />
                                <Route path="/admin/login" element={<AdminLoginPage />} />
                                <Route path="/prescription-queue/login" element={<PrescriptionQueueLoginPage />} />

                                {/* ── Protected Prescription Queue Route (Authenticated Queue Users) ── */}
                                <Route
                                    path="/prescription-queue"
                                    element={
                                        <PrescriptionQueueRoute>
                                            <PrescriptionQueuePage />
                                        </PrescriptionQueueRoute>
                                    }
                                />

                                {/* ── Protected Admin Routes (Strict Admin-Only Custom Claim) ── */}
                                <Route
                                    path="/admin"
                                    element={
                                        <AdminRoute>
                                            <AdminDashboard />
                                        </AdminRoute>
                                    }
                                />
                                <Route
                                    path="/admin/prescriptions"
                                    element={
                                        <AdminRoute>
                                            <AdminPrescriptions />
                                        </AdminRoute>
                                    }
                                />
                                <Route
                                    path="/admin/orders"
                                    element={
                                        <AdminRoute>
                                            <AdminOrders />
                                        </AdminRoute>
                                    }
                                />
                                <Route
                                    path="/admin/inventory"
                                    element={
                                        <AdminRoute>
                                            <AdminInventory />
                                        </AdminRoute>
                                    }
                                />
                                <Route
                                    path="/admin/pricing"
                                    element={
                                        <AdminRoute>
                                            <AdminPricing />
                                        </AdminRoute>
                                    }
                                />

                                {/* ── Customer Storefront Routes (with Navbar & Footer) ── */}
                                <Route element={<CustomerLayout />}>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/medicines" element={<MedicineStorePage />} />
                                    <Route path="/medicines/:id" element={<MedicineDetailPage />} />
                                    <Route path="/prescription" element={<PrescriptionPage />} />
                                    <Route path="/cart" element={<CartPage />} />
                                    <Route path="/wishlist" element={<WishlistPage />} />
                                    <Route path="/my-orders" element={<MyOrdersPage />} />
                                    <Route path="/profile" element={<ProfilePage />} />
                                    <Route path="/track-order" element={<OrderTrackingPage />} />
                                    <Route path="/contact" element={<ContactPage />} />
                                </Route>
                            </Routes>
                            </Suspense>
                        </Router>
                    </DeliveryProvider>
                </WishlistProvider>
            </CartProvider>
        </AuthProvider>
    )
}

export default App
