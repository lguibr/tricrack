if(!self.define){let e,s={};const i=(i,c)=>(i=new URL(i+".js",c).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(c,t)=>{const n=e||("document"in self?document.currentScript.src:"")||location.href;if(s[n])return;let a={};const f=e=>i(e,n),r={module:{uri:n},exports:a,require:f};s[n]=Promise.all(c.map((e=>r[e]||f(e)))).then((e=>(t(...e),a)))}}define(["./workbox-2ba0fb17"],(function(e){"use strict";importScripts(),e.enable(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/DragDropTouch.js",revision:"3d8ed227d4a47520d821579eadc3c6a3"},{url:"/_next/static/7et7TuKEP5jbdvzRODCf0/_buildManifest.js",revision:"2ec694eb52ae4f523f265a46bae4d768"},{url:"/_next/static/7et7TuKEP5jbdvzRODCf0/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/23-f81d8d5897167c5d.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/388.cb4d624b1cde1946.js",revision:"cb4d624b1cde1946"},{url:"/_next/static/chunks/41-9398b2bc6b2def39.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/648.29279b028b3e3961.js",revision:"29279b028b3e3961"},{url:"/_next/static/chunks/app/_not-found/page-2959bb04d3fe59d6.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/app/layout-9c316b0d89d76208.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/app/page-cc0a952d6808ee2c.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/fd9d1056-b65947d3417b8eff.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/framework-f66176bb897dc684.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/main-4890ba63bada9612.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/main-app-1a2874ff0f2daf77.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/pages/_app-6a626577ffa902a4.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/pages/_error-1be831200e60c5c0.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js",revision:"79330112775102f91e1010318bae2bd3"},{url:"/_next/static/chunks/webpack-42eeda7211834096.js",revision:"7et7TuKEP5jbdvzRODCf0"},{url:"/_next/static/css/18881dd9d3b90590.css",revision:"18881dd9d3b90590"},{url:"/_next/static/media/05a31a2ca4975f99-s.woff2",revision:"f1b44860c66554b91f3b1c81556f73ca"},{url:"/_next/static/media/513657b02c5c193f-s.woff2",revision:"c4eb7f37bc4206c901ab08601f21f0f2"},{url:"/_next/static/media/51ed15f9841b9f9d-s.woff2",revision:"bb9d99fb9bbc695be80777ca2c1c2bee"},{url:"/_next/static/media/c9a5bc6a7c948fb0-s.p.woff2",revision:"74c3556b9dad12fb76f84af53ba69410"},{url:"/_next/static/media/d6b16ce4a6175f26-s.woff2",revision:"dd930bafc6297347be3213f22cc53d3e"},{url:"/_next/static/media/ec159349637c90ad-s.woff2",revision:"0e89df9522084290e01e4127495fae99"},{url:"/_next/static/media/fd4db3eb5472fc27-s.woff2",revision:"71f3fcaf22131c3368d9ec28ef839831"},{url:"/android-chrome-192x192.png",revision:"019938603875d021c2fbaff3ca175b95"},{url:"/android-chrome-512x512.png",revision:"09a5860874461c586f32233dfa8ef61a"},{url:"/apple-touch-icon.png",revision:"341a58a1a29d1d1b108c1b30d91eea7c"},{url:"/favicon-16x16.png",revision:"e6c5541fbfc7ec3b90f2c4dae17b41d8"},{url:"/favicon-32x32.png",revision:"38b956e5bc9fb2e09bef7115d5a86f4f"},{url:"/favicon.ico",revision:"6f04f53ed626462ba22a500eed87ba28"},{url:"/favicon.png",revision:"5887cb7bef6de5d0ccd436c50ee57f66"},{url:"/manifest.json",revision:"685a574cb7b4b1eb749fd5327422a9fb"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/restart.png",revision:"baded87617dc4e53fb72c1eb9741d6ae"},{url:"/undo.png",revision:"b9e4cb358fe2ede708afe78a5551169c"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:i,state:c})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https?.*/,new e.NetworkFirst({cacheName:"offlineCache",plugins:[new e.ExpirationPlugin({maxEntries:200})]}),"GET"),e.registerRoute(/^http?.*/,new e.NetworkFirst({cacheName:"offlineCache",plugins:[new e.ExpirationPlugin({maxEntries:200})]}),"GET")}));
