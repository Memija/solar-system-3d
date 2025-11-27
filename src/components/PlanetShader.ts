export const planetVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const planetFragmentShader = `
uniform float time;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform int planetType; // 0 = Rocky, 1 = Gas Giant, 2 = Ice Giant
uniform vec3 lightDirection;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

// Simplex 3D Noise 
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    vec3 finalColor = vec3(0.0);
    
    if (planetType == 1) { // Gas Giant (Jupiter/Saturn)
        // Bands based on Y position + noise
        float noiseVal = snoise(vPosition * 0.02 + vec3(time * 0.05, 0.0, 0.0));
        float band = sin(vPosition.y * 0.1 + noiseVal * 2.0);
        
        // Mix colors based on bands
        finalColor = mix(color1, color2, smoothstep(-0.5, 0.5, band));
        finalColor = mix(finalColor, color3, smoothstep(0.5, 1.0, snoise(vPosition * 0.1))); // Add spots
        
    } else if (planetType == 2) { // Ice Giant (Uranus/Neptune)
        // Smooth gradient + subtle noise
        float noiseVal = snoise(vPosition * 0.05 + vec3(time * 0.02));
        finalColor = mix(color1, color2, smoothstep(-1.0, 1.0, noiseVal));
        
    } else { // Rocky (Mercury/Venus/Mars)
        // Crater-like noise
        float noiseVal = snoise(vPosition * 0.1);
        float noiseVal2 = snoise(vPosition * 0.5);
        
        float combined = noiseVal + noiseVal2 * 0.5;
        finalColor = mix(color1, color2, smoothstep(-0.5, 0.5, combined));
        finalColor = mix(finalColor, color3, smoothstep(0.5, 1.0, combined));
    }
    
    // Basic Lighting
    // Assume light comes from (0,0,0) - The Sun
    // In world space, Sun is at 0,0,0. vPosition is local.
    // We need to pass light direction or calculate it.
    // For simplicity, let's assume standard Lambertian diffuse from a fixed direction or passed uniform.
    // Actually, since planets orbit, the light direction changes in local space.
    // But for now, let's just make them self-luminous or ambiently lit to avoid "gray patches"
    // The user wants to REMOVE gray patches, so we should avoid harsh shadows.
    
    // Let's add a "fake" lighting that always looks good
    // Or just use the calculated color as "albedo" and let Three.js lights handle it?
    // No, ShaderMaterial replaces everything. We need to implement lighting.
    
    // Simple ambient + diffuse
    vec3 lightDir = normalize(vec3(0.0) - vPosition); // Light from center (Sun) ? No, vPosition is local.
    // We'll just output the color for now, making them look "painted" but clean.
    // To make it look 3D, we can add a simple rim light or gradient.
    
    float intensity = 1.0; // Full brightness to avoid gray patches
    
    gl_FragColor = vec4(finalColor * intensity, 1.0);
}
`;
