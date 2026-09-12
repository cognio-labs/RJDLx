
/* ===== RJDLx bundle part 1 (original order kept) ===== */
/* RJDLx — cinematic scroll engine */
(function(){
  "use strict";
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  /* ---------- Preloader ---------- */
  const preloader = $("#preloader"), loadCount = $("#loadCount"), loadBar = $("#loadBar");
  let prog = 0;
  document.body.style.overflow = "hidden";
  const tick = setInterval(()=>{
    prog += Math.random()*22 + 16;
    if(prog >= 100){ prog = 100; clearInterval(tick);
      setTimeout(()=>{
        preloader.classList.add("done");
        document.body.style.overflow = "";
        heroIntro();
      }, 60);
    }
    loadCount.textContent = String(Math.floor(prog)).padStart(2,"0");
    loadBar.style.width = prog + "%";
  }, 20);

  function heroIntro(){
    // re-trigger hero title animation
    $$(".ht-line span").forEach(el=>{ el.style.animation="none"; void el.offsetWidth; el.style.animation=""; });
  }

  /* ---------- Custom cursor ---------- */
  const cursor = $("#cursor"), cursorLabel = $(".cursor-label");
  let cx=innerWidth/2, cy=innerHeight/2, tx=cx, ty=cy, cReq=false;
  const finePointer = matchMedia("(hover:hover) and (pointer:fine)").matches;
  function updateCursor(){
    cx += (tx-cx)*0.2; cy += (ty-cy)*0.2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    if(Math.abs(tx-cx) > 0.2 || Math.abs(ty-cy) > 0.2){
      requestAnimationFrame(updateCursor);
    } else { cReq = false; }
  }
  if(finePointer){
    cursor.style.top = "0px"; cursor.style.left = "0px";
    addEventListener("mousemove", e=>{
      tx=e.clientX; ty=e.clientY;
      if(!cReq){ cReq = true; requestAnimationFrame(updateCursor); }
    }, {passive:true});
  } else { cursor.style.display = "none"; }
  function bindCursor(){
    if(!finePointer) return;
    $$("[data-cursor]").forEach(el=>{
      el.addEventListener("mouseenter", ()=>{ cursorLabel.textContent = el.dataset.cursor; cursor.classList.add("is-hover"); });
      el.addEventListener("mouseleave", ()=>{ cursor.classList.remove("is-hover"); });
    });
  }
  bindCursor();

  /* nav + mobile menu handled by nav.js */

  /* ---------- HERO : scroll-driven MATERIAL→SPACE ---------- */
  const heroWrap = $("#heroWrap");
  const layers = $$(".hero-layer");
  const stages = $$("#heroStages .stage");
  const heroCenter = $("#heroCenter");
  const heroProgress = $("#heroProgress");
  const heroCaption = $("#heroCaption");
  const captions = [
    "01 — Bronze and shadow, composed. Almost architecture.",
    "02 — Brass, drawn into a chair.",
    "03 — Sculpted metal, engineered form.",
    "04 — Out of the box, into the room.",
    "05 — Light, freed from the surface.",
    "06 — Everything, composed into space."
  ];
  // stage mapping: layer index -> stage index highlight
  const stageForLayer = [0,1,2,3,4,5];

  function heroUpdate(){
    if(!heroWrap) return;
    const rect = heroWrap.getBoundingClientRect();
    const total = rect.height - innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const p = total > 0 ? scrolled/total : 0;
    heroProgress.style.width = (p*100)+"%";

    const n = layers.length;
    const exact = p * (n-1);
    const idx = Math.round(exact);

    layers.forEach((l,i)=> l.classList.toggle("is-active", i===idx));
    // subtle parallax zoom on active layer
    layers.forEach((l,i)=>{
      const img = l.querySelector("img");
      if(i===idx){
        const frac = exact - idx; // -0.5..0.5
        img.style.transform = `scale(${1 + Math.abs(frac)*0.12})`;
      }
    });

    const sIdx = stageForLayer[idx] ?? 0;
    stages.forEach((s,i)=> s.classList.toggle("is-on", i===sIdx));
    if(heroCaption.textContent !== captions[idx]) heroCaption.textContent = captions[idx];

    // fade hero text after first 12%
    heroCenter.classList.toggle("fade", p > 0.1);
  }
  if(heroWrap){ addEventListener("scroll", heroUpdate, {passive:true}); heroUpdate(); }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, {threshold:0.12, rootMargin:"0px 0px -6% 0px"});
  $$(".reveal, .reveal-img").forEach(el=> io.observe(el));

  /* ---------- Parallax (foreground cards + full-bleed bg) ---------- */
  const pEls = $$(".parallax");
  const bgEls = $$(".parallax-bg");
  let pTicking = false;
  function parallax(){
    const vh = innerHeight;
    pEls.forEach(el=>{
      const r = el.getBoundingClientRect();
      if(r.bottom < 0 || r.top > vh) return;
      const c = (r.top + r.height/2 - vh/2) / vh; // -0.5..0.5
      const img = el.querySelector("img");
      if(img) img.style.translate = `0 ${c * -34}px`;
    });
    bgEls.forEach(img=>{
      const sec = img.parentElement;
      const r = sec.getBoundingClientRect();
      if(r.bottom < 0 || r.top > vh) return;
      const c = (r.top + r.height/2 - vh/2) / (vh + r.height);
      img.style.translate = `0 ${c * -90}px`;
    });
    pTicking = false;
  }
  addEventListener("scroll", ()=>{
    if(!pTicking){ pTicking = true; requestAnimationFrame(parallax); }
  }, {passive:true});

  /* ---------- Process: drag to scroll ---------- */
  const track = $("#processTrack");
  if(track){
    let down=false, sx=0, sl=0;
    track.addEventListener("pointerdown", e=>{ if(e.pointerType && e.pointerType!=="mouse") return; down=true; sx=e.clientX; sl=track.scrollLeft; try{ track.setPointerCapture(e.pointerId); }catch(_){} });
    track.addEventListener("pointermove", e=>{ if(!down) return; track.scrollLeft = sl - (e.clientX - sx); });
    ["pointerup","pointercancel","pointerleave"].forEach(ev=> track.addEventListener(ev, ()=> down=false));
  }

  /* ---------- Collection floating preview ---------- */
  const collList = $("#collList"), collFloat = $("#collFloat"), collFloatImg = $("#collFloatImg");
  if(collList && collFloat){
    let fx=0, fy=0, ftx=0, fty=0, fActive=false, fReq=false;
    function loopFloat(){
      fx += (ftx-fx)*0.18; fy += (fty-fy)*0.18;
      collFloat.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
      if(fActive || Math.abs(ftx-fx) > 0.5 || Math.abs(fty-fy) > 0.5){
        requestAnimationFrame(loopFloat);
      } else { fReq = false; }
    }
    collFloat.style.top = "0px"; collFloat.style.left = "0px";
    addEventListener("mousemove", e=>{
      ftx=e.clientX+28; fty=e.clientY-160;
      if(fActive && !fReq){ fReq = true; requestAnimationFrame(loopFloat); }
    }, {passive:true});
    $$(".coll-row").forEach(row=>{
      row.addEventListener("mouseenter", ()=>{
        const key = row.dataset.img;
        const src = (window.__IMG && window.__IMG[key]) || key;
        if(src) collFloatImg.src = src;
        collFloat.classList.add("show");
        fActive = true;
        if(!fReq){ fReq = true; requestAnimationFrame(loopFloat); }
      });
      row.addEventListener("mouseleave", ()=>{
        collFloat.classList.remove("show");
        fActive = false;
      });
    });
  }

  /* ---------- Smooth anchor offset ---------- */
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener("click", e=>{
      const id = a.getAttribute("href");
      if(id.length < 2) return;
      const t = document.querySelector(id);
      if(t){ e.preventDefault(); t.scrollIntoView({behavior:"smooth"}); }
    });
  });
})();

/* ===== RJDLx bundle part 2 (original order kept) ===== */
/* RJDLx subpages — accordion, stories, forms, active nav */
(function(){
  "use strict";
  const $ = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));

  /* active nav */
  const page = document.body.dataset.page;
  if(page){
    const link = document.querySelector(`[data-nav="${page}"]`);
    if(link) link.classList.add("active");
  }

  /* generic accordion (FAQ + journal stories) */
  $$("[data-acc]").forEach(item=>{
    const head = $(".acc-head", item);
    if(!head) return;
    head.addEventListener("click", ()=>{
      const parent = item.parentElement;
      const siblings = parent ? Array.from(parent.children).filter(el=>el!==item && el.hasAttribute("data-acc")) : [];
      siblings.forEach(s=>s.classList.remove("open"));
      item.classList.toggle("open");
    });
  });

  /* enquiry forms → compose email + success state (wire to Formspree/Netlify later) */
  $$(".rj-form").forEach(form=>{
    form.addEventListener("submit", e=>{
      e.preventDefault();
      const required = $$("[required]", form).filter(f=>!f.value.trim());
      if(required.length){
        required[0].focus();
        required.forEach(f=>f.style.borderColor="#a33");
        setTimeout(()=>required.forEach(f=>f.style.borderColor=""), 2200);
        return;
      }
      const data = new FormData(form);
      const lines = [];
      const label = n => (form.querySelector(`[name="${n}"]`)||{}).dataset?.label || n;
      for(const [k,v] of data.entries()){
        if(v && String(v).trim()) lines.push(`${label(k)}: ${String(v).trim()}`);
      }
      const subject = encodeURIComponent(form.dataset.subject || "New enquiry — RJDLx website");
      const body = encodeURIComponent(lines.join("\n"));
      const to = form.dataset.to || "hello@rjdlx.com";
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      const shell = form.closest(".form-shell");
      form.style.display = "none";
      const ok = $(".form-success", shell);
      if(ok) ok.classList.add("show");
    });
  });

  /* footer year */
  $$(".js-year").forEach(el=>el.textContent = new Date().getFullYear());
})();

/* ===== RJDLx bundle part 3 (original order kept) ===== */
/* RJDLx NAV SYSTEM v2 — panels, modal, dots, pill, mobile */
(function(){
  "use strict";
  const $ = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));
  const header = $("#nav"), menuBtn = $("#menuBtn"), mobileMenu = $("#mobileMenu");
  const fine = matchMedia("(hover:hover)").matches;
  const isHome = !!$("#heroWrap");

  /* ---------- editorial panels ---------- */
  const panels = {collections: $("#panel-collections"), studio: $("#panel-studio")};
  const tops = $$(".nav-top");
  let openName = null, closeT = null;
  function openPanel(name){
    clearTimeout(closeT);
    if(openName === name) return;
    closePanels(true);
    openName = name;
    const p = panels[name];
    if(p){ p.classList.add("open"); p.setAttribute("aria-hidden","false"); }
    tops.forEach(t=>t.classList.toggle("on", t.dataset.menu===name));
  }
  function closePanels(instant){
    clearTimeout(closeT);
    const shut = ()=>{ openName=null;
      Object.values(panels).forEach(p=>{ if(p){ p.classList.remove("open"); p.setAttribute("aria-hidden","true"); }});
      tops.forEach(t=>t.classList.remove("on"));
    };
    if(instant) shut(); else closeT = setTimeout(shut, 180);
  }
  tops.forEach(btn=>{
    const name = btn.dataset.menu;
    btn.addEventListener("mouseenter", ()=>{ if(fine && innerWidth>960) openPanel(name); });
    btn.addEventListener("mouseleave", ()=>closePanels());
    btn.addEventListener("click", e=>{ e.stopPropagation(); openName===name ? closePanels(true) : openPanel(name); });
    btn.addEventListener("focus", ()=>openPanel(name));
  });
  Object.values(panels).forEach(p=>{
    if(!p) return;
    p.addEventListener("mouseenter", ()=>clearTimeout(closeT));
    p.addEventListener("mouseleave", ()=>closePanels());
  });
  document.addEventListener("click", e=>{
    if(openName && !e.target.closest(".npanel") && !e.target.closest(".nav-top")) closePanels(true);
  });

  /* ---------- mobile menu ---------- */
  function closeMobile(){ mobileMenu.classList.remove("open"); menuBtn.classList.remove("x"); document.body.classList.remove("menu-open"); }
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.addEventListener("click", ()=>{
    const open = mobileMenu.classList.toggle("open");
    menuBtn.classList.toggle("x", open);
    document.body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  addEventListener("resize", ()=>{ if(innerWidth > 960) closeMobile(); });
  $$("#mobileMenu a").forEach(a=>a.addEventListener("click", closeMobile));

  document.addEventListener("keydown", e=>{
    if(e.key==="Escape"){ closePanels(true); closeEnq(); closeMobile(); if(ctaFloat) ctaFloat.classList.remove("pop"); }
  });

  /* ---------- enquire overlay ---------- */
  const overlay = $("#enqOverlay"), enqForm = $("#enqForm"), enqSuccess = $("#enqSuccess");
  function openEnq(preset, msg){
    closePanels(true); closeMobile(); if(ctaFloat) ctaFloat.classList.remove("pop");
    $$(".enq-checks input", overlay).forEach(b=>{ b.checked = !!preset && b.value === preset; });
    if(msg){ const ta = $("#enqMsg"); if(ta) ta.value = msg + "\n\n"; }
    enqForm.style.display = ""; enqSuccess.classList.remove("show");
    overlay.classList.add("open"); overlay.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
  }
  function closeEnq(){ overlay.classList.remove("open"); overlay.setAttribute("aria-hidden","true"); document.body.classList.remove("modal-open"); }
  window.__openEnq = openEnq;
  $$("[data-enquire]").forEach(el=>el.addEventListener("click", ()=>openEnq(el.dataset.enq, el.dataset.msg)));
  $("#enqClose").addEventListener("click", closeEnq);
  overlay.addEventListener("click", e=>{ if(e.target===overlay) closeEnq(); });
  enqForm.addEventListener("submit", e=>{
    e.preventDefault();
    const name=$("#enqName"), email=$("#enqEmail"), msg=$("#enqMsg");
    let bad = [name,email,msg].filter(f=>!f.value.trim());
    if(email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) bad.push(email);
    if(bad.length){ bad.forEach(f=>f.style.borderColor="#a33"); bad[0].focus();
      setTimeout(()=>bad.forEach(f=>f.style.borderColor=""),2200); return; }
    const types = $$(".enq-checks input:checked", enqForm).map(b=>b.value);
    const lines = [
      "Interested in: " + (types.join(", ") || "—"),
      "Name: " + name.value.trim(),
      "Company: " + ($("#enqCo").value.trim() || "—"),
      "Email: " + email.value.trim(),
      "", msg.value.trim()
    ];
    window.location.href = "mailto:hello@rjdlx.com?subject=" + encodeURIComponent("Enquiry — RJDLx") + "&body=" + encodeURIComponent(lines.join("\n"));
    enqForm.style.display = "none"; enqSuccess.classList.add("show");
  });

  /* ---------- persistent project pill ---------- */
  const ctaFloat = $("#ctaFloat"), ctaPill = $("#ctaPill");
  ctaPill.addEventListener("click", ()=>ctaFloat.classList.toggle("pop"));
  $$("#ctaPop button").forEach(b=>b.addEventListener("click", ()=>openEnq(b.dataset.enq)));
  document.addEventListener("click", e=>{
    if(ctaFloat.classList.contains("pop") && !e.target.closest(".cta-float")) ctaFloat.classList.remove("pop");
  });

  /* ---------- scroll: solid header + pill visibility ---------- */
  function onScroll(){
    header.classList.toggle("scrolled", scrollY > 40);
    const past = isHome ? scrollY > innerHeight*0.75 : scrollY > 480;
    ctaFloat.classList.toggle("show", past);
  }
  addEventListener("scroll", onScroll, {passive:true}); onScroll();

  /* ---------- homepage section dots ---------- */
  const dots = $("#dots");
  if(dots){
    const links = $$("a", dots);
    const map = new Map(links.map(a=>[a.dataset.sec, a]));
    const io = new IntersectionObserver(entries=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          links.forEach(a=>a.classList.remove("on"));
          const a = map.get(en.target.id);
          if(a) a.classList.add("on");
        }
      });
    }, {rootMargin:"-40% 0px -55% 0px"});
    ["material","furniture","light","architect","india","process","custom"].forEach(id=>{
      const s = document.getElementById(id); if(s) io.observe(s);
    });
  }

  /* ---------- custom page pathway presets ---------- */
  $$("[data-preset]").forEach(a=>a.addEventListener("click", ()=>{
    const r = document.getElementById(a.dataset.preset);
    if(r) r.checked = true;
  }));
})();

/* ===== RJDLx bundle part 4 (original order kept) ===== */
/* RJDLx product pages — gallery + finishes (view-scoped, mobile-safe) */
(function(){
  "use strict";
  const $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));
  const M = window.__IMG || {};
  $$(".page-view").forEach(view=>{
    const main = view.querySelector("#gMain");
    if(main){
      const img = main.querySelector("img");
      const cap = view.querySelector("#gCap");
      const btns = Array.from(view.querySelectorAll(".g-thumbs button"));
      btns.forEach(btn=>{
        btn.addEventListener("click", ()=>{
          if(btn.classList.contains("on")) return;
          btns.forEach(b=>b.classList.remove("on"));
          btn.classList.add("on");
          main.classList.add("swap");
          const key = btn.getAttribute("data-im");
          const src = (key && M[key]) || btn.getAttribute("data-src");
          const label = btn.getAttribute("data-label") || "";
          const apply = ()=>{
            if(src) img.src = src;
            img.style.transform = btn.hasAttribute("data-zoom") ? "scale(2.1)" : "";
            img.style.transformOrigin = btn.getAttribute("data-origin") || "50% 50%";
            if(cap) cap.textContent = label;
            main.classList.remove("swap");
          };
          if(src){ const pre = new Image(); pre.onload = apply; pre.onerror = ()=>main.classList.remove("swap"); pre.src = src; }
          else main.classList.remove("swap");
        });
      });
    }
    const shown = view.querySelector("#finishName");
    const sws = Array.from(view.querySelectorAll(".sw"));
    sws.forEach(sw=>{
      sw.addEventListener("click", ()=>{
        sws.forEach(s=>s.classList.remove("on"));
        sw.classList.add("on");
        if(shown) shown.textContent = sw.getAttribute("data-name") || "";
      });
    });
  });
})();

/* ===== RJDLx bundle part 5 (original order kept) ===== */
/* SWAP PLACEHOLDER IMAGES — resolve data-im, data-img, data-src with window.__IMG */
var __loadViewImages;
(function(){
  "use strict";
  var M = window.__IMG || {};
  function loadScope(scope){
    if(!scope) return;
    scope.querySelectorAll("img[data-im]").forEach(function(i){
      var k = i.getAttribute("data-im");
      if(M[k] && i.getAttribute("src") !== M[k]){
        if(!i.hasAttribute("fetchpriority")){
          if(!i.hasAttribute("loading")) i.setAttribute("loading", "lazy");
          if(!i.hasAttribute("decoding")) i.setAttribute("decoding", "async");
        }
        i.src = M[k];
      }
    });
    ["data-img","data-src"].forEach(function(at){
      scope.querySelectorAll("["+at+"]").forEach(function(el){
        var v = el.getAttribute(at);
        if(M[v]) el.setAttribute(at, M[v]);
      });
    });
  }
  __loadViewImages = loadScope;

  // 1. Load active view immediately (Home)
  var active = document.querySelector('.page-view:not([hidden])') || document.querySelector('[data-view="home"]');
  loadScope(active);
  // Also load nav & footer elements
  document.querySelectorAll("#nav, #footer, #mobileMenu, #enqOverlay, #panel-collections, #panel-studio").forEach(loadScope);

  // 2. Preload remaining hidden views only during idle time after load
  var onIdle = window.requestIdleCallback || function(cb){ setTimeout(cb, 2500); };
  onIdle(function(){
    document.querySelectorAll(".page-view[hidden]").forEach(function(v){
      loadScope(v);
    });
  });
})();

/* ===== RJDLx bundle part 6 (original order kept) ===== */
/* SNAPSHOT ROUTER — 39 views, one file */
(function(){
  var TITLES={"home": "RJDLx \u2014 India, Designed for the World", "brass-bollard": "LN\u00b006 \u2014 Brass Bollard | RJDLx", "cane-cluster": "CN\u00b002 \u2014 Cane Cluster | RJDLx", "cane-dome": "CN\u00b001 \u2014 Cane Dome | RJDLx", "cane-lantern": "CN\u00b003 \u2014 Cane Lantern | RJDLx", "cane-linear": "CN\u00b005 \u2014 Cane Linear | RJDLx", "cane-totem": "CN\u00b004 \u2014 Cane Totem | RJDLx", "collection-architectural": "Architectural \u2014 RJDLx Collections", "collection-cane-rattan": "Cane Lighting \u2014 RJDLx Collections", "collection-metal-furniture": "Metal Furniture \u2014 RJDLx Collections", "collection-metal-lighting": "Metal Lighting \u2014 RJDLx Collections", "collection-objects": "Stool \u2014 RJDLx Collections", "collection-pendants": "Pendants \u2014 RJDLx Collections", "collection-sculptural": "Sculptural \u2014 RJDLx Collections", "collection-seating": "Metal Chair \u2014 RJDLx Collections", "collection-tables": "Metal Tables \u2014 RJDLx Collections", "collection-metal-wardrobes": "Metal Wardrobes \u2014 RJDLx Collections", "collection-natural-yarn": "Natural Yarn \u2014 RJDLx Collections", "collection-recycled-yarn": "Recycled Yarn \u2014 RJDLx Collections", "collections": "Collections \u2014 RJDLx", "contact": "Contact \u2014 RJDLx", "craft": "Craft \u2014 Made in India | RJDLx", "custom": "Custom \u2014 Start a Project | RJDLx", "floor-totem": "LN\u00b004 \u2014 Floor Totem | RJDLx", "fold-dining-chair": "N\u00b003 \u2014 Fold Dining Chair | RJDLx", "gallery-console": "N\u00b007 \u2014 Gallery Console | RJDLx", "journal": "Journal \u2014 RJDLx", "linear-installation": "LN\u00b003 \u2014 Linear Installation | RJDLx", "nesting-tables": "N\u00b009 \u2014 Nesting Tables | RJDLx", "plinth-stool": "N\u00b004 \u2014 Plinth Stool | RJDLx", "side-tables": "N\u00b002 \u2014 Sculptural Side Tables | RJDLx", "spun-pendant": "LN\u00b001 \u2014 Spun Pendant | RJDLx", "studio": "Studio \u2014 RJDLx", "trade": "Trade & Export \u2014 RJDLx", "wall-sconce": "LN\u00b005 \u2014 Wall Sconce | RJDLx", "weave-ottoman": "N\u00b008 \u2014 Recycled Yarn Ottoman | RJDLx", "weave-screen": "N\u00b006 \u2014 Natural Yarn Screen | RJDLx", "woven-bench": "N\u00b005 \u2014 Natural Yarn Bench | RJDLx", "woven-counter-stool": "N\u00b010 \u2014 Recycled Yarn Counter Stool | RJDLx", "woven-lounge-chair": "N\u00b001 \u2014 Natural Yarn Lounge Chair | RJDLx","collection-outdoor": "C·04 — Metal Outdoor Furniture | RJDLx","collection-bar": "C·07 — Bar Furniture | RJDLx","collection-wall-decor": "C·08 — Wall Decor | RJDLx","collection-otb": "C·10 — OTB · Out of the Box | RJDLx","collection-storage": "C·11 — Metal Shelves | RJDLx", "collection-metal-shelves": "C·11 — Metal Shelves | RJDLx", "collection-dividers": "C·12 — Dividers & Partitions | RJDLx"};
  var F2V={"index": "home", "brass-bollard": "brass-bollard", "cane-cluster": "cane-cluster", "cane-dome": "cane-dome", "cane-lantern": "cane-lantern", "cane-linear": "cane-linear", "cane-totem": "cane-totem", "collection-architectural": "collection-architectural", "collection-cane-rattan": "collection-cane-rattan", "collection-metal-furniture": "collection-metal-furniture", "collection-metal-lighting": "collection-metal-lighting", "collection-objects": "collection-objects", "collection-pendants": "collection-pendants", "collection-sculptural": "collection-sculptural", "collection-seating": "collection-seating", "collection-tables": "collection-tables", "collection-metal-wardrobes": "collection-metal-wardrobes", "collection-natural-yarn": "collection-natural-yarn", "collection-recycled-yarn": "collection-recycled-yarn", "collection-woven-metal": "collection-natural-yarn", "collections": "collections", "contact": "contact", "craft": "craft", "custom": "custom", "floor-totem": "floor-totem", "fold-dining-chair": "fold-dining-chair", "gallery-console": "gallery-console", "journal": "journal", "linear-installation": "linear-installation", "nesting-tables": "nesting-tables", "plinth-stool": "plinth-stool", "side-tables": "side-tables", "spun-pendant": "spun-pendant", "studio": "studio", "trade": "trade", "wall-sconce": "wall-sconce", "weave-ottoman": "weave-ottoman", "weave-screen": "weave-screen", "woven-bench": "woven-bench", "woven-counter-stool": "woven-counter-stool", "woven-lounge-chair": "woven-lounge-chair", "collection-outdoor": "collection-outdoor", "collection-bar": "collection-bar", "collection-wall-decor": "collection-wall-decor", "collection-otb": "collection-otb", "collection-storage": "collection-metal-shelves", "collection-metal-shelves": "collection-metal-shelves", "collection-dividers": "collection-dividers", };
  var views={};
  document.querySelectorAll('.page-view').forEach(function(v){views[v.dataset.view]=v;});
  function show(name,hash){
    if(!views[name])name='home';
    Object.keys(views).forEach(function(k){views[k].hidden=(k!==name);});
    document.body.dataset.view=name;
    document.title=TITLES[name]||document.title;
    if(__loadViewImages && views[name]) __loadViewImages(views[name]);
    try{history.replaceState(null,'',hash?'#/'+name+hash:'#/'+name);}catch(e){}
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
    if(hash){requestAnimationFrame(function(){requestAnimationFrame(function(){
      var t=views[name].querySelector(hash);
      if(t)t.scrollIntoView({behavior:'smooth',block:'start'});else window.scrollTo(0,0);
    });});}else{window.scrollTo(0,0);}
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href*=".html"]');
    if(!a)return;
    var m=a.getAttribute('href').match(/^([a-z0-9-]+)\.html(#[A-Za-z0-9_-]+)?$/);
    if(!m)return;
    e.preventDefault();
    show(F2V[m[1]]||'home',m[2]||null);
  });
  document.querySelectorAll('.process-track').forEach(function(track){
    var down=false,sx=0,sl=0;
    track.addEventListener('pointerdown',function(e){if(e.pointerType&&e.pointerType!=='mouse')return;down=true;sx=e.clientX;sl=track.scrollLeft;try{track.setPointerCapture(e.pointerId);}catch(_){}});
    track.addEventListener('pointermove',function(e){if(!down)return;track.scrollLeft=sl-(e.clientX-sx);});
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){track.addEventListener(ev,function(){down=false;});});
  });
  var h=(location.hash||'').match(/^#\/([a-z0-9-]+)(#.+)?$/);
  if(h&&views[h[1]]){
    show(h[1],h[2]||null);
  } else {
    var p = (location.pathname||'').replace(/^\/+|\.html$/g, '');
    if(p && (views[p] || (F2V[p] && views[F2V[p]]))){
      show(F2V[p]||p, (location.hash||null));
    }
  }
  window.__showView=show;
})();
