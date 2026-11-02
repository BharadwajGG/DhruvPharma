/**
 * Intelligent Pack & Unit Parser for Dhruv Pharma Storefront.
 * Extracts packaging form (Strip, Bottle, Tube, Pack), unit quantity,
 * and calculates per-unit rate to match pharmaceutical retail standards.
 */
export function parsePackInfo(name) {
    if (!name || typeof name !== 'string') {
        return { packLabel: 'Strip of 10 Units', unitCount: 10, unitType: 'Units' }
    }

    const clean = name.trim()

    // 1. Liquids (Syrups, Suspensions, Drops, Lotions)
    const volMatch = clean.match(/(\d+(?:\.\d+)?)\s*(ml|ltr|l)\b/i)
    if (volMatch) {
        const vol = parseFloat(volMatch[1])
        return {
            packLabel: `Bottle of ${vol} ml`,
            unitCount: vol,
            unitType: 'ml',
        }
    }

    // 2. Creams, Gels, Ointments, Powders
    const wtMatch = clean.match(/(\d+(?:\.\d+)?)\s*(gm|g|kg)\b/i)
    if (wtMatch) {
        const wt = parseFloat(wtMatch[1])
        return {
            packLabel: `Tube of ${wt} g`,
            unitCount: wt,
            unitType: 'g',
        }
    }

    // 3. Tablets / Capsules / Units
    // Strip active ingredient strength with units to avoid confusion
    const withoutStrength = clean.replace(/\d+(?:\.\d+)?\s*(?:mg|mcg|iu|%)\b/gi, '')

    // Extract all candidate pack quantities and pick the last occurrence (retail pack count)
    const matches = Array.from(withoutStrength.matchAll(/(\d+)\s*(tab|tabs|cap|caps|units?|s\b|'s\b)/gi))
    if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1]
        const count = parseInt(lastMatch[1], 10)
        if (count > 0 && count <= 100) {
            const isCap = /cap/i.test(lastMatch[2])
            return {
                packLabel: `Strip of ${count} ${isCap ? 'Capsules' : 'Units'}`,
                unitCount: count,
                unitType: isCap ? 'Capsules' : 'Units',
            }
        }
    }

    // 4. Bracketed pack size e.g. [10STP], [20STP]
    const bracketMatch = clean.match(/\[(\d+)\s*(?:stp|str|pack|units?)\]/i)
    if (bracketMatch) {
        const count = parseInt(bracketMatch[1], 10)
        if (count > 0 && count <= 30) {
            return {
                packLabel: `Strip of ${count} Units`,
                unitCount: count,
                unitType: 'Units',
            }
        }
    }

    // Default fallback
    return {
        packLabel: 'Strip of 10 Units',
        unitCount: 10,
        unitType: 'Units',
    }
}
