import { createContext, useContext, useState, useEffect } from 'react'

const DeliveryContext = createContext(null)

export const SERVICEABLE_AREAS = [
    { id: 1, name: 'Nandurbar', pincode: '425412', district: 'Nandurbar', deliveryTime: '3–4 Days', lat: 21.3697, lng: 74.2389 },
    { id: 2, name: 'Shahada',   pincode: '425409', district: 'Nandurbar', deliveryTime: '3–4 Days', lat: 21.5458, lng: 74.4715 },
    { id: 3, name: 'Taloda',    pincode: '425413', district: 'Nandurbar', deliveryTime: '3–4 Days', lat: 21.4833, lng: 74.2167 },
    { id: 4, name: 'Nijampur',  pincode: '424305', district: 'Dhule',      deliveryTime: '3–4 Days', lat: 21.0500, lng: 74.3333 },
    { id: 5, name: 'Akkalkuwa', pincode: '425415', district: 'Nandurbar', deliveryTime: '3–4 Days', lat: 21.5500, lng: 74.0167 },
    { id: 6, name: 'Shirpur',   pincode: '424405', district: 'Dhule',      deliveryTime: '3–4 Days', lat: 21.3500, lng: 74.8833 },
    { id: 7, name: 'Sakri',     pincode: '424304', district: 'Dhule',      deliveryTime: '3–4 Days', lat: 20.9833, lng: 74.3167 },
]

const STORAGE_KEY = 'dhruvpharma_delivery_location'

// Geodesic distance in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export function DeliveryProvider({ children }) {
    const [selectedLocation, setSelectedLocation] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed?.name) {
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

    // Real HTML5 Geolocation with reverse geocoding
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
                async (pos) => {
                    const lat = pos.coords.latitude
                    const lng = pos.coords.longitude

                    // Reverse geocode via BigDataCloud client API (free, fast, no API key needed)
                    let geoInfo = null
                    try {
                        const res = await fetch(
                            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
                        )
                        if (res.ok) {
                            const data = await res.json()
                            geoInfo = {
                                city: data.city || data.locality || data.principalSubdivision || 'Detected City',
                                postcode: (data.postcode || '').replace(/\D/g, ''),
                                district: data.principalSubdivision || 'Maharashtra',
                            }
                        }
                    } catch (e) {
                        console.warn('Reverse geocoding fetch error:', e)
                    }

                    // Find closest serviceable hub by distance
                    let closestHub = SERVICEABLE_AREAS[0]
                    let minDistance = calculateDistance(lat, lng, closestHub.lat, closestHub.lng)

                    for (const hub of SERVICEABLE_AREAS) {
                        const d = calculateDistance(lat, lng, hub.lat, hub.lng)
                        if (d < minDistance) {
                            minDistance = d
                            closestHub = hub
                        }
                    }

                    setIsLocating(false)

                    // Case A: Postcode matches one of the 7 hubs directly
                    if (geoInfo?.postcode) {
                        const exactHub = SERVICEABLE_AREAS.find((h) => h.pincode === geoInfo.postcode)
                        if (exactHub) {
                            setSelectedLocation(exactHub)
                            try {
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(exactHub))
                            } catch (e) {}
                            resolve({
                                success: true,
                                area: exactHub,
                                message: `GPS Detected: ${geoInfo.city} (${geoInfo.postcode}). Active delivery hub: ${exactHub.name}!`,
                            })
                            return
                        }
                    }

                    // Case B: User is within 45km of one of the 7 hubs (Khandesh / Nandurbar-Dhule area)
                    if (minDistance <= 45) {
                        const hubWithDetectedCity = {
                            ...closestHub,
                            detectedCity: geoInfo?.city || closestHub.name,
                            detectedPincode: geoInfo?.postcode || closestHub.pincode,
                        }
                        setSelectedLocation(hubWithDetectedCity)
                        try {
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(hubWithDetectedCity))
                        } catch (e) {}
                        resolve({
                            success: true,
                            area: hubWithDetectedCity,
                            message: `GPS Detected: ${geoInfo?.city || 'Your area'} (${geoInfo?.postcode || 'GPS'}). Assigned to nearest hub: ${closestHub.name} (${minDistance.toFixed(0)} km away).`,
                        })
                        return
                    }

                    // Case C: User is in another city (e.g. Pune, Mumbai, Delhi, etc.)
                    const detectedArea = {
                        id: 'gps-custom',
                        name: geoInfo?.city || 'Current Location',
                        pincode: geoInfo?.postcode || 'Detected',
                        district: geoInfo?.district || 'Outside Hub',
                        deliveryTime: 'Out of Delivery Range',
                        isOutside: true,
                        nearestHub: closestHub.name,
                    }
                    setSelectedLocation(detectedArea)
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(detectedArea))
                    } catch (e) {}

                    resolve({
                        success: true,
                        area: detectedArea,
                        message: `GPS Detected: ${detectedArea.name} (${detectedArea.pincode}). Nearest Dhruv Pharma hub is ${closestHub.name} (${minDistance.toFixed(0)} km away).`,
                    })
                },
                (err) => {
                    setIsLocating(false)
                    console.warn('Geolocation permission error:', err)
                    resolve({
                        success: false,
                        message: 'Could not access GPS. Please check location permissions or select your town.',
                    })
                },
                { timeout: 9000, enableHighAccuracy: true }
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

