/* Object-space procedural concrete: fine aggregate, mottling and shallow pores. */
window.applyConcreteMaterial = function (material) {
  material.onBeforeCompile = function (shader) {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vConcretePoint;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvConcretePoint = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vConcretePoint;
      float concreteHash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
      float concreteNoise(vec3 p) {
        vec3 cell = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(concreteHash(cell), concreteHash(cell+vec3(1,0,0)),f.x),
          mix(concreteHash(cell+vec3(0,1,0)),concreteHash(cell+vec3(1,1,0)),f.x),f.y),
          mix(mix(concreteHash(cell+vec3(0,0,1)),concreteHash(cell+vec3(1,0,1)),f.x),
          mix(concreteHash(cell+vec3(0,1,1)),concreteHash(cell+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float concreteRelief(vec3 p) {
        return concreteNoise(p*100.0)*0.0008 - smoothstep(0.72,0.89,concreteNoise(p*52.0))*0.0015;
      }
    `).replace('#include <color_fragment>', `#include <color_fragment>
      float mottle = concreteNoise(vConcretePoint*6.0);
      float aggregate = concreteNoise(vConcretePoint*95.0);
      float pores = smoothstep(0.72,0.89,concreteNoise(vConcretePoint*52.0));
      diffuseColor.rgb *= 0.77 + mottle*0.24 + aggregate*0.16 - pores*0.27;
    `).replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
      float relief = concreteRelief(vConcretePoint);
      vec3 dpdx = dFdx(-vViewPosition), dpdy = dFdy(-vViewPosition);
      vec3 r1 = cross(dpdy, normal), r2 = cross(normal, dpdx);
      float determinant = dot(dpdx, r1);
      normal = normalize(abs(determinant)*normal - sign(determinant)*(dFdx(relief)*r1 + dFdy(relief)*r2));
    `);
  };
  return material;
};
