"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitConverter = void 0;
class UnitConverter {
    // Conversion rates to base units (g and ml)
    static conversions = {
        'kg': 1000,
        'g': 1,
        'mg': 0.001,
        'l': 1000,
        'ml': 1,
        'pcs': 1,
        'dozen': 12,
    };
    /**
     * Converts a given quantity from a given unit to the base unit
     */
    static toBaseUnit(quantity, fromUnit) {
        const unit = fromUnit.toLowerCase();
        const multiplier = this.conversions[unit];
        if (multiplier === undefined) {
            throw new Error(`Unsupported unit: ${fromUnit}`);
        }
        return quantity * multiplier;
    }
    /**
     * Normalizes a unit string to its standard base unit equivalent for comparisons
     * e.g., 'kg' -> 'g', 'L' -> 'ml'
     */
    static getBaseUnitType(unit) {
        const u = unit.toLowerCase();
        if (['kg', 'g', 'mg'].includes(u))
            return 'g';
        if (['l', 'ml'].includes(u))
            return 'ml';
        if (['pcs', 'dozen'].includes(u))
            return 'pcs';
        return u; // fallback
    }
    /**
     * Check if two units are compatible (e.g. kg and g)
     */
    static areCompatible(unit1, unit2) {
        return this.getBaseUnitType(unit1) === this.getBaseUnitType(unit2);
    }
}
exports.UnitConverter = UnitConverter;
