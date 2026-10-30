import { createContext, useContext, useEffect, useState } from 'react'
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config'

const AuthContext = createContext(null)

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'devendra.chavan2008@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [isAdmin, setIsAdmin]         = useState(false)
    const [userClaims, setUserClaims]   = useState({})
    const [loading, setLoading]         = useState(true)

    // Verify token and authorized administrator status
    const verifyUserClaims = async (user) => {
        if (!user) {
            setIsAdmin(false)
            setUserClaims({})
            return { isAdmin: false, claims: {} }
        }
        try {
            // Force refresh ID token to get the latest server-signed custom claims
            const tokenResult = await user.getIdTokenResult(true)
            const isEmailAuthorized = Boolean(
                user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
            )
            const hasCustomClaim = Boolean(tokenResult?.claims?.admin)
            const adminStatus = isEmailAuthorized || hasCustomClaim

            setIsAdmin(adminStatus)
            setUserClaims(tokenResult?.claims || {})
            return { isAdmin: adminStatus, claims: tokenResult?.claims || {} }
        } catch (error) {
            console.error('Failed to verify user claims:', error)
            const isEmailAuthorized = Boolean(
                user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
            )
            setIsAdmin(isEmailAuthorized)
            setUserClaims({})
            return { isAdmin: isEmailAuthorized, claims: {} }
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

    /* ── Sign In with Google OAuth ── */
    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        const credential = await signInWithPopup(auth, provider)
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
        loginWithGoogle,
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

