import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { AdminRoute, PrescriptionQueueRoute } from './components/ProtectedRoute'

// Customer Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import MedicineStorePage from './pages/MedicineStorePage'
import MedicineDetailPage from './pages/MedicineDetailPage'
import PrescriptionPage from './pages/PrescriptionPage'
import CartPage from './pages/CartPage'
import MyOrdersPage from './pages/MyOrdersPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import ContactPage from './pages/ContactPage'

// Authentication & Operations Portals
import UserLoginPage from './pages/UserLoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import PrescriptionQueueLoginPage from './pages/PrescriptionQueueLoginPage'
import PrescriptionQueuePage from './pages/PrescriptionQueuePage'

// Admin Protected Views
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPrescriptions from './pages/admin/AdminPrescriptions'
import AdminOrders from './pages/admin/AdminOrders'
import AdminInventory from './pages/admin/AdminInventory'

function CustomerLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
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

                    {/* ── Customer Storefront Routes (with Navbar & Footer) ── */}
                    <Route element={<CustomerLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/medicines" element={<MedicineStorePage />} />
                        <Route path="/medicines/:id" element={<MedicineDetailPage />} />
                        <Route path="/prescription" element={<PrescriptionPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/my-orders" element={<MyOrdersPage />} />
                        <Route path="/track-order" element={<OrderTrackingPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                    </Route>
                </Routes>
            </Router>
            </CartProvider>
        </AuthProvider>
    )
}

export default App
