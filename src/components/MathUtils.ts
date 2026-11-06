export const J2000_OBLIQUITY_DEG = 23.43928;
export const J2000_OBLIQUITY_RAD = (J2000_OBLIQUITY_DEG * Math.PI) / 180;

const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const COS_OBLIQUITY = Math.cos(J2000_OBLIQUITY_RAD);
const SIN_OBLIQUITY = Math.sin(J2000_OBLIQUITY_RAD);

export interface OrbitalBasis {
    px: number;
    py: number;
    pz: number;
    qx: number;
    qy: number;
    qz: number;
}

export interface KeplerianState {
    x: number;
    y: number;
    z: number;
    tx: number;
    ty: number;
    tz: number;
}

export function solveKepler(M: number, e: number): number {
    if (e <= 1e-12) return M;
    let E = M + e * Math.sin(M) + 0.5 * e * e * Math.sin(2 * M);
    for (let i = 0; i < 50; i++) {
        const f = E - e * Math.sin(E) - M;
        const df = 1 - e * Math.cos(E);
        let dE = f / df;

        // Clamp the change to prevent wild oscillation for extreme eccentricities
        if (dE > 0.5) dE = 0.5;
        if (dE < -0.5) dE = -0.5;

        E -= dE;
        if (Math.abs(dE) < 1e-8) break;
    }
    return E;
}

/**
 * Computes IAU Greenwich Mean Sidereal Time (GMST) in [0, 2*PI) radians
 * from fractional days elapsed since J2000.0 (2000-01-01T12:00:00Z, JD 2451545.0).
 */
export function computeGMSTRadians(daysSinceJ2000: number): number {
    const T = daysSinceJ2000 / 36525;
    // Reduce linear term modulo 360 first to maintain sub-arcsecond precision across centuries
    const linearDeg = (360.98564736629 * daysSinceJ2000) % 360;
    const gmstDeg = 280.46061837 + linearDeg + 0.000387933 * T * T - (T * T * T) / 38710000;
    const wrappedDeg = ((gmstDeg % 360) + 360) % 360;
    return wrappedDeg * DEG_TO_RAD;
}

/**
 * Converts J2000 Equatorial coordinates (Right Ascension in hours, Declination in degrees)
 * into Three.js J2000 Ecliptic scene coordinates:
 *   +X = Vernal Equinox (lambda = 0 deg)
 *   +Y = North Ecliptic Pole
 *   -Z = Summer Solstice direction (lambda = +90 deg)
 */
export function equatorialToEcliptic3D(
    raHours: number,
    decDeg: number,
    radius: number
): { x: number; y: number; z: number } {
    const raRad = (raHours / 24) * TWO_PI;
    const decRad = decDeg * DEG_TO_RAD;
    const cosDec = Math.cos(decRad);

    const xEq = radius * cosDec * Math.cos(raRad);
    const yEq = radius * Math.sin(decRad);
    const zEq = -radius * cosDec * Math.sin(raRad);

    return {
        x: xEq,
        y: yEq * COS_OBLIQUITY + zEq * SIN_OBLIQUITY,
        z: -yEq * SIN_OBLIQUITY + zEq * COS_OBLIQUITY
    };
}

/**
 * Computes the 3D orthonormal perifocal basis vectors P (toward periapsis) and
 * Q (90 deg prograde in orbital plane) in Three.js J2000 Ecliptic coordinates.
 */
export function getOrbitalBasis(
    inclinationDeg: number = 0,
    longitudeOfPerihelionDeg: number = 0,
    longitudeOfAscendingNodeDeg: number = 0,
    out: OrbitalBasis = { px: 1, py: 0, pz: 0, qx: 0, qy: 0, qz: -1 }
): OrbitalBasis {
    const inc = inclinationDeg * DEG_TO_RAD;
    const omegaBar = longitudeOfPerihelionDeg * DEG_TO_RAD;
    const bigOmega = longitudeOfAscendingNodeDeg * DEG_TO_RAD;
    const argPeri = omegaBar - bigOmega;

    const cosO = Math.cos(bigOmega);
    const sinO = Math.sin(bigOmega);
    const cosW = Math.cos(argPeri);
    const sinW = Math.sin(argPeri);
    const cosI = Math.cos(inc);
    const sinI = Math.sin(inc);

    // Standard J2000 Ecliptic Gauss vectors (X_ecl, Y_ecl, Z_ecl)
    const pXecl = cosW * cosO - sinW * sinO * cosI;
    const pYecl = cosW * sinO + sinW * cosO * cosI;
    const pZecl = sinW * sinI;

    const qXecl = -sinW * cosO - cosW * sinO * cosI;
    const qYecl = -sinW * sinO + cosW * cosO * cosI;
    const qZecl = cosW * sinI;

    // Map Ecliptic (X_ecl, Y_ecl, Z_ecl) -> Three.js (x = X_ecl, y = Z_ecl, z = -Y_ecl)
    out.px = pXecl;
    out.py = pZecl;
    out.pz = -pYecl;

    out.qx = qXecl;
    out.qy = qZecl;
    out.qz = -qYecl;

    return out;
}

const _sharedBasis: OrbitalBasis = { px: 1, py: 0, pz: 0, qx: 0, qy: 0, qz: -1 };

/**
 * Computes a point along the 3D orbit curve at eccentric/parametric angle E in [0, 2*PI].
 */
export function computeKeplerianOrbitPoint(
    E: number,
    semiMajorAxis: number,
    eccentricity: number,
    inclinationDeg: number = 0,
    longitudeOfPerihelionDeg: number = 0,
    longitudeOfAscendingNodeDeg: number = 0,
    precomputedBasis?: OrbitalBasis
): { x: number; y: number; z: number } {
    const basis = precomputedBasis ?? getOrbitalBasis(
        inclinationDeg,
        longitudeOfPerihelionDeg,
        longitudeOfAscendingNodeDeg,
        _sharedBasis
    );
    const b = semiMajorAxis * Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity));
    const xp = semiMajorAxis * (Math.cos(E) - eccentricity);
    const yp = b * Math.sin(E);

    return {
        x: basis.px * xp + basis.qx * yp,
        y: basis.py * xp + basis.qy * yp,
        z: basis.pz * xp + basis.qz * yp
    };
}

/**
 * Computes the 3D Keplerian position and normalized orbital velocity tangent vector
 * from mean longitude L (radians) with zero heap allocations when `out` is provided.
 *
 * When `useCircularRadius` is true (schematic visual spacing), the true anomaly nu is
 * still solved from `trueEccentricity` so the body's heliocentric direction matches
 * real astronomy while staying strictly on its non-intersecting schematic orbit circle.
 */
export function computeKeplerianState(
    meanLongitudeRad: number,
    semiMajorAxis: number,
    trueEccentricity: number = 0,
    useCircularRadius: boolean = false,
    inclinationDeg: number = 0,
    longitudeOfPerihelionDeg: number = 0,
    longitudeOfAscendingNodeDeg: number = 0,
    dir: number = 1,
    out: KeplerianState = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: -1 },
    precomputedBasis?: OrbitalBasis
): KeplerianState {
    const basis = precomputedBasis ?? getOrbitalBasis(
        inclinationDeg,
        longitudeOfPerihelionDeg,
        longitudeOfAscendingNodeDeg,
        _sharedBasis
    );

    const omegaBar = longitudeOfPerihelionDeg * DEG_TO_RAD;
    let M = (meanLongitudeRad - omegaBar) % TWO_PI;
    if (M > Math.PI) M -= TWO_PI;
    if (M < -Math.PI) M += TWO_PI;

    const e = Math.max(0, Math.min(0.999999, trueEccentricity));
    const E = e > 0 ? solveKepler(M, e) : M;
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const sqrtOneMinusESq = Math.sqrt(Math.max(0, 1 - e * e));

    let xp: number;
    let yp: number;
    let vxp: number;
    let vyp: number;

    if (useCircularRadius) {
        const dx = cosE - e;
        const dy = sqrtOneMinusESq * sinE;
        const rNorm = Math.hypot(dx, dy) || 1;
        const cosNu = dx / rNorm;
        const sinNu = dy / rNorm;
        xp = semiMajorAxis * cosNu;
        yp = semiMajorAxis * sinNu;
        vxp = -sinNu * dir;
        vyp = cosNu * dir;
    } else {
        xp = semiMajorAxis * (cosE - e);
        yp = semiMajorAxis * sqrtOneMinusESq * sinE;
        vxp = -sinE * dir;
        vyp = sqrtOneMinusESq * cosE * dir;
    }

    out.x = basis.px * xp + basis.qx * yp;
    out.y = basis.py * xp + basis.qy * yp;
    out.z = basis.pz * xp + basis.qz * yp;

    const rawTx = basis.px * vxp + basis.qx * vyp;
    const rawTy = basis.py * vxp + basis.qy * vyp;
    const rawTz = basis.pz * vxp + basis.qz * vyp;
    const tLen = Math.hypot(rawTx, rawTy, rawTz) || 1;

    out.tx = rawTx / tLen;
    out.ty = rawTy / tLen;
    out.tz = rawTz / tLen;

    return out;
}
