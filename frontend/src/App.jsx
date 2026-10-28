import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import MedicineStorePage from './pages/MedicineStorePage'
import MedicineDetailPage from './pages/MedicineDetailPage'
import PrescriptionPage from './pages/PrescriptionPage'
import CartPage from './pages/CartPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import ContactPage from './pages/ContactPage'
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
        <Router>
            <Routes>
                {/* ── Admin Routes (Dedicated Admin Sidebar & Header) ── */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/prescriptions" element={<AdminPrescriptions />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/inventory" element={<AdminInventory />} />

                {/* ── Customer Storefront Routes (with Navbar & Footer) ── */}
                <Route element={<CustomerLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/medicines" element={<MedicineStorePage />} />
                    <Route path="/medicines/:id" element={<MedicineDetailPage />} />
                    <Route path="/prescription" element={<PrescriptionPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/track-order" element={<OrderTrackingPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                </Route>
            </Routes>
        </Router>
    )
}

export default App
