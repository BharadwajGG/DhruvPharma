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
        const isSusp = /susp|suspension/i.test(clean)
        return {
            packLabel: `${isSusp ? 'Suspension' : 'Bottle'} of ${vol} ml`,
            unitCount: vol,
            unitType: 'ml',
        }
    }

    // 2. Creams, Gels, Ointments, Powders
    const wtMatch = clean.match(/(\d+(?:\.\d+)?)\s*(gm|g|kg)\b/i)
    if (wtMatch) {
        const wt = parseFloat(wtMatch[1])
        const isPowder = /powder|powd|granules|sachet/i.test(clean)
        return {
            packLabel: `${isPowder ? 'Jar' : 'Tube'} of ${wt} g`,
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

/**
 * Real-time dynamic medicine dosage form detector.
 * Identifies whether a medicine is a Liquid, Powder, Capsule, Cream, Injection, or Tablet.
 */
export function detectDosageForm(name, salt = '', category = '') {
    const combined = `${name || ''} ${salt || ''} ${category || ''}`.toUpperCase()

    // 1. Powder / Granules / Sachets
    if (/\b(POWDER|POWD|GRANULES|SACHET|SACHETS|CHURNA|PROTEIN)\b/i.test(combined)) {
        return 'Powder'
    }

    // 2. Suspensions
    if (/\b(SUSPENSION|SUSP)\b/i.test(combined)) {
        return 'Oral Suspension'
    }

    // 3. Syrups & Liquids
    if (/\b(SYRUP|SYP|LIQUID|TONIC|ELIXIR|EMULSION|SOLUTION|SOLN)\b/i.test(combined)) {
        return 'Syrup (Oral Liquid)'
    }

    // 4. Capsules & Softgels
    if (/\b(CAP|CAPS|CAPSULE|CAPSULES|SOFTGEL|SOFTGELS|ROTACAP|ROTACAPS)\b/i.test(combined)) {
        return 'Capsule'
    }

    // 5. Creams, Gels & Ointments
    if (/\b(GEL|CREAM|OINTMENT|OINT|LOTION|EMULGEL|LINIMENT|BALM|RUB)\b/i.test(combined)) {
        return 'Topical Cream / Gel'
    }

    // 6. Drops (Eye, Ear, Oral, Nasal)
    if (/\b(DROP|DROPS|EYEDROP|EARDROP)\b/i.test(combined)) {
        return 'Drops'
    }

    // 7. Injections & IV Infusions
    if (/\b(INJ|INJECTION|IV|INFUSION|VIAL|AMPOULE)\b/i.test(combined)) {
        return 'Injection / IV Infusion'
    }

    // 8. Inhalers & Sprays
    if (/\b(INHALER|SPRAY|RESPULES|AEROSOL|MDI|VAPORIZER)\b/i.test(combined)) {
        return 'Inhaler / Spray'
    }

    // 9. Tablets & Lozenges
    if (/\b(TAB|TABS|TABLET|TABLETS|PILL|PILLS|LOZENGE|LOZENGES|CHEWABLE)\b/i.test(combined)) {
        return 'Tablet'
    }

    // 10. Volume / Weight based heuristics
    if (/\b\d+\s*ML\b/i.test(combined)) {
        return 'Syrup (Oral Liquid)'
    }
    if (/\b\d+\s*(GM|G|KG)\b/i.test(combined)) {
        return 'Topical Cream / Gel'
    }

    return 'Tablet'
}
