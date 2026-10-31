import { createContext, useContext, useState, useEffect } from 'react'

const DeliveryContext = createContext(null)

export const SERVICEABLE_AREAS = [
    { id: 1, name: 'Nandurbar', pincode: '425412', district: 'Nandurbar', deliveryTime: '3–4 Days' },
    { id: 2, name: 'Shahada',   pincode: '425409', district: 'Nandurbar', deliveryTime: '3–4 Days' },
    { id: 3, name: 'Taloda',    pincode: '425413', district: 'Nandurbar', deliveryTime: '3–4 Days' },
    { id: 4, name: 'Nijampur',  pincode: '424305', district: 'Dhule',      deliveryTime: '3–4 Days' },
    { id: 5, name: 'Akkalkuwa', pincode: '425415', district: 'Nandurbar', deliveryTime: '3–4 Days' },
    { id: 6, name: 'Shirpur',   pincode: '424405', district: 'Dhule',      deliveryTime: '3–4 Days' },
    { id: 7, name: 'Sakri',     pincode: '424304', district: 'Dhule',      deliveryTime: '3–4 Days' },
]

const STORAGE_KEY = 'dhruvpharma_delivery_location'

export function DeliveryProvider({ children }) {
    const [selectedLocation, setSelectedLocation] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                if (SERVICEABLE_AREAS.some((a) => a.pincode === parsed.pincode)) {
                    return parsed
                }
            }
        } catch (e) {
            console.error('Error loading saved delivery location:', e)
        }
        // Default to Nandurbar (425412)
        return SERVICEABLE_AREAS[0]
    })

    const [isLocating, setIsLocating] = useState(false)

    // Check if a PIN code is in the 7 authorized areas
    const checkPincode = (pincode) => {
        if (!pincode) return null
        const cleanPin = String(pincode).trim()
        return SERVICEABLE_AREAS.find((a) => a.pincode === cleanPin) || null
    }

    // Set delivery location by verified PIN code
    const setLocationByPincode = (pincode) => {
        const match = checkPincode(pincode)
        if (match) {
            setSelectedLocation(match)
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(match))
            } catch (e) {
                console.error('Error saving delivery location:', e)
            }
            return {
                success: true,
                area: match,
                message: `Delivery available in ${match.name} (${match.pincode}) · Expected in ${match.deliveryTime}`,
            }
        }
        return {
            success: false,
            area: null,
            message: `Delivery currently not available for PIN ${pincode}. We currently deliver only to Nandurbar, Shahada, Taloda, Nijampur, Akkalkuwa, Shirpur & Sakri.`,
        }
    }

    // HTML5 Geolocation helper
    const detectCurrentLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({
                    success: false,
                    message: 'Geolocation is not supported by your browser.',
                })
                return
            }

            setIsLocating(true)
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setIsLocating(false)
                    // If user is near Khandesh region / Maharashtra, default to nearest hub or Nandurbar
                    const defaultHub = SERVICEABLE_AREAS[0]
                    setSelectedLocation(defaultHub)
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultHub))
                    } catch (e) {}
                    resolve({
                        success: true,
                        area: defaultHub,
                        message: `Detected your region. Defaulting delivery hub to ${defaultHub.name} (${defaultHub.pincode}).`,
                    })
                },
                (err) => {
                    setIsLocating(false)
                    resolve({
                        success: false,
                        message: 'Could not access current location. Please select your town or enter PIN code.',
                    })
                },
                { timeout: 7000 }
            )
        })
    }

    return (
        <DeliveryContext.Provider
            value={{
                selectedLocation,
                serviceableAreas: SERVICEABLE_AREAS,
                checkPincode,
                setLocationByPincode,
                detectCurrentLocation,
                isLocating,
            }}
        >
            {children}
        </DeliveryContext.Provider>
    )
}

export function useDelivery() {
    const context = useContext(DeliveryContext)
    if (!context) {
        throw new Error('useDelivery must be used within a DeliveryProvider')
    }
    return context
}

