// I Giardini di Manù — interazioni essenziali
const lento = matchMedia("(prefers-reduced-motion: reduce)").matches;

// testata con ombra dopo lo scorrimento
const testata = document.querySelector(".testata");
if (testata) {
  const su = () => testata.classList.toggle("giu", scrollY > 8);
  addEventListener("scroll", su, { passive: true }); su();
}

// il menù del sito (cartoncino sotto la testata, solo su telefono e tablet)
const bottoneMenu = document.querySelector("[data-menu]");
const carta = document.getElementById("menu-carta");
if (bottoneMenu && carta) {
  const chiudi = (fuoco) => {
    if (carta.hidden) return;
    carta.hidden = true; carta.classList.remove("apre");
    bottoneMenu.setAttribute("aria-expanded", "false");
    if (fuoco) bottoneMenu.focus();
  };
  bottoneMenu.addEventListener("click", () => {
    if (!carta.hidden) return chiudi(false);
    carta.hidden = false; carta.classList.add("apre");
    bottoneMenu.setAttribute("aria-expanded", "true");
    carta.querySelector("a")?.focus({ preventScroll: true });
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") chiudi(true); });
  document.addEventListener("click", (e) => { if (!carta.hidden && !e.target.closest(".testata")) chiudi(false); });
  carta.addEventListener("click", (e) => { if (e.target.closest("a")) chiudi(false); });
  matchMedia("(min-width: 960px)").addEventListener("change", () => chiudi(false));
}

// ingressi allo scorrimento (sfalsati dentro lo stesso genitore).
// Rete di sicurezza: tutto ciò che sta sopra il bordo basso dello schermo si mostra comunque,
// così nessuna foto resta nascosta se il telefono salta un evento.
const daMostrare = [...document.querySelectorAll("[data-entra], [data-scopri]")];
const entra = (el) => {
  if (el.classList.contains("dentro")) return;
  const fratelli = [...el.parentElement.querySelectorAll(":scope > [data-entra], :scope > [data-scopri]")];
  el.style.transitionDelay = `${Math.min(fratelli.indexOf(el), 4) * 90}ms`;
  el.classList.add("dentro");
};
if ("IntersectionObserver" in window && !lento) {
  const io = new IntersectionObserver((voci) => voci.forEach((v) => {
    if (v.isIntersecting) { entra(v.target); io.unobserve(v.target); }
  }), { rootMargin: "0px 0px -6% 0px", threshold: 0 });
  daMostrare.forEach((el) => io.observe(el));
  let t = 0;
  const controlla = () => daMostrare.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) entra(el); });
  addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(controlla, 180); }, { passive: true });
  addEventListener("load", () => setTimeout(controlla, 600));
} else daMostrare.forEach((el) => el.classList.add("dentro"));

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

// video del giardino: parte solo quando si vede, si ferma quando esce; fermo con «riduci movimento»
document.querySelectorAll("video[data-auto]").forEach((v) => {
  if (lento || !("IntersectionObserver" in window)) { v.removeAttribute("autoplay"); return; }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
  }, { threshold: 0.25 }).observe(v);
});

// il segnaposto: si sceglie la festa, il cartoncino gira e il pulsante porta alla prenotazione già impostata
const tavolo = document.querySelector("[data-tavolo]");
if (tavolo) {
  const cartoncino = tavolo.querySelector(".sp-carta");
  const facce = [tavolo.querySelector(".sp-fronte .sp-nome"), tavolo.querySelector(".sp-retro .sp-nome")];
  const cta = document.querySelector("[data-cta-festa]");
  const chips = [...document.querySelectorAll("[data-festa]")];
  let lato = 0;
  chips.forEach((chip) => chip.addEventListener("click", () => {
    if (chip.getAttribute("aria-pressed") === "true") return;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    const nome = chip.dataset.nome;
    if (lento) { facce[lato].textContent = nome; }
    else { lato = 1 - lato; facce[lato].textContent = nome; cartoncino.classList.toggle("giro", lato === 1); }
    tavolo.querySelector("[data-annuncio]").textContent = `Segnaposto: ${nome}`;
    if (cta) cta.href = `prenota.html?tipo=festa&festa=${chip.dataset.festa}`;
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

// pagina Prenota
if (document.querySelector("[data-pren]")) import("./prenota.js");
