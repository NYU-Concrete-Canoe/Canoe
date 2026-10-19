/* Direct photographic projection. Source JPEGs stay unchanged; each side has its
   own length/height calibration. Occluded areas use an approximate base paint. */
window.createPhotographicHull = function (base, makeTexture, render) {
  'use strict';
  var material = window.applyConcreteMaterial(base.clone());
  var uniforms = {
    hullPhotoA: { value: null }, hullPhotoB: { value: null },
    hullPaintEnabled: { value: 0 }
  };
  var concreteShader = material.onBeforeCompile;
  material.onBeforeCompile = function (shader) {
    concreteShader(shader);
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D hullPhotoA;
      uniform sampler2D hullPhotoB;
      uniform float hullPaintEnabled;
      float coveredStand(vec2 pixel, vec4 bounds) {
        float horizontal = smoothstep(bounds.x-4.0,bounds.x+4.0,pixel.x)
          * (1.0-smoothstep(bounds.y-4.0,bounds.y+4.0,pixel.x));
        return horizontal * smoothstep(bounds.z-2.0,bounds.z+3.0,pixel.y);
      }
    `).replace('float mottle =', `
      if (hullPaintEnabled > 0.5) {
        float along = clamp(vConcretePoint.x / 7.6 + 0.5, 0.0, 1.0);
        float endRise = pow(abs(along*2.0-1.0),2.5);
        float bottom = 0.08 + 0.27*endRise;
        float depth = 0.46 + 0.13*pow(abs(along*2.0-1.0),3.0);
        float height = clamp((vConcretePoint.y-bottom)/depth,0.0,1.0);
        vec2 pixel;
        vec3 pigment;
        float occluded;
        if (vConcretePoint.z >= 0.0) {
          pixel.x = mix(72.0,1158.0,along);
          float upper = mix(354.0,373.0,along);
          float lower = mix(399.0,423.0,along)+12.0*sin(3.14159265*along);
          pixel.y = mix(lower,upper+3.0,height);
          pigment = texture2D(hullPhotoA,vec2(pixel.x/1320.0,1.0-pixel.y/776.0)).rgb;
          occluded = max(coveredStand(pixel,vec4(157.0,282.0,397.0,0.0)),
                         coveredStand(pixel,vec4(944.0,1056.0,416.0,0.0)));
        } else {
          float across = 1.0-along;
          pixel.x = mix(84.0,1245.0,across);
          float upper = mix(429.0,406.0,across);
          float lower = mix(472.0,451.0,across)+33.0*sin(3.14159265*across);
          pixel.y = mix(lower,upper+3.0,height);
          pigment = texture2D(hullPhotoB,vec2(pixel.x/1320.0,1.0-pixel.y/838.0)).rgb;
          occluded = max(coveredStand(pixel,vec4(186.0,321.0,463.0,0.0)),
                         coveredStand(pixel,vec4(997.0,1130.0,454.0,0.0)));
        }
        // The stands hide some paint in the photographs: use plain blue there,
        // rather than projecting the yellow supports or inventing floral details.
        pigment = mix(pigment,vec3(0.60,0.74,0.76),occluded);
        // A side photograph contains no underside artwork. Blend into the base
        // paint at the keel instead of stretching its last row around the bottom.
        pigment = mix(vec3(0.60,0.74,0.76),pigment,smoothstep(0.06,0.24,height));
        diffuseColor.rgb = pow(pigment,vec3(2.2));
      }
      float mottle =`);
  };
  material.customProgramCacheKey = function () { return 'direct-photo-hull-v2'; };
  var selector = document.getElementById('hullFinish');
  var caption = document.querySelector('.product-caption');
  var status = document.getElementById('hullPhotoStatus');
  var ready = false;
  var request;
  function image(path) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(makeTexture(img)); };
      img.onerror = function () { reject(new Error('Hull photograph unavailable')); };
      img.src = path;
    });
  }
  function update() {
    var painted = ready && selector && selector.value === 'chrysalis';
    uniforms.hullPaintEnabled.value = painted ? 1 : 0;
    if (caption) caption.textContent = painted
      ? 'Chrysalis, 2026 · Photographic artwork on an illustrative hull'
      : 'Fig. 01 — Illustrative hull concept.';
    var name = document.getElementById('hullDesignName');
    var year = document.getElementById('hullDesignYear');
    if (name) name.textContent = painted ? 'Chrysalis' : 'Bare concrete';
    if (year) year.textContent = painted ? '2026' : '—';
    render();
  }
  function select() {
    if (!selector || selector.value !== 'chrysalis') { update(); return; }
    if (ready) { update(); return; }
    if (request) return;
    if (status) status.textContent = 'Loading photographs…';
    request = Promise.all([
      image('assets/img/hull-artwork/chrysalis-side-a.jpeg'),
      image('assets/img/hull-artwork/chrysalis-side-b.jpeg')
    ]).then(function (textures) {
      uniforms.hullPhotoA.value = textures[0]; uniforms.hullPhotoB.value = textures[1];
      ready = true;
      if (status) status.textContent = '';
      update();
    }).catch(function () {
      request = null;
      selector.value = 'concrete';
      if (status) status.textContent = 'Photographs unavailable. Showing bare concrete.';
      update();
    });
  }
  if (selector) selector.addEventListener('change', select);
  setTimeout(select,0);
  return material;
};
