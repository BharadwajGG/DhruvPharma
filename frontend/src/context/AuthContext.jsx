import { createContext, useContext, useEffect, useState } from 'react'
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [isAdmin, setIsAdmin]         = useState(false)
    const [userClaims, setUserClaims]   = useState({})
    const [loading, setLoading]         = useState(true)

    // Verify token and custom claims from Firebase Auth server
    const verifyUserClaims = async (user) => {
        if (!user) {
            setIsAdmin(false)
            setUserClaims({})
            return { isAdmin: false, claims: {} }
        }
        try {
            // Force refresh ID token to get the latest server-signed custom claims
            const tokenResult = await user.getIdTokenResult(true)
            const adminStatus = Boolean(tokenResult?.claims?.admin)
            setIsAdmin(adminStatus)
            setUserClaims(tokenResult?.claims || {})
            return { isAdmin: adminStatus, claims: tokenResult?.claims || {} }
        } catch (error) {
            console.error('Failed to verify user claims:', error)
            setIsAdmin(false)
            setUserClaims({})
            return { isAdmin: false, claims: {} }
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user)
                await verifyUserClaims(user)
            } else {
                setCurrentUser(null)
                setIsAdmin(false)
                setUserClaims({})
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    /* ── Sign In with Email & Password ── */
    const login = async (email, password) => {
        const credential = await signInWithEmailAndPassword(auth, email, password)
        const { isAdmin: userIsAdmin, claims } = await verifyUserClaims(credential.user)
        return { user: credential.user, isAdmin: userIsAdmin, claims }
    }

    /* ── Public Non-Admin Registration (Prescription Queue & Customers) ── */
    // Public signup NEVER grants admin permissions.
    const register = async (email, password, displayName = '') => {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        if (displayName && credential.user) {
            await updateProfile(credential.user, { displayName })
        }
        // Newly registered accounts strictly have no admin claims
        const { isAdmin: userIsAdmin, claims } = await verifyUserClaims(credential.user)
        return { user: credential.user, isAdmin: userIsAdmin, claims }
    }

    /* ── Sign Out ── */
    const logout = async () => {
        await signOut(auth)
        setCurrentUser(null)
        setIsAdmin(false)
        setUserClaims({})
    }

    /* ── Refresh Claims (e.g. after admin claim is assigned) ── */
    const refreshClaims = async () => {
        if (auth.currentUser) {
            return await verifyUserClaims(auth.currentUser)
        }
        return { isAdmin: false, claims: {} }
    }

    const value = {
        currentUser,
        isAdmin,
        userClaims,
        loading,
        login,
        register,
        logout,
        refreshClaims,
        isFirebaseConfigured,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

