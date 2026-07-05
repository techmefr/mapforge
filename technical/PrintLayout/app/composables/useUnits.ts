export const PX_PER_CM = 37.795275591
export const PX_PER_MM = PX_PER_CM / 10

export function useUnits() {
    return { PX_PER_CM, PX_PER_MM }
}
