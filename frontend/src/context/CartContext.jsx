import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

// Normalize account key by email (lowercased) or UID so carts are 100% permanent per email account
export const getUserAccountKey = (user) => {
    if (!user) return 'guest'
    if (user.email && user.email.trim()) {
        return `user_${user.email.trim().toLowerCase()}`
    }
    if (user.uid) {
        return `user_${user.uid}`
    }
    return 'guest'
}

export const getCartStorageKey = (accountKey) => `dhruvpharma_cart_${accountKey}`
export const getOrdersStorageKey = (accountKey) => `dhruvpharma_orders_${accountKey}`

// Helper functions for safe synchronous LocalStorage operations
const loadStorageData = (key) => {
    try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : []
    } catch (e) {
        console.error(`Failed to load storage key ${key}:`, e)
        return []
    }
}

const saveStorageData = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
        console.error(`Failed to save storage key ${key}:`, e)
    }
}

export function CartProvider({ children }) {
    const { currentUser } = useAuth()
    const activeAccountKey = getUserAccountKey(currentUser)

    // Ref tracking the currently active account to prevent cross-account race conditions
    const activeAccountRef = useRef(activeAccountKey)

    // 1. User-Scoped Shopping Cart State
    const [cart, setCart] = useState(() => {
        return loadStorageData(getCartStorageKey(activeAccountKey))
    })

    // 2. User-Scoped Customer Order History
    const [customerOrders, setCustomerOrders] = useState(() => {
        return loadStorageData(getOrdersStorageKey(activeAccountKey))
    })

    // When the authenticated user identity or email changes:
    // Load the strictly isolated cart and order history for THAT exact account
    useEffect(() => {
        const previousKey = activeAccountRef.current
        activeAccountRef.current = activeAccountKey

        const userCartKey = getCartStorageKey(activeAccountKey)
        const userOrdersKey = getOrdersStorageKey(activeAccountKey)

        const savedUserCart = loadStorageData(userCartKey)
        const savedUserOrders = loadStorageData(userOrdersKey)

        // If a guest added items and just signed in to a new account without previous cart items, transfer them
        if (previousKey === 'guest' && activeAccountKey !== 'guest' && savedUserCart.length === 0) {
            const guestCart = loadStorageData(getCartStorageKey('guest'))
            if (guestCart && guestCart.length > 0) {
                saveStorageData(userCartKey, guestCart)
                saveStorageData(getCartStorageKey('guest'), [])
                setCart(guestCart)
                setCustomerOrders(savedUserOrders)
                return
            }
        }

        // Load account's permanent cart
        setCart(savedUserCart)
        setCustomerOrders(savedUserOrders)
    }, [activeAccountKey])

    // Save a newly placed order to this account's permanent order history
    const savePlacedOrder = (order) => {
        if (!order || !order.id) return
        setCustomerOrders((prev) => {
            const exists = prev.some((o) => o.id === order.id || o.orderId === order.id)
            const updated = exists
                ? prev.map((o) => (o.id === order.id || o.orderId === order.id ? order : o))
                : [order, ...prev]

            saveStorageData(getOrdersStorageKey(activeAccountRef.current), updated)
            return updated
        })
    }

    // Add item to cart - directly updates state & writes to active account's isolated storage
    const addToCart = (medicine, qty = 1) => {
        if (!medicine || !medicine.id) return
        const quantityToAdd = Math.max(1, parseInt(qty) || 1)

        setCart((prev) => {
            const existingIdx = prev.findIndex((item) => item.id === medicine.id)
            let updated
            if (existingIdx >= 0) {
                updated = [...prev]
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    qty: updated[existingIdx].qty + quantityToAdd,
                }
            } else {
                const price = medicine.sellingPrice || medicine.price || 0
                const mrp = medicine.mrp || price
                const requiresRx = Boolean(medicine.requires_rx || medicine.requiresPrescription)

                updated = [
                    ...prev,
                    {
                        id: medicine.id,
                        name: medicine.name,
                        brand: medicine.brand || medicine.manufacturer || 'Generic',
                        salt: medicine.salt || '',
                        category: medicine.category || 'General',
                        price: Number(price),
                        mrp: Number(mrp),
                        qty: quantityToAdd,
                        requires_rx: requiresRx,
                        requiresPrescription: requiresRx,
                    },
                ]
            }

            saveStorageData(getCartStorageKey(activeAccountRef.current), updated)
            return updated
        })
    }

    // Update quantity (+1 or -1)
    const updateQty = (id, delta) => {
        setCart((prev) => {
            const updated = prev
                .map((item) => {
                    if (item.id === id) {
                        const newQty = item.qty + delta
                        return newQty > 0 ? { ...item, qty: newQty } : null
                    }
                    return item
                })
                .filter(Boolean)

            saveStorageData(getCartStorageKey(activeAccountRef.current), updated)
            return updated
        })
    }

    // Remove single item
    const removeFromCart = (id) => {
        setCart((prev) => {
            const updated = prev.filter((item) => item.id !== id)
            saveStorageData(getCartStorageKey(activeAccountRef.current), updated)
            return updated
        })
    }

    // Clear whole cart (ONLY called when explicitly clicking clear cart or after order confirmation)
    const clearCart = () => {
        saveStorageData(getCartStorageKey(activeAccountRef.current), [])
        setCart([])
    }

    // Reorder all items from a past order into active cart
    const reorderItems = (orderItems = []) => {
        if (!Array.isArray(orderItems) || orderItems.length === 0) return 0

        let count = 0
        setCart((prev) => {
            let updated = [...prev]
            orderItems.forEach((orderItem) => {
                if (!orderItem || !orderItem.id) return
                const qtyToAdd = Math.max(1, parseInt(orderItem.qty) || 1)
                const existingIdx = updated.findIndex((i) => i.id === orderItem.id)
                if (existingIdx >= 0) {
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        qty: updated[existingIdx].qty + qtyToAdd,
                    }
                } else {
                    const price = orderItem.sellingPrice || orderItem.price || 0
                    const mrp = orderItem.mrp || price
                    const requiresRx = Boolean(orderItem.requires_rx || orderItem.requiresPrescription)
                    updated.push({
                        id: orderItem.id,
                        name: orderItem.name,
                        brand: orderItem.brand || orderItem.manufacturer || 'Generic',
                        salt: orderItem.salt || '',
                        category: orderItem.category || 'General',
                        price: Number(price),
                        mrp: Number(mrp),
                        qty: qtyToAdd,
                        requires_rx: requiresRx,
                        requiresPrescription: requiresRx,
                    })
                }
                count += qtyToAdd
            })

            saveStorageData(getCartStorageKey(activeAccountRef.current), updated)
            return updated
        })
        return count
    }

    // Computed cart values
    const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0)
    const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0)
    const totalSavings = cart.reduce(
        (sum, item) => sum + Math.max(0, (item.mrp - item.price) * (item.qty || 1)),
        0
    )
    const deliveryFee = subtotal === 0 ? 0 : subtotal >= 300 ? 0 : 40
    const totalAmount = subtotal + deliveryFee
    const hasRxItem = cart.some((item) => item.requires_rx || item.requiresPrescription)

    return (
        <CartContext.Provider
            value={{
                cart,
                customerOrders,
                savePlacedOrder,
                addToCart,
                updateQty,
                removeFromCart,
                clearCart,
                reorderItems,
                totalItems,
                subtotal: Math.round(subtotal * 100) / 100,
                totalSavings: Math.round(totalSavings * 100) / 100,
                deliveryFee,
                totalAmount: Math.round(totalAmount * 100) / 100,
                hasRxItem,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
