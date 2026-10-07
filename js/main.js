// I Giardini di Manù — interazioni essenziali
const WA = "https://wa.me/393294570270?text=";
const lento = matchMedia("(prefers-reduced-motion: reduce)").matches;

// testata con ombra dopo lo scorrimento
const testata = document.querySelector(".testata");
if (testata) {
  const su = () => testata.classList.toggle("giu", scrollY > 8);
  addEventListener("scroll", su, { passive: true }); su();
}

// ingressi allo scorrimento (sfalsati dentro lo stesso genitore)
const io = new IntersectionObserver((voci) => {
  voci.forEach((v) => {
    if (!v.isIntersecting) return;
    const el = v.target;
    const fratelli = [...el.parentElement.querySelectorAll(":scope > [data-entra], :scope > [data-scopri]")];
    el.style.transitionDelay = `${Math.min(fratelli.indexOf(el), 4) * 90}ms`;
    el.classList.add("dentro");
    io.unobserve(el);
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: .12 });
document.querySelectorAll("[data-entra], [data-scopri]").forEach((el) => io.observe(el));

// caroselli a scatti con frecce
document.querySelectorAll("[data-caro]").forEach((caro) => {
  const pista = caro.querySelector(".caro-pista");
  const [prec, succ] = caro.querySelectorAll(".freccia");
  if (!pista || !prec) return;
  const passo = () => (pista.firstElementChild?.getBoundingClientRect().width || 300) + 14;
  prec.addEventListener("click", () => pista.scrollBy({ left: -passo(), behavior: lento ? "auto" : "smooth" }));
  succ.addEventListener("click", () => pista.scrollBy({ left: passo(), behavior: lento ? "auto" : "smooth" }));
  const stato = () => {
    prec.disabled = pista.scrollLeft < 8;
    succ.disabled = pista.scrollLeft + pista.clientWidth > pista.scrollWidth - 8;
  };
  pista.addEventListener("scroll", stato, { passive: true }); addEventListener("resize", stato); stato();
});

// il segnaposto: si sceglie la festa, il cartoncino gira e il WhatsApp si scrive da solo
const tavolo = document.querySelector("[data-tavolo]");
if (tavolo) {
  const carta = tavolo.querySelector(".sp-carta");
  const facce = [tavolo.querySelector(".sp-fronte .sp-nome"), tavolo.querySelector(".sp-retro .sp-nome")];
  const cta = document.querySelector("[data-cta-festa]");
  const chips = [...document.querySelectorAll("[data-festa]")];
  let lato = 0;
  const testo = (festa) => `Buongiorno! Vorrei un preventivo per ${festa} ai Giardini di Manù.\nData: \nOspiti: circa \nGiardino o sala: `;
  chips.forEach((chip) => chip.addEventListener("click", () => {
    if (chip.getAttribute("aria-pressed") === "true") return;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    const nome = chip.dataset.nome;
    if (lento) { facce[lato].textContent = nome; }
    else { lato = 1 - lato; facce[lato].textContent = nome; carta.classList.toggle("giro", lato === 1); }
    tavolo.querySelector("[data-annuncio]").textContent = `Segnaposto: ${nome}`;
    if (cta) cta.href = WA + encodeURIComponent(testo(chip.dataset.festa));
  }));
}

// orari: evidenzia oggi
const oggi = (new Date().getDay() + 6) % 7; // 0 = lunedì
document.querySelectorAll("[data-giorno]").forEach((r) => {
  if (+r.dataset.giorno === oggi) r.classList.add("oggi-r");
});
const statoOggi = document.querySelector("[data-oggi]");
if (statoOggi) {
  const orari = ["Oggi chiuso (lunedì)", "Oggi 20:00–24:00", "Oggi 20:00–24:00", "Oggi 20:00–24:00", "Oggi 20:00–24:00", "Oggi 20:00–24:00", "Oggi pranzo 12:30–16:00"];
  statoOggi.textContent = orari[oggi];
}

// mappa solo dopo il clic (niente dati a Google prima)
document.querySelectorAll("[data-mappa]").forEach((b) => b.addEventListener("click", () => {
  const box = b.closest(".mappa");
  const f = document.createElement("iframe");
  f.src = "https://www.google.com/maps?q=I+Giardini+Di+Man%C3%B9,+Via+Corallo+157,+Pagani&output=embed";
  f.title = "Mappa: I Giardini di Manù, Via Corallo 157, Pagani";
  f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
  box.appendChild(f); b.closest(".mappa-in").remove();
}));

// modulo contatti -> messaggio WhatsApp
const modulo = document.querySelector("[data-modulo]");
if (modulo) {
  const qs = new URLSearchParams(location.search);
  if (qs.get("festa")) { const s = modulo.querySelector("#festa"); if (s) s.value = qs.get("festa"); }
  modulo.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    modulo.querySelectorAll("[required]").forEach((c) => {
      const err = modulo.querySelector(`#${c.id}-err`);
      const bad = c.type === "checkbox" ? !c.checked : !c.value.trim();
      c.setAttribute("aria-invalid", String(bad));
      if (err) err.textContent = bad ? (c.type === "checkbox" ? "Serve il consenso per scriverci" : "Serve per risponderti") : "";
      if (bad && ok) { c.focus(); ok = false; }
    });
    if (!ok) return;
    const d = new FormData(modulo);
    const data = d.get("data") ? new Date(d.get("data")).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "da decidere";
    const righe = [
      `Buongiorno, sono ${d.get("nome").trim()}.`,
      `Vorrei informazioni per: ${d.get("festa")}.`,
      `Data: ${data}`,
      `Ospiti: ${d.get("ospiti") || "da definire"}`,
      `Preferenza: ${d.get("dove") || "indifferente"}`,
    ];
    if (d.get("msg").trim()) righe.push("", d.get("msg").trim());
    open(WA + encodeURIComponent(righe.join("\n")), "_blank", "noopener");
  });
}
