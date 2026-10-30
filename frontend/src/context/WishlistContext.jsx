import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useCart, getUserAccountKey } from './CartContext'

const WishlistContext = createContext(null)

export const getWishlistStorageKey = (accountKey) => `dhruvpharma_wishlist_${accountKey}`

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

export function WishlistProvider({ children }) {
    const { currentUser } = useAuth()
    const { addToCart } = useCart()
    const activeAccountKey = getUserAccountKey(currentUser)
    const activeAccountRef = useRef(activeAccountKey)

    const [wishlist, setWishlist] = useState(() => {
        return loadStorageData(getWishlistStorageKey(activeAccountKey))
    })

    // Account change listener: reload strictly isolated wishlist for incoming user
    useEffect(() => {
        const previousKey = activeAccountRef.current
        activeAccountRef.current = activeAccountKey

        const userKey = getWishlistStorageKey(activeAccountKey)
        const savedWishlist = loadStorageData(userKey)

        // Transfer guest wishlist to newly signed-in user if empty
        if (previousKey === 'guest' && activeAccountKey !== 'guest' && savedWishlist.length === 0) {
            const guestWishlist = loadStorageData(getWishlistStorageKey('guest'))
            if (guestWishlist && guestWishlist.length > 0) {
                saveStorageData(userKey, guestWishlist)
                saveStorageData(getWishlistStorageKey('guest'), [])
                setWishlist(guestWishlist)
                return
            }
        }

        setWishlist(savedWishlist)
    }, [activeAccountKey])

    const isInWishlist = (medicineId) => {
        if (!medicineId) return false
        return wishlist.some((item) => String(item.id) === String(medicineId))
    }

    const addToWishlist = (medicine) => {
        if (!medicine || !medicine.id) return
        setWishlist((prev) => {
            if (prev.some((item) => String(item.id) === String(medicine.id))) {
                return prev
            }
            const price = medicine.sellingPrice || medicine.price || 0
            const mrp = medicine.mrp || price
            const requiresRx = Boolean(medicine.requires_rx || medicine.requiresPrescription)

            const updated = [
                {
                    id: medicine.id,
                    name: medicine.name,
                    brand: medicine.brand || medicine.manufacturer || 'Generic',
                    salt: medicine.salt || '',
                    category: medicine.category || 'General',
                    price: Number(price),
                    mrp: Number(mrp),
                    inStock: medicine.inStock !== false,
                    requires_rx: requiresRx,
                    requiresPrescription: requiresRx,
                    addedAt: new Date().toISOString(),
                },
                ...prev,
            ]
            saveStorageData(getWishlistStorageKey(activeAccountRef.current), updated)
            return updated
        })
    }

    const removeFromWishlist = (medicineId) => {
        setWishlist((prev) => {
            const updated = prev.filter((item) => String(item.id) !== String(medicineId))
            saveStorageData(getWishlistStorageKey(activeAccountRef.current), updated)
            return updated
        })
    }

    const toggleWishlist = (medicine) => {
        if (!medicine || !medicine.id) return false
        if (isInWishlist(medicine.id)) {
            removeFromWishlist(medicine.id)
            return false
        } else {
            addToWishlist(medicine)
            return true
        }
    }

    const moveToCart = (medicine) => {
        if (!medicine || !medicine.id) return
        addToCart(medicine, 1)
        removeFromWishlist(medicine.id)
    }

    const clearWishlist = () => {
        saveStorageData(getWishlistStorageKey(activeAccountRef.current), [])
        setWishlist([])
    }

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                totalWishlistItems: wishlist.length,
                isInWishlist,
                addToWishlist,
                removeFromWishlist,
                toggleWishlist,
                moveToCart,
                clearWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext)
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider')
    }
    return context
}

