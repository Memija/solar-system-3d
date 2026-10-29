export const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const fragmentShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

// Simplex 3D Noise by Ian McEwan, Ashima Arts
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
    // Normalize local sphere direction so noise frequency is scale-invariant
    vec3 dir = normalize(vPosition);

    // Multi-octave convective photosphere granulation & supergranulation
    float n1 = snoise(dir * 3.2 + vec3(time * 0.11, time * 0.08, -time * 0.05));
    float n2 = snoise(dir * 7.5 - vec3(time * 0.06, time * 0.16, time * 0.12));
    float n3 = snoise(dir * 16.0 + vec3(time * 0.22, -time * 0.09, time * 0.19));
    float gran = snoise(dir * 34.0 - vec3(time * 0.28, time * 0.21, 0.0));

    float combinedNoise = n1 * 0.45 + n2 * 0.28 + n3 * 0.17 + gran * 0.10;

    // HDR Photosphere Palette (drives organic ACES-toned UnrealBloom across the solar disk)
    vec3 colorUmbra  = vec3(0.72, 0.20, 0.03); // Cooler convective intergranular lanes / active regions
    vec3 colorMid    = vec3(1.22, 0.68, 0.14); // Blazing golden photosphere
    vec3 colorBright = vec3(1.52, 1.18, 0.48); // Hot convective granule tops
    vec3 colorPlage  = vec3(1.78, 1.58, 1.15); // Magnetic plage / faculae hot spots

    vec3 photosphere = mix(colorUmbra, colorMid, smoothstep(-0.62, -0.05, combinedNoise));
    photosphere = mix(photosphere, colorBright, smoothstep(-0.05, 0.45, combinedNoise));
    photosphere = mix(photosphere, colorPlage, smoothstep(0.45, 0.92, combinedNoise));

    // Astrophysical Solar Limb Darkening:
    // At disk center (mu = 1), line of sight penetrates deeper, hotter photosphere layers;
    // near the limb (mu -> 0), higher, cooler, redder optical depth tau ~ 1 dominates.
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float mu = clamp(dot(normal, viewDir), 0.0, 1.0);
    float limbDarkening = 0.42 + 0.58 * pow(mu, 0.62);

    // Wavelength-dependent limb reddening (shorter blue/green wavelengths darken faster than red)
    vec3 limbTint = mix(vec3(1.0, 0.58, 0.24), vec3(1.0, 1.0, 1.0), pow(mu, 0.48));
    vec3 finalColor = photosphere * limbDarkening * limbTint;

    // Thin chromospheric spicule transition rim right at grazing incidence
    float grazing = pow(1.0 - mu, 5.0);
    float spicule = 0.75 + 0.25 * n3;
    finalColor += vec3(1.15, 0.36, 0.08) * grazing * spicule * 0.55;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;
