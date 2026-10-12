// Prenota: un passo per schermata, il biglietto si scrive mentre si sceglie, alla fine si apre WhatsApp
const WA = "https://wa.me/393294570270?text=";
const lento = matchMedia("(prefers-reduced-motion: reduce)").matches;
const f = document.querySelector("[data-pren]");

if (f) {
  const passi = Object.fromEntries([...f.querySelectorAll("[data-passo]")].map((p) => [p.dataset.passo, p]));
  const PERCORSI = {
    tavolo: ["tipo", "giorno", "ora", "persone", "nome", "fine"],
    festa: ["tipo", "festa", "data", "ospiti", "nome", "fine"],
  };
  const stato = { tipo: null, giorno: null, ora: null, persone: 2, visto: false, seggiolone: false,
    festa: null, data: null, nodata: false, ospiti: 40, vistoOspiti: false, dove: "decidere", nome: "", note: "", privacy: false };
  let percorso = PERCORSI.tavolo, i = 0;

  const $ = (s, r = f) => r.querySelector(s);
  const nav = $("[data-pren-nav]"), indietro = $("[data-indietro]"), avanti = $("[data-avanti]");
  const barraW = $("[data-barra-w]"), barra = $("[data-barra]"), passoTesto = $("[data-passo-testo]");
  const biglietto = document.querySelector("[data-biglietto]");
  const b = (k) => document.querySelector(`[data-b="${k}"]`);
  const riga = (k) => document.querySelector(`[data-riga="${k}"]`);
  const DOVE = { giardino: "in giardino", sala: "in sala", decidere: "da decidere" };

  // --- date e orari (lunedì chiuso, domenica solo pranzo)
  const fmt = (d, anno) => d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", ...(anno ? { year: "numeric" } : {}) });
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const daIso = (s) => { const [y, m, g] = s.split("-").map(Number); return new Date(y, m - 1, g); };
  const oggi = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const aperto = (d) => d.getDay() !== 1;
  const fasce = (d) => (d.getDay() === 0 ? ["12:30", "13:00", "13:30", "14:00", "14:30"] : ["20:00", "20:30", "21:00", "21:30", "22:00", "22:30"]);
  const liberi = (d) => {
    if (iso(d) !== iso(new Date())) return fasce(d);
    const ora = new Date(), min = ora.getHours() * 60 + ora.getMinutes() + 45;
    return fasce(d).filter((x) => { const [h, m] = x.split(":").map(Number); return h * 60 + m >= min; });
  };

  // --- il biglietto: ogni riga si riscrive con un tratto di penna
  const scrivi = (k, v) => {
    const el = b(k);
    if (!el || el.textContent === v) return;
    el.textContent = v;
    if (!lento) { el.classList.remove("scritto"); void el.offsetWidth; el.classList.add("scritto"); }
  };
  const aggiorna = () => {
    const festa = stato.tipo === "festa";
    // il biglietto parte vuoto e si riempie: una riga compare solo quando ha un valore
    riga("quando").hidden = festa ? !(stato.data || stato.nodata) : !stato.giorno;
    riga("ora").hidden = festa || !stato.ora;
    riga("dove").hidden = !festa || !stato.vistoOspiti;
    riga("persone").hidden = festa ? !stato.vistoOspiti : !stato.visto;
    riga("nome").hidden = !stato.nome;
    riga("persone").querySelector("dt").textContent = festa ? "Ospiti" : "Persone";
    if (festa) {
      const r = $('input[name="festa"]:checked');
      scrivi("titolo", r ? r.dataset.titolo : "La vostra festa");
      scrivi("quando", stato.nodata ? "data da decidere" : stato.data ? fmt(stato.data, true) : "da scegliere");
      scrivi("persone", `circa ${stato.ospiti}`);
      scrivi("dove", DOVE[stato.dove]);
    } else {
      scrivi("titolo", stato.tipo === "tavolo" ? (stato.visto ? `Tavolo per ${stato.persone}` : "Il vostro tavolo") : "La vostra prenotazione");
      scrivi("quando", stato.giorno ? fmt(stato.giorno) : "da scegliere");
      scrivi("ora", stato.ora ? `alle ${stato.ora}` : "da scegliere");
      scrivi("persone", stato.visto ? `${stato.persone}${stato.seggiolone ? " · seggiolone" : ""}` : "da scegliere");
    }
    scrivi("nome", stato.nome || "…");
  };

  // --- giorni: le prossime tre settimane di apertura
  const giorniBox = $("[data-giorni]");
  const disegnaGiorni = () => {
    const o = oggi(), voci = [];
    for (let n = 0; n < 21; n++) {
      const d = new Date(o); d.setDate(o.getDate() + n);
      if (!aperto(d) || !liberi(d).length) continue;
      const sopra = n === 0 ? "Oggi" : n === 1 ? "Domani" : d.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "");
      voci.push(`<label class="gg"><input type="radio" name="giorno" value="${iso(d)}"><span class="gg-s">${sopra}</span><span class="gg-n">${d.getDate()}</span><span class="gg-m">${d.toLocaleDateString("it-IT", { month: "short" }).replace(".", "")}</span><span class="vis-nascosto">${fmt(d)}</span></label>`);
    }
    giorniBox.innerHTML = voci.join("");
  };
  const orariBox = $("[data-orari]");
  const disegnaOrari = () => {
    if (!stato.giorno) { orariBox.innerHTML = ""; return; }
    const s = liberi(stato.giorno);
    if (stato.ora && !s.includes(stato.ora)) stato.ora = null;
    $("[data-ora-d]").textContent = (stato.giorno.getDay() === 0 ? "Domenica è a pranzo. " : "La sera, da martedì a sabato. ") + "L'orario esatto ve lo confermiamo noi.";
    orariBox.innerHTML = s.map((x) => `<label class="oo"><input type="radio" name="ora" value="${x}"${x === stato.ora ? " checked" : ""}><span>${x}</span></label>`).join("");
  };
  const altro = $("[data-g-altro]");
  altro.min = iso(oggi());

  // --- navigazione
  const errore = (msg) => { const e = $("[data-err]", passi[percorso[i]]); if (e) e.textContent = msg; return !msg; };
  const valido = () => {
    switch (percorso[i]) {
      case "tipo": return errore(stato.tipo ? "" : "Scegliete se è un tavolo o una festa.");
      case "giorno": return errore(stato.giorno ? "" : "Scegliete un giorno.");
      case "ora": return errore(stato.ora ? "" : "Scegliete un orario.");
      case "festa": return errore(stato.festa ? "" : "Scegliete la festa.");
      case "data":
        if (stato.nodata) return errore("");
        if (!stato.data) return errore("Scegliete una data o spuntate «non ancora decisa».");
        return errore(stato.data < oggi() ? "Questa data è già passata." : "");
      case "nome":
        if (stato.nome.length < 2) { $("[data-p-nome]").focus(); return errore("Scrivete il nome per la prenotazione."); }
        return errore(stato.privacy ? "" : "Serve la spunta sull'informativa.");
      default: return true;
    }
  };

  const messaggio = () => {
    const r = [];
    if (stato.tipo === "tavolo") {
      r.push("Buongiorno! Vorrei prenotare un tavolo ai Giardini di Manù.",
        `Giorno: ${fmt(stato.giorno)}`, `Ora: ${stato.ora}`,
        `Persone: ${stato.persone}${stato.seggiolone ? " (c'è un bambino piccolo: ci serve un seggiolone)" : ""}`);
    } else {
      r.push(`Buongiorno! Vorrei un preventivo per ${$('input[name="festa"]:checked').dataset.testo} ai Giardini di Manù.`,
        `Data: ${stato.nodata ? "ancora da decidere" : fmt(stato.data, true)}`, `Ospiti: circa ${stato.ospiti}`, `Dove: ${DOVE[stato.dove]}`);
    }
    r.push(`A nome di: ${stato.nome}`);
    if (stato.note) r.push(`Note: ${stato.note}`);
    r.push("", stato.tipo === "tavolo" ? "Aspetto la vostra conferma, grazie!" : "Aspetto le vostre proposte, grazie!");
    return r.join("\n");
  };

  const mostra = (n, dir = 1, fuoco = true) => {
    i = Math.max(0, Math.min(n, percorso.length - 1));
    const nome = percorso[i], tot = percorso.length - 1;
    Object.values(passi).forEach((p) => { p.hidden = p.dataset.passo !== nome; p.classList.remove("da-dx", "da-sx"); });
    const p = passi[nome];
    if (!lento) { void p.offsetWidth; p.classList.add(dir > 0 ? "da-dx" : "da-sx"); p.addEventListener("animationend", () => p.classList.remove("da-dx", "da-sx"), { once: true }); }
    barraW.hidden = false;
    passoTesto.textContent = nome === "fine" ? "Riepilogo" : `Passo ${i + 1} di ${tot}`;
    barra.style.transform = `scaleX(${nome === "fine" ? 1 : (i + 1) / (tot + 1)})`;
    indietro.hidden = i === 0; avanti.hidden = nome === "fine";
    nav.hidden = false;
    biglietto.classList.toggle("pronto", nome === "fine");
    if (nome === "persone") { stato.visto = true; aggiorna(); }
    if (nome === "ospiti") { stato.vistoOspiti = true; aggiorna(); }
    if (nome === "ora") disegnaOrari();
    if (nome === "fine") {
      const m = messaggio();
      $("[data-msg]").textContent = m;
      $("[data-invia]").href = WA + encodeURIComponent(m);
      $("[data-fatto]").hidden = true;
    }
    if (fuoco) {
      const blocco = document.querySelector("[data-pren-g]"), top = blocco.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.5) blocco.scrollIntoView({ behavior: lento ? "auto" : "smooth", block: "start" });
      p.querySelector(".passo-t").focus({ preventScroll: true });
    }
  };
  const vai = () => { if (valido()) mostra(i + 1, 1); };
  avanti.addEventListener("click", vai);
  indietro.addEventListener("click", () => mostra(i - 1, -1));
  // invio da tastiera nei campi di testo = avanti
  f.addEventListener("submit", (e) => { e.preventDefault(); vai(); });
  f.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("input:not([type=checkbox]):not([type=radio])")) { e.preventDefault(); vai(); } });
  // un tocco su una scelta grande = passo successivo (con la tastiera si usa Avanti: le frecce non devono far saltare il passo)
  let daTocco = false, attesa = 0;
  f.addEventListener("pointerdown", () => { daTocco = true; });
  f.addEventListener("keydown", () => { daTocco = false; }, true);
  const tocco = () => { if (!daTocco) return; clearTimeout(attesa); attesa = setTimeout(vai, lento ? 0 : 280); };

  const scegliTipo = (t) => {
    stato.tipo = t; percorso = PERCORSI[t];
    const r = $(`input[name="tipo"][value="${t}"]`); if (r) r.checked = true;
    errore(""); aggiorna();
  };
  f.querySelectorAll('input[name="tipo"]').forEach((r) => {
    r.addEventListener("change", () => { scegliTipo(r.value); tocco(); });
  });
  giorniBox.addEventListener("change", (e) => {
    if (e.target.name !== "giorno") return;
    stato.giorno = daIso(e.target.value); altro.value = ""; errore(""); disegnaOrari(); aggiorna(); tocco();
  });
  altro.addEventListener("change", () => {
    if (!altro.value) return;
    const d = daIso(altro.value);
    if (d < oggi()) return errore("Questa data è già passata.");
    if (!aperto(d)) return errore("Il lunedì siamo chiusi: scegliete un altro giorno.");
    giorniBox.querySelectorAll("input").forEach((x) => { x.checked = x.value === altro.value; });
    stato.giorno = d; errore(""); disegnaOrari(); aggiorna();
  });
  orariBox.addEventListener("change", (e) => { stato.ora = e.target.value; errore(""); aggiorna(); tocco(); });

  f.querySelectorAll("[data-contatore]").forEach((c) => {
    const out = $("[data-n]", c), min = +c.dataset.min, max = +c.dataset.max, passo = +c.dataset.passoN, k = c.dataset.contatore;
    const metti = (v) => {
      stato[k] = Math.max(min, Math.min(max, v)); out.textContent = stato[k];
      $("[data-meno]", c).disabled = stato[k] <= min; $("[data-piu]", c).disabled = stato[k] >= max;
      if (k === "persone") { const l = $("[data-ct-l]"); if (l) l.textContent = stato[k] === 1 ? "persona" : "persone"; }
      aggiorna();
    };
    $("[data-meno]", c).addEventListener("click", () => metti(stato[k] - passo));
    $("[data-piu]", c).addEventListener("click", () => metti(stato[k] + passo));
    metti(+c.dataset.val);
  });
  $('input[name="seggiolone"]').addEventListener("change", (e) => { stato.seggiolone = e.target.checked; aggiorna(); });
  $("[data-vai-festa]").addEventListener("click", (e) => { e.preventDefault(); scegliTipo("festa"); stato.ospiti = Math.max(stato.persone, 20); mostra(1, 1); });

  f.querySelectorAll('input[name="festa"]').forEach((r) => {
    r.addEventListener("change", () => { stato.festa = r.value; errore(""); aggiorna(); tocco(); });
  });
  const fData = $("[data-f-data]"), fNo = $("[data-f-nodata]");
  fData.min = iso(oggi());
  fData.addEventListener("change", () => { stato.data = fData.value ? daIso(fData.value) : null; if (stato.data) { stato.nodata = false; fNo.checked = false; } errore(""); aggiorna(); });
  fNo.addEventListener("change", () => { stato.nodata = fNo.checked; if (fNo.checked) { fData.value = ""; stato.data = null; } errore(""); aggiorna(); });
  f.querySelectorAll('input[name="dove"]').forEach((r) => r.addEventListener("change", () => { stato.dove = r.value; aggiorna(); }));

  $("[data-p-nome]").addEventListener("input", (e) => { stato.nome = e.target.value.trim().replace(/\s+/g, " "); aggiorna(); });
  $("[data-p-note]").addEventListener("input", (e) => { stato.note = e.target.value.trim(); });
  $("[data-p-privacy]").addEventListener("change", (e) => { stato.privacy = e.target.checked; if (e.target.checked) errore(""); });
  $("[data-invia]").addEventListener("click", () => { $("[data-fatto]").hidden = false; });

  // --- partenza: ?tipo=tavolo|festa e ?festa=comunione salta i primi passi
  disegnaGiorni();
  const qs = new URLSearchParams(location.search);
  const t0 = qs.get("tipo"), fe0 = qs.get("festa");
  if (t0 === "tavolo" || t0 === "festa") {
    scegliTipo(t0);
    let n = 1;
    const r = t0 === "festa" && fe0 && $(`input[name="festa"][value="${CSS.escape(fe0)}"]`);
    if (r) { r.checked = true; stato.festa = r.value; n = 2; }
    aggiorna(); mostra(n, 1, false);
  } else { aggiorna(); mostra(0, 1, false); }
}
