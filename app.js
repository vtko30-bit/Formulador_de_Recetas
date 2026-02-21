(function () {
  "use strict";

  function getSupabaseConfig() {
    if (typeof window === "undefined") return { url: "", key: "" };
    return {
      url: (window.RECETAS_SUPABASE_URL || "").trim(),
      key: (window.RECETAS_SUPABASE_ANON_KEY || "").trim(),
    };
  }
  var supabaseUrl, supabaseAnonKey, useSupabase;
  var supabase = null;
  function getSupabase() {
    if (supabase) return supabase;
    if (!supabaseUrl || !supabaseAnonKey) return null;
    try {
      if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
      }
    } catch (e) {
      console.warn("Supabase no disponible:", e);
    }
    return supabase;
  }

  let state = {
    user: null,
    isSuperuser: false,
    recetas: [],
    baseIngredientes: [],
    editingRecipeId: null,
    view: "recetas",
  };
  function updateUserRole(user) {
    state.isSuperuser = !!(user && user.app_metadata && user.app_metadata.role === "superusuario");
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(function (el) {
      el.classList.add("hidden");
    });
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  async function showView(viewName) {
    state.view = viewName;
    document.querySelectorAll(".view").forEach(function (el) {
      el.classList.add("hidden");
    });
    document.querySelectorAll(".nav-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
    });
    const viewEl = document.getElementById("view-" + viewName);
    if (viewEl) viewEl.classList.remove("hidden");
    const main = document.querySelector(".main");
    if (main) main.classList.toggle("view-ingredientes-activo", viewName === "ingredientes");
    if (viewName === "recetas") {
      document.getElementById("list-section").classList.remove("hidden");
      document.getElementById("form-section").classList.add("hidden");
      document.getElementById("detail-section").classList.add("hidden");
      renderRecipeList();
    } else if (viewName === "ingredientes") {
      await loadBaseIngredientes();
      renderBaseIngredientes();
      var actionsEl = document.querySelector(".ingredientes-base-actions");
      if (actionsEl) actionsEl.classList.toggle("hidden", !state.isSuperuser);
    }
  }

  function showLoginMessage(msg) {
    const el = document.getElementById("login-message");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("hidden", !msg);
    if (msg) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("visible");
    setTimeout(function () {
      toast.classList.remove("visible");
      setTimeout(function () {
        toast.classList.add("hidden");
      }, 300);
    }, 2500);
  }

  function setOfflineBanner(offline) {
    const banner = document.getElementById("offline-banner");
    if (banner) banner.classList.toggle("hidden", !offline);
  }

  // --- Auth ---
  async function initAuth() {
    if (!useSupabase) {
      document.getElementById("login-screen").innerHTML =
        "<div class='login-card'><h1>🍦 Formulador Helados</h1><p class='login-subtitle'>Configura <code>config.js</code> con tu URL y clave de Supabase para usar la app multiusuario.</p><p>Copia <code>config.example.js</code> a <code>config.js</code> y rellena <code>RECETAS_SUPABASE_URL</code> y <code>RECETAS_SUPABASE_ANON_KEY</code>.</p></div>";
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      document.getElementById("login-screen").innerHTML =
        "<div class='login-card'><h1>🍦 Formulador Helados</h1><p class='login-subtitle message error'>No se cargó la librería de Supabase.</p><p>Copia el archivo <strong>supabase.min.js</strong> en la carpeta del proyecto. Descárgalo desde <a href='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js' target='_blank'>cdn.jsdelivr.net</a> (Ctrl+S para guardar) o usa otra red si los CDN están bloqueados.</p></div>";
      return;
    }
    const { data: { session } } = await sb.auth.getSession();
    state.user = session?.user || null;
    updateUserRole(state.user);
    if (state.user) {
      showScreen("app-screen");
      showView("recetas");
      loadRecetas();
    } else {
      showScreen("login-screen");
    }
    sb.auth.onAuthStateChange(function (event, session) {
      state.user = session?.user || null;
      updateUserRole(state.user);
      if (state.user) {
        showScreen("app-screen");
        showView("recetas");
        loadRecetas();
      } else {
        showScreen("login-screen");
      }
    });
  }

  async function login(email, password) {
    var btn = document.querySelector("#login-form button[type='submit']");
    showLoginMessage("");
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        showLoginMessage("Config no cargada. Ejecuta: npx serve .");
        return;
      }
      if (!window.supabase || !window.supabase.createClient) {
        showLoginMessage("No se cargó la librería de Supabase. Recarga la página.");
        return;
      }
      const sb = getSupabase();
      if (!sb) {
        showLoginMessage("Error al conectar con Supabase. Revisa config.js (usa la clave 'anon public' que empieza por eyJ...).");
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = "Conectando..."; }
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        showLoginMessage(error.message);
        showToast(error.message);
        return;
      }
      showLoginMessage("");
      showToast("Sesión iniciada");
      showScreen("app-screen");
      showView("recetas");
      loadRecetas();
    } catch (err) {
      var msg = err && err.message ? err.message : String(err);
      showLoginMessage(msg);
      showToast(msg);
      console.error("Login error:", err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Entrar"; }
    }
  }

  async function register(email, password) {
    var btn = document.getElementById("btn-register");
    showLoginMessage("");
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        showLoginMessage("Config no cargada. Ejecuta: npx serve .");
        return;
      }
      const sb = getSupabase();
      if (!sb) {
        showLoginMessage("Error al conectar. Revisa config.js (usa la clave 'anon public' eyJ...).");
        return;
      }
      if (btn) { btn.disabled = true; }
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) {
        showLoginMessage(error.message);
        showToast(error.message);
        return;
      }
      if (data.session) {
        showLoginMessage("");
        showScreen("app-screen");
        showView("recetas");
        loadRecetas();
      } else {
        showLoginMessage("Cuenta creada. Revisa tu correo para confirmar (o desactiva 'Confirm email' en Supabase).");
        showToast("Revisa tu correo para confirmar");
      }
    } catch (err) {
      showLoginMessage(err && err.message ? err.message : String(err));
      console.error("Register error:", err);
    } finally {
      if (btn) { btn.disabled = false; }
    }
  }

  async function logout() {
    const sb = getSupabase();
    await sb.auth.signOut();
    showToast("Sesión cerrada");
  }

  // --- Recetas ---
  async function loadRecetas() {
    const sb = getSupabase();
    if (!sb || !state.user) return;
    const { data, error } = await sb
      .from("recetas")
      .select("id, user_id, nombre, temperatura, descripcion, ingredientes_lineas, publica, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error(error);
      showToast("Error al cargar recetas");
      return;
    }
    state.recetas = data || [];
    renderRecipeList();
  }

  function renderRecipeList() {
    const list = document.getElementById("recipe-list");
    const empty = document.getElementById("empty-state");
    const q = (document.getElementById("search-recipe") || {}).value || "";
    const filtered = state.recetas.filter(function (r) {
      return !q || r.nombre.toLowerCase().indexOf(q.toLowerCase()) >= 0;
    });
    list.innerHTML = "";
    filtered.forEach(function (r) {
      const li = document.createElement("li");
      li.className = "recipe-item";
      const temp = r.temperatura != null ? " · " + r.temperatura + " °C" : "";
      const badge = r.publica ? " <span class='badge-publica'>Pública</span>" : "";
      const esMia = state.user && r.user_id === state.user.id;
      const esDeOtro = state.user && !esMia && state.isSuperuser;
      const badgeMia = esMia ? " <span class='badge-mia'>Tuya</span>" : "";
      const badgeOtro = esDeOtro ? " <span class='badge-otro'>De otro</span>" : "";
      li.innerHTML = "<strong>" + escapeHtml(r.nombre) + "</strong>" + temp + badge + badgeMia + badgeOtro;
      li.addEventListener("click", function () {
        openRecipeDetail(r.id);
      });
      list.appendChild(li);
    });
    if (empty) empty.classList.toggle("hidden", filtered.length > 0);
  }

  function openRecipeDetail(id) {
    document.getElementById("list-section").classList.add("hidden");
    document.getElementById("form-section").classList.add("hidden");
    const detail = document.getElementById("detail-section");
    detail.classList.remove("hidden");
    const receta = state.recetas.find(function (r) {
      return r.id === id;
    });
    if (!receta) return;
    var topHtml = "<h2>" + escapeHtml(receta.nombre) + "</h2>";
    if (receta.descripcion) topHtml += "<p>" + escapeHtml(receta.descripcion) + "</p>";
    document.getElementById("recipe-detail-top").innerHTML = topHtml;
    var tableHtml = "";
    const lineas = Array.isArray(receta.ingredientes_lineas) ? receta.ingredientes_lineas : [];
    if (lineas.length) {
      var tCant = 0, tGrasa = 0, tSng = 0, tPod = 0, tPac = 0;
      lineas.forEach(function (ln) {
        tCant += parseFloat(ln.cantidad) || 0;
        tGrasa += parseFloat(ln.pct_graso) || 0;
        tSng += parseFloat(ln.solidos_totales) || 0;
        tPod += parseFloat(ln.pod) || 0;
        tPac += parseFloat(ln.pac) || 0;
      });
      function fmtDetail(x) {
        if (x === undefined || x === null || isNaN(Number(x))) return "0";
        return (Math.round(Number(x) * 100) / 100).toString();
      }
      tableHtml = "<table class='detail-table'><thead><tr><th>Ingrediente</th><th style='text-align: right;'>Cant. (g)</th><th style='text-align: right;'>% MG</th><th style='text-align: right;'>Sólidos</th><th style='text-align: right;'>P.O.D</th><th style='text-align: right;'>P.A.C</th></tr></thead><tbody>";
      lineas.forEach(function (ln) {
        tableHtml += "<tr><td>" + escapeHtml(ln.ingrediente || "") + "</td><td style='text-align: right;'>" + (ln.cantidad ?? "") + "</td><td style='text-align: right;'>" + (ln.pct_graso ?? "") + "</td><td style='text-align: right;'>" + (ln.solidos_totales ?? "") + "</td><td style='text-align: right;'>" + (ln.pod ?? "") + "</td><td style='text-align: right;'>" + (ln.pac ?? "") + "</td></tr>";
      });
      tableHtml += "</tbody><tfoot><tr><th>Totales</th><th style='text-align: right;'>" + fmtDetail(tCant) + "</th><th style='text-align: right;'>" + fmtDetail(tGrasa) + "</th><th style='text-align: right;'>" + fmtDetail(tSng) + "</th><th style='text-align: right;'>" + fmtDetail(tPod) + "</th><th style='text-align: right;'>" + fmtDetail(tPac) + "</th></tr></tfoot></table>";
    }
    document.getElementById("recipe-detail-table").innerHTML = tableHtml;
    state.editingRecipeId = id;
    var detailActions = document.querySelector("#detail-section .detail-actions");
    var shareRow = document.querySelector("#detail-section .detail-share-row");
    var publicaRow = document.getElementById("detail-publica-row");
    var btnTogglePublicaText = document.getElementById("btn-toggle-publica-text");
    var puedeGestionar = state.user && (receta.user_id === state.user.id || state.isSuperuser);
    if (detailActions) detailActions.classList.toggle("hidden", !puedeGestionar);
    if (shareRow) shareRow.classList.toggle("hidden", !puedeGestionar);
    if (publicaRow && btnTogglePublicaText) {
      publicaRow.classList.toggle("hidden", !puedeGestionar);
      if (puedeGestionar) {
        btnTogglePublicaText.textContent = receta.publica ? "Despublicar receta" : "Publicar receta";
        var btnToggle = document.getElementById("btn-toggle-publica");
        if (btnToggle) {
          btnToggle.onclick = function () { togglePublicaReceta(id); };
        }
      }
    }
  }

  async function togglePublicaReceta(id) {
    var receta = state.recetas.find(function (r) { return r.id === id; });
    if (!receta || !state.user) return;
    if (receta.user_id !== state.user.id && !state.isSuperuser) return;
    var nuevaPublica = !receta.publica;
    var sb = getSupabase();
    if (!sb) return;
    var btnText = document.getElementById("btn-toggle-publica-text");
    if (btnText) btnText.textContent = "Guardando…";
    var err = (await sb.from("recetas").update({ publica: nuevaPublica }).eq("id", id)).error;
    if (err) {
      showToast("Error: " + (err.message || "no se pudo actualizar"));
      if (btnText) btnText.textContent = receta.publica ? "Despublicar receta" : "Publicar receta";
      return;
    }
    receta.publica = nuevaPublica;
    if (btnText) btnText.textContent = nuevaPublica ? "Despublicar receta" : "Publicar receta";
    showToast(nuevaPublica ? "Receta publicada. Todos la pueden ver." : "Receta despublicada. Solo tú la ves.");
  }

  async function openRecipeForm(id) {
    state.editingRecipeId = id;
    document.getElementById("form-title").textContent = id ? "Editar fórmula" : "Nueva fórmula";
    document.getElementById("recipe-id").value = id || "";
    const receta = id ? state.recetas.find(function (r) {
      return r.id === id;
    }) : null;
    document.getElementById("recipe-name").value = receta ? receta.nombre : "";
    document.getElementById("recipe-temperatura").value = receta && receta.temperatura != null ? receta.temperatura : "";
    document.getElementById("recipe-desc").value = receta ? (receta.descripcion || "") : "";
    var chkPublica = document.getElementById("recipe-publica");
    if (chkPublica) chkPublica.checked = !!(receta && receta.publica);
    const lineas = (receta && Array.isArray(receta.ingredientes_lineas)) ? receta.ingredientes_lineas : [];
    document.getElementById("list-section").classList.add("hidden");
    document.getElementById("detail-section").classList.add("hidden");
    document.getElementById("form-section").classList.remove("hidden");
    await loadBaseIngredientes();
    renderIngredientesTbody(lineas);
  }

  function validarCantidadesReceta() {
    const rows = document.querySelectorAll("#ingredientes-tbody tr");
    var totalCant = 0;
    for (var i = 0; i < rows.length; i++) {
      const tr = rows[i];
      const ing = (tr.querySelector(".inp-ingrediente") || {}).value || "";
      const cant = parseFloat((tr.querySelector(".inp-cantidad") || {}).value) || 0;
      if (cant > 0 && !ing.trim()) {
        return { ok: false, mensaje: "El ingrediente no puede quedar vacío. Indica el nombre del ingrediente en la fila con cantidad." };
      }
      if (ing.trim() && (cant <= 0 || isNaN(cant))) {
        return { ok: false, mensaje: "La cantidad (Cant. g) debe ser mayor a 0. Revisa el ingrediente \"" + ing.trim() + "\"." };
      }
      totalCant += isNaN(cant) ? 0 : cant;
    }
    if (totalCant > 1000) {
      return { ok: false, mensaje: "El total de Cant. (g) no puede ser mayor a 1000. Total actual: " + totalCant + " g." };
    }
    return { ok: true };
  }

  function getIngredientesLineasFromForm() {
    const rows = document.querySelectorAll("#ingredientes-tbody tr");
    const lineas = [];
    rows.forEach(function (tr) {
      const ing = (tr.querySelector(".inp-ingrediente") || {}).value || "";
      const cant = parseFloat((tr.querySelector(".inp-cantidad") || {}).value) || 0;
      if (!ing && cant === 0) return;
      lineas.push({
        ingrediente: ing.trim(),
        cantidad: cant,
        pct_graso: valorCelda(tr, "celda-pct-graso"),
        solidos_totales: valorCelda(tr, "celda-solidos"),
        pod: valorCelda(tr, "celda-pod"),
        pac: valorCelda(tr, "celda-pac"),
        precio: parseFloat(tr.dataset.precioKg || "") || null,
      });
    });
    actualizarTotalesReceta();
    return lineas;
  }

  function parseNum(input) {
    if (!input) return null;
    const v = parseFloat(input.value);
    return isNaN(v) ? null : v;
  }

  function renderIngredientesTbody(lineas) {
    const tbody = document.getElementById("ingredientes-tbody");
    tbody.innerHTML = "";
    (lineas.length ? lineas : [{}]).forEach(function (ln) {
      appendIngredienteRow(tbody, ln);
    });
  }

  function appendIngredienteRow(tbody, ln) {
    const tr = document.createElement("tr");
    const ingVal = escapeAttr(ln.ingrediente || "");
    tr.innerHTML =
      "<td><div class='ingrediente-autocomplete'><input type='text' class='inp-ingrediente' placeholder='Buscar o escribir...' value='" + ingVal + "' autocomplete='off' /><ul class='ingrediente-dropdown hidden'></ul></div></td>" +
      "<td style='text-align: right;'><input type='number' step='0.01' class='inp-cantidad' placeholder='0' value='" + (ln.cantidad ?? "") + "' style='text-align: right;' autocomplete='off' /></td>" +
      "<td class='celda-pct-graso' style='text-align: right;'></td>" +
      "<td class='celda-solidos' style='text-align: right;'></td>" +
      "<td class='celda-solidos-tot' style='text-align: right;'></td>" +
      "<td class='celda-pod' style='text-align: right;'></td>" +
      "<td class='celda-pac' style='text-align: right;'></td>" +
      "<td class='celda-precio-linea' style='text-align: right;'></td>" +
      "<td><button type='button' class='btn icon small btn-remove-line' title='Quitar'>×</button></td>";
    tr.querySelector(".btn-remove-line").addEventListener("click", function () {
      tr.remove();
      actualizarTotalesReceta();
    });
    setupIngredienteAutocomplete(tr);
    const inpCantidad = tr.querySelector(".inp-cantidad");
    if (inpCantidad) {
      inpCantidad.addEventListener("input", function () {
        actualizarLineaDesdeCantidad(tr);
        actualizarTotalesReceta();
      });
      inpCantidad.addEventListener("blur", function () {
        const ing = (tr.querySelector(".inp-ingrediente") || {}).value || "";
        const cant = parseFloat(inpCantidad.value) || 0;
        if (ing.trim() && (cant <= 0 || isNaN(cant))) {
          showToast("La cantidad (Cant. g) debe ser mayor a 0.");
        }
      });
    }
    if (ln.cantidad != null && ln.cantidad > 0) {
      tr.dataset.basePctGraso = ln.pct_graso != null ? (ln.pct_graso / ln.cantidad * 100) : 0;
      tr.dataset.baseSolidos = ln.solidos_totales != null ? (ln.solidos_totales / ln.cantidad * 100) : 0;
      tr.dataset.basePod = ln.pod != null ? (ln.pod / ln.cantidad * 100) : 0;
      tr.dataset.basePac = ln.pac != null ? (ln.pac / ln.cantidad * 100) : 0;
      tr.dataset.precioKg = ln.precio != null && ln.precio !== "" ? ln.precio : "";
    }
    tbody.appendChild(tr);
    actualizarLineaDesdeCantidad(tr);
    actualizarTotalesReceta();
  }

  function valorCelda(tr, clase) {
    const celda = tr.querySelector("." + clase);
    if (!celda || !celda.textContent) return null;
    const v = parseFloat(celda.textContent.replace(",", "."));
    return isNaN(v) ? null : v;
  }

  function actualizarCeldaPrecioLinea(tr) {
    const cantidad = parseFloat((tr.querySelector(".inp-cantidad") || {}).value) || 0;
    const precioKg = parseFloat(tr.dataset.precioKg || "0") || 0;
    const precioLinea = (cantidad / 1000) * precioKg;
    const celda = tr.querySelector(".celda-precio-linea");
    if (celda) celda.textContent = precioLinea ? (Math.round(precioLinea * 100) / 100).toString() : "0";
  }

  function actualizarCeldaSolidosTot(tr) {
    const vGrasa = valorCelda(tr, "celda-pct-graso") || 0;
    const vSng = valorCelda(tr, "celda-solidos") || 0;
    const tot = vGrasa + vSng;
    const celda = tr.querySelector(".celda-solidos-tot");
    if (celda) celda.textContent = tot ? (Math.round(tot * 100) / 100).toString() : "0";
  }

  function actualizarLineaDesdeCantidad(tr) {
    const cantInput = tr.querySelector(".inp-cantidad");
    if (!cantInput) return;
    const cantidad = parseFloat(cantInput.value) || 0;
    const baseGraso = parseFloat(tr.dataset.basePctGraso || "0");
    const baseSolidos = parseFloat(tr.dataset.baseSolidos || "0");
    const basePod = parseFloat(tr.dataset.basePod || "0");
    const basePac = parseFloat(tr.dataset.basePac || "0");
    function g(pct) {
      return cantidad ? Math.round((cantidad * pct / 100) * 10000) / 10000 : 0;
    }
    function setCelda(clase, val) {
      const celda = tr.querySelector("." + clase);
      if (celda) celda.textContent = val != null && val !== "" ? String(val) : "0";
    }
    setCelda("celda-pct-graso", g(baseGraso) || "");
    setCelda("celda-solidos", g(baseSolidos) || "");
    setCelda("celda-pod", g(basePod) || "");
    setCelda("celda-pac", g(basePac) || "");
    actualizarCeldaSolidosTot(tr);
    actualizarCeldaPrecioLinea(tr);
    actualizarTotalesReceta();
  }

  function actualizarTotalesReceta() {
    const rows = document.querySelectorAll("#ingredientes-tbody tr");
    let tCant = 0, tGrasa = 0, tSng = 0, tPod = 0, tPac = 0, tPrecio = 0;
    rows.forEach(function (tr) {
      const vCant = parseFloat((tr.querySelector(".inp-cantidad") || {}).value) || 0;
      const vGrasa = valorCelda(tr, "celda-pct-graso") || 0;
      const vSng = valorCelda(tr, "celda-solidos") || 0;
      const vPod = valorCelda(tr, "celda-pod") || 0;
      const vPac = valorCelda(tr, "celda-pac") || 0;
      const vPrecioLinea = valorCelda(tr, "celda-precio-linea") || 0;
      tCant += vCant;
      tGrasa += vGrasa;
      tSng += vSng;
      tPod += vPod;
      tPac += vPac;
      tPrecio += vPrecioLinea;
      actualizarCeldaSolidosTot(tr);
      actualizarCeldaPrecioLinea(tr);
    });
    function fmt(x) {
      if (x === undefined || x === null || x === "" || isNaN(Number(x))) return "0";
      return (Math.round(Number(x) * 100) / 100).toString();
    }
    const elCant = document.getElementById("total-cantidad");
    const elGrasa = document.getElementById("total-grasa");
    const elSng = document.getElementById("total-solidos");
    const elSolTot = document.getElementById("total-solidos-tot");
    const elPod = document.getElementById("total-pod");
    const elPac = document.getElementById("total-pac");
    const elPrecio = document.getElementById("total-precio");
    if (elCant) elCant.textContent = fmt(tCant);
    if (elGrasa) elGrasa.textContent = fmt(tGrasa);
    if (elSng) elSng.textContent = fmt(tSng);
    if (elSolTot) elSolTot.textContent = fmt(tGrasa + tSng);
    if (elPod) elPod.textContent = fmt(tPod);
    if (elPac) elPac.textContent = fmt(tPac);
    if (elPrecio) elPrecio.textContent = fmt(tPrecio);
    function fmtPct(x) {
      if (x === undefined || x === null || isNaN(Number(x))) return "—";
      return (Math.round(Number(x) * 100) / 100) + " %";
    }
    var pctCant = 100;
    var pctGrasa = tCant ? (tGrasa / tCant * 100) : null;
    var pctSng = tCant ? (tSng / tCant * 100) : null;
    var pctSolTot = tCant ? ((tGrasa + tSng) / tCant * 100) : null;
    var pctPod = tCant ? (tPod / tCant * 100) : null;
    var pctPac = tCant ? (tPac / tCant * 100) : null;
    var elPctCant = document.getElementById("pct-cantidad");
    var elPctGrasa = document.getElementById("pct-grasa");
    var elPctSng = document.getElementById("pct-solidos");
    var elPctSolTot = document.getElementById("pct-solidos-tot");
    var elPctPod = document.getElementById("pct-pod");
    var elPctPac = document.getElementById("pct-pac");
    if (elPctCant) elPctCant.textContent = tCant ? "100 %" : "—";
    if (elPctGrasa) elPctGrasa.textContent = fmtPct(pctGrasa);
    if (elPctSng) elPctSng.textContent = fmtPct(pctSng);
    if (elPctSolTot) elPctSolTot.textContent = fmtPct(pctSolTot);
    if (elPctPod) elPctPod.textContent = fmtPct(pctPod);
    if (elPctPac) elPctPac.textContent = fmtPct(pctPac);
    var elTemp = document.getElementById("recipe-temperatura");
    if (elTemp) {
      var tempCalculada = (tPac !== 0 && !isNaN(tPac)) ? (Math.round((tPac / -2) * 10) / 10).toString() : "";
      elTemp.value = tempCalculada;
    }
    var elResumenTemp = document.getElementById("resumen-temperatura");
    var elResumenCosto = document.getElementById("resumen-costo-litro");
    var elResumenCant = document.getElementById("resumen-total-cant");
    if (elResumenTemp) elResumenTemp.textContent = (elTemp && elTemp.value.trim()) ? elTemp.value + " °C" : "—";
    if (elResumenCant) elResumenCant.textContent = tCant ? fmt(tCant) : "—";
    var denom = tCant > 0 ? tCant * 1.30 : 0;
    var costoPorLitro = denom > 0 ? (tPrecio / denom) * 1000 : null;
    if (elResumenCosto) elResumenCosto.textContent = (costoPorLitro != null && !isNaN(costoPorLitro)) ? (Math.round(costoPorLitro * 100) / 100).toString() : "—";
  }

  function setupIngredienteAutocomplete(tr) {
    const inp = tr.querySelector(".inp-ingrediente");
    const dropdown = tr.querySelector(".ingrediente-dropdown");
    const autocompleteContainer = tr.querySelector(".ingrediente-autocomplete");
    if (!inp || !dropdown || !autocompleteContainer) return;
    inp.setAttribute("autocomplete", "off");
    inp.setAttribute("role", "combobox");
    inp.setAttribute("aria-autocomplete", "list");
    inp.setAttribute("aria-expanded", "false");
    function returnDropdownToCell() {
      if (dropdown.parentNode !== autocompleteContainer) {
        autocompleteContainer.appendChild(dropdown);
      }
    }
    function fillFromBase(b) {
      inp.value = b.ingrediente || "";
      tr.dataset.basePctGraso = b.pct_graso ?? 0;
      tr.dataset.baseSolidos = b.solidos_totales ?? 0;
      tr.dataset.basePod = b.pod ?? 0;
      tr.dataset.basePac = b.pac ?? 0;
      tr.dataset.precioKg = b.precio != null ? b.precio : "";
      actualizarLineaDesdeCantidad(tr);
      dropdown.classList.add("hidden");
      dropdown.innerHTML = "";
      inp.setAttribute("aria-expanded", "false");
      returnDropdownToCell();
    }
    function positionDropdown() {
      var rect = inp.getBoundingClientRect();
      if (dropdown.parentNode !== document.body) {
        document.body.appendChild(dropdown);
      }
      dropdown.style.position = "fixed";
      dropdown.style.left = rect.left + "px";
      dropdown.style.width = Math.max(rect.width, 200) + "px";
      dropdown.style.minWidth = "140px";
      dropdown.style.maxHeight = "200px";
      dropdown.style.zIndex = "9999";
      var maxH = 200;
      var spaceBelow = window.innerHeight - rect.bottom - 2;
      if (spaceBelow >= maxH) {
        dropdown.style.top = (rect.bottom + 2) + "px";
        dropdown.style.bottom = "auto";
      } else {
        dropdown.style.bottom = (window.innerHeight - rect.top + 2) + "px";
        dropdown.style.top = "auto";
      }
    }
    function showMatches(q) {
      var ql = (q || "").toLowerCase().trim();
      var matches = state.baseIngredientes.filter(function (b) {
        return !ql || (b.ingrediente || "").toLowerCase().indexOf(ql) >= 0;
      }).slice(0, 15);
      dropdown.innerHTML = "";
      matches.forEach(function (b) {
        var li = document.createElement("li");
        li.textContent = b.ingrediente || "";
        li.setAttribute("role", "option");
        li.addEventListener("mousedown", function (e) {
          e.preventDefault();
          fillFromBase(b);
        });
        dropdown.appendChild(li);
      });
      var hasMatches = matches.length > 0;
      dropdown.classList.toggle("hidden", !hasMatches);
      inp.setAttribute("aria-expanded", hasMatches ? "true" : "false");
      if (hasMatches) positionDropdown();
      else returnDropdownToCell();
    }
    inp.addEventListener("focus", function () { showMatches(inp.value); });
    inp.addEventListener("input", function () { showMatches(inp.value); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        dropdown.classList.add("hidden");
        inp.setAttribute("aria-expanded", "false");
        returnDropdownToCell();
      }
    });
    inp.addEventListener("blur", function () {
      setTimeout(function () {
        dropdown.classList.add("hidden");
        inp.setAttribute("aria-expanded", "false");
        returnDropdownToCell();
      }, 200);
    });
  }

  function addLineaIngrediente() {
    const tbody = document.getElementById("ingredientes-tbody");
    appendIngredienteRow(tbody, {});
  }

  async function saveRecipe(e) {
    e.preventDefault();
    const validacion = validarCantidadesReceta();
    if (!validacion.ok) {
      showToast(validacion.mensaje);
      return;
    }
    const id = document.getElementById("recipe-id").value || null;
    const nombre = document.getElementById("recipe-name").value.trim();
    const tempVal = document.getElementById("recipe-temperatura").value.trim();
    const temperatura = tempVal === "" ? null : parseFloat(tempVal);
    const descripcion = document.getElementById("recipe-desc").value.trim();
    const ingredientes_lineas = getIngredientesLineasFromForm();
    const sb = getSupabase();
    if (!sb || !state.user) return;
    const ownerId = (id && state.recetas.find(function (r) { return r.id === id; })) ? state.recetas.find(function (r) { return r.id === id; }).user_id : state.user.id;
    const nombreNorm = nombre.toLowerCase();
    const misRecetas = state.recetas.filter(function (r) { return r.user_id === ownerId; });
    const nombreRepetido = misRecetas.some(function (r) {
      if (id && r.id == id) return false;
      return (r.nombre || "").toLowerCase().trim() === nombreNorm;
    });
    if (nombreRepetido) {
      showToast("Ya existe una receta con ese nombre.");
      return;
    }
    var chkPublica = document.getElementById("recipe-publica");
    const recetaExistente = id ? state.recetas.find(function (r) { return r.id === id; }) : null;
    const row = {
      user_id: (id && recetaExistente) ? recetaExistente.user_id : state.user.id,
      nombre,
      temperatura: isNaN(temperatura) ? null : temperatura,
      descripcion,
      ingredientes_lineas,
      publica: !!(chkPublica && chkPublica.checked),
    };
    if (id) {
      const { error } = await sb.from("recetas").update(row).eq("id", id);
      if (error) {
        showToast("Error al guardar: " + error.message);
        return;
      }
      showToast("Receta actualizada");
    } else {
      const { error } = await sb.from("recetas").insert(row);
      if (error) {
        showToast("Error al guardar: " + error.message);
        return;
      }
      showToast("Receta guardada");
    }
    await loadRecetas();
    document.getElementById("list-section").classList.remove("hidden");
    document.getElementById("form-section").classList.add("hidden");
  }

  async function deleteRecipe() {
    const id = state.editingRecipeId;
    if (!id) return;
    if (!confirm("¿Eliminar esta receta?")) return;
    const sb = getSupabase();
    const { error } = await sb.from("recetas").delete().eq("id", id);
    if (error) {
      showToast("Error al eliminar");
      return;
    }
    showToast("Receta eliminada");
    await loadRecetas();
    document.getElementById("detail-section").classList.add("hidden");
    document.getElementById("list-section").classList.remove("hidden");
  }

  function shareRecipeAsExcel() {
    var id = state.editingRecipeId;
    if (!id) return;
    var receta = state.recetas.find(function (r) { return r.id === id; });
    if (!receta) return;
    if (!window.XLSX) {
      showToast("No se cargó la librería Excel. Recarga la página.");
      return;
    }
    var lineas = Array.isArray(receta.ingredientes_lineas) ? receta.ingredientes_lineas : [];
    var rows = [
      ["Nombre", receta.nombre || ""],
      ["Temperatura (°C)", receta.temperatura != null ? receta.temperatura : ""],
      ["Descripción", receta.descripcion || ""],
      [],
      ["Ingrediente", "Cant. (g)", "% MG", "Sólidos", "P.O.D", "P.A.C"]
    ];
    lineas.forEach(function (ln) {
      rows.push([
        ln.ingrediente || "",
        ln.cantidad ?? "",
        ln.pct_graso ?? "",
        ln.solidos_totales ?? "",
        ln.pod ?? "",
        ln.pac ?? ""
      ]);
    });
    var ws = window.XLSX.utils.aoa_to_sheet(rows);
    var wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Receta");
    var safeName = (receta.nombre || "receta").replace(/[\\/*?:\[\]]/g, "_").trim() || "receta";
    window.XLSX.writeFile(wb, safeName + ".xlsx");
    showToast("Excel descargado");
  }

  function shareRecipeAsPDF() {
    var id = state.editingRecipeId;
    if (!id) return;
    var receta = state.recetas.find(function (r) { return r.id === id; });
    if (!receta) return;
    var temp = receta.temperatura != null ? receta.temperatura + " °C" : "—";
    var lineas = Array.isArray(receta.ingredientes_lineas) ? receta.ingredientes_lineas : [];
    var tableRows = "";
    if (lineas.length) {
      tableRows = "<table style='width:100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;'>";
      tableRows += "<thead><tr><th style='border:1px solid #333; padding:8px; text-align:left;'>Ingrediente</th><th style='border:1px solid #333; padding:8px; text-align:right;'>Cant. (g)</th><th style='border:1px solid #333; padding:8px; text-align:right;'>% MG</th><th style='border:1px solid #333; padding:8px; text-align:right;'>Sólidos</th><th style='border:1px solid #333; padding:8px; text-align:right;'>P.O.D</th><th style='border:1px solid #333; padding:8px; text-align:right;'>P.A.C</th></tr></thead><tbody>";
      lineas.forEach(function (ln) {
        tableRows += "<tr><td style='border:1px solid #333; padding:8px;'>" + (ln.ingrediente || "").replace(/</g, "&lt;") + "</td><td style='border:1px solid #333; padding:8px; text-align:right;'>" + (ln.cantidad ?? "") + "</td><td style='border:1px solid #333; padding:8px; text-align:right;'>" + (ln.pct_graso ?? "") + "</td><td style='border:1px solid #333; padding:8px; text-align:right;'>" + (ln.solidos_totales ?? "") + "</td><td style='border:1px solid #333; padding:8px; text-align:right;'>" + (ln.pod ?? "") + "</td><td style='border:1px solid #333; padding:8px; text-align:right;'>" + (ln.pac ?? "") + "</td></tr>";
      });
      tableRows += "</tbody></table>";
    }
    var html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + (receta.nombre || "Receta").replace(/</g, "&lt;") + "</title><style>body{ font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; } h1{ margin: 0 0 8px; } .meta{ color: #666; margin-bottom: 12px; }</style></head><body>";
    html += "<h1>" + (receta.nombre || "Receta").replace(/</g, "&lt;") + "</h1>";
    html += "<p class='meta'>Temperatura: " + temp + "</p>";
    if (receta.descripcion) html += "<p>" + (receta.descripcion || "").replace(/</g, "&lt;") + "</p>";
    html += tableRows;
    html += "</body></html>";
    var win = window.open("", "_blank");
    if (!win) {
      showToast("Permite ventanas emergentes para generar el PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 250);
    showToast("Usa 'Guardar como PDF' en el cuadro de impresión.");
  }

  // --- Base ingredientes ---
  async function loadBaseIngredientes() {
    const sb = getSupabase();
    if (!sb || !state.user) return;
    const { data, error } = await sb
      .from("base_ingredientes")
      .select("id, ingrediente, pct_graso, azucar, solidos_totales, pod, pac, lactosa, proteina, precio, nota, familia_id")
      .order("ingrediente");
    if (error) {
      console.error(error);
      return;
    }
    state.baseIngredientes = data || [];
  }

  function renderBaseIngredientes() {
    const tbody = document.getElementById("base-ingredientes-tbody");
    const empty = document.getElementById("empty-ingredientes");
    if (!tbody) return;
    const q = (document.getElementById("search-ingrediente") || {}).value || "";
    const ql = q.toLowerCase().trim();
    const list = ql
      ? state.baseIngredientes.filter(function (b) {
          return (b.ingrediente || "").toLowerCase().indexOf(ql) >= 0;
        })
      : state.baseIngredientes;
    tbody.innerHTML = "";
    list.forEach(function (b) {
      const tr = document.createElement("tr");
      var accionesCell = state.isSuperuser
        ? "<td><button type='button' class='btn ghost small btn-edit-base' data-id='" + b.id + "'>Editar</button> <button type='button' class='btn danger small btn-delete-base' data-id='" + b.id + "'>Eliminar</button></td>"
        : "<td></td>";
      tr.innerHTML =
        "<td>" + escapeHtml(b.ingrediente) + "</td>" +
        "<td style='text-align: right;'>" + (b.pct_graso ?? "") + "</td>" +
        "<td style='text-align: right;'>" + (b.pod ?? "") + "</td>" +
        "<td style='text-align: right;'>" + (b.pac ?? "") + "</td>" +
        "<td style='text-align: right;'>" + (b.solidos_totales ?? "") + "</td>" +
        "<td style='text-align: right;'>" + (b.precio ?? "") + "</td>" +
        accionesCell;
      if (state.isSuperuser) {
        tr.querySelector(".btn-edit-base").addEventListener("click", function () { openModalIngrediente(b.id); });
        tr.querySelector(".btn-delete-base").addEventListener("click", function () { deleteBaseIngrediente(b.id); });
      }
      tbody.appendChild(tr);
    });
    if (empty) {
      empty.classList.toggle("hidden", list.length > 0);
      empty.textContent = state.baseIngredientes.length === 0
        ? "No hay ingredientes. Añade los que uses en tus recetas."
        : "Ningún ingrediente coincide con la búsqueda.";
    }
  }

  function setModalIngredienteBloqueado(bloqueado, mensaje) {
    var errEl = document.getElementById("modal-ingrediente-error");
    var resto = document.getElementById("modal-ingrediente-resto");
    var notaField = document.getElementById("base-nota");
    var btnGuardar = document.getElementById("modal-ingrediente").querySelector("button[type='submit']");
    var campos = [document.getElementById("base-pct-graso"), document.getElementById("base-solidos"), document.getElementById("base-pod"), document.getElementById("base-pac"), notaField];
    if (errEl) {
      errEl.textContent = mensaje || "";
      errEl.classList.toggle("hidden", !bloqueado);
    }
    campos.forEach(function (el) {
      if (el) el.disabled = bloqueado;
    });
    if (resto) resto.classList.toggle("modal-campos-bloqueados", bloqueado);
    if (btnGuardar) btnGuardar.disabled = bloqueado;
  }

  async function openModalIngrediente(id) {
    const modal = document.getElementById("modal-ingrediente");
    document.getElementById("modal-ingrediente-title").textContent = id ? "Editar ingrediente" : "Nuevo ingrediente";
    document.getElementById("base-ingrediente-id").value = id || "";
    setModalIngredienteBloqueado(false, "");
    if (!id) await loadBaseIngredientes();
    if (id) {
      const b = state.baseIngredientes.find(function (x) {
        return x.id === id;
      });
      if (b) {
        document.getElementById("base-ingrediente-nombre").value = b.ingrediente || "";
        document.getElementById("base-pct-graso").value = b.pct_graso ?? "";
        document.getElementById("base-solidos").value = b.solidos_totales ?? "";
        document.getElementById("base-pod").value = b.pod ?? "";
        document.getElementById("base-pac").value = b.pac ?? "";
        document.getElementById("base-precio").value = b.precio ?? "";
      }
    } else {
      document.getElementById("form-ingrediente-base").reset();
      document.getElementById("base-ingrediente-id").value = "";
    }
    modal.showModal();
  }

  function ingredienteYaExiste(nombre, excluirId) {
    var n = (nombre || "").toLowerCase().trim();
    if (!n) return false;
    return state.baseIngredientes.some(function (b) {
      if (excluirId && b.id === excluirId) return false;
      return (b.ingrediente || "").toLowerCase().trim() === n;
    });
  }

  async function saveBaseIngrediente(e) {
    e.preventDefault();
    var id = (document.getElementById("base-ingrediente-id").value || "").trim() || null;
    var ingrediente = document.getElementById("base-ingrediente-nombre").value.trim();
    if (!ingrediente) {
      showToast("Escribe el nombre del ingrediente");
      return;
    }
    if (!id && ingredienteYaExiste(ingrediente, null)) {
      setModalIngredienteBloqueado(true, "Ese ingrediente ya existe. Cambia el nombre.");
      showToast("Ese ingrediente ya existe en la base.");
      document.getElementById("base-ingrediente-nombre").focus();
      return;
    }
    if (id && ingredienteYaExiste(ingrediente, id)) {
      setModalIngredienteBloqueado(true, "Ya hay otro ingrediente con ese nombre.");
      showToast("Ya hay otro ingrediente con ese nombre.");
      document.getElementById("base-ingrediente-nombre").focus();
      return;
    }
    var row = {
      user_id: state.user.id,
      ingrediente: ingrediente,
      pct_graso: parseFloat(document.getElementById("base-pct-graso").value) || 0,
      solidos_totales: parseFloat(document.getElementById("base-solidos").value) || 0,
      pod: parseFloat(document.getElementById("base-pod").value) || 0,
      pac: parseFloat(document.getElementById("base-pac").value) || 0,
      precio: parseFloat(document.getElementById("base-precio").value) || 0,
    };
    var sb = getSupabase();
    var res;
    try {
      if (id) {
        res = await sb.from("base_ingredientes").update(row).eq("id", id);
      } else {
        res = await sb.from("base_ingredientes").insert(row);
      }
    } catch (err) {
      var msg = (err && err.message) ? err.message : String(err);
      var esDuplicado = /23505|unique|duplicate|duplicad/i.test(msg);
      var texto = esDuplicado ? "Ese ingrediente ya existe. Cambia el nombre y vuelve a guardar." : ("Error: " + msg);
      setModalIngredienteBloqueado(true, texto);
      showToast(texto);
      document.getElementById("base-ingrediente-nombre").focus();
      return;
    }
    if (res && res.error) {
      var code = String(res.error.code || "");
      var msg = res.error.message || "";
      var esDuplicado = code === "23505" || /unique|duplicate|duplicad/i.test(msg);
      var texto = esDuplicado ? "Ese ingrediente ya existe. Cambia el nombre y vuelve a guardar." : ("Error: " + (msg || "no se pudo guardar"));
      setModalIngredienteBloqueado(true, texto);
      showToast(texto);
      document.getElementById("base-ingrediente-nombre").focus();
      return;
    }
    setModalIngredienteBloqueado(false, "");
    showToast(id ? "Ingrediente actualizado" : "Ingrediente guardado");
    document.getElementById("modal-ingrediente").close();
    await loadBaseIngredientes();
    renderBaseIngredientes();
  }

  async function deleteBaseIngrediente(id) {
    if (!confirm("¿Eliminar este ingrediente de la base?")) return;
    const sb = getSupabase();
    await sb.from("base_ingredientes").delete().eq("id", id);
    showToast("Ingrediente eliminado");
    await loadBaseIngredientes();
    renderBaseIngredientes();
  }

  async function handleImportExcel(e) {
    var file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!window.XLSX) {
      showToast("No se cargó la librería Excel. Recarga la página.");
      return;
    }
    var reader = new FileReader();
    reader.onload = async function (ev) {
      try {
        var data = new Uint8Array(ev.target.result);
        var wb = window.XLSX.read(data, { type: "array" });
        var sheetName = wb.SheetNames[0];
        var ws = wb.Sheets[sheetName];
        var json = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (!json || json.length < 2) {
          showToast("El Excel no tiene datos o la primera fila debe ser encabezados.");
          return;
        }
        var headers = json[0].map(function (h) { return String(h || "").toLowerCase().trim(); });
        var colIdx = function (names) {
          for (var i = 0; i < names.length; i++) {
            for (var j = 0; j < headers.length; j++) {
              if (headers[j].indexOf(names[i]) >= 0) return j;
            }
          }
          return -1;
        };
        var idxIng = colIdx(["ingrediente", "ingredientes"]);
        var idxGraso = colIdx(["graso", "porcentaje graso", "pct graso", "pct"]);
        var idxAzucar = colIdx(["azucar", "azúcar", "azucares"]);
        var idxSolidos = colIdx(["solidos", "sólidos totales", "solidos totales", "sng"]);
        var idxPod = colIdx(["p.o.d", "pod"]);
        var idxPac = colIdx(["p.a.c", "pac"]);
        var idxLactosa = colIdx(["lactosa"]);
        var idxProteina = colIdx(["proteína", "proteina"]);
        var idxPrecio = colIdx(["precio"]);
        var idxNota = colIdx(["nota"]);
        if (idxIng < 0) {
          showToast("No se encontró la columna 'Ingrediente' en el Excel.");
          return;
        }
        var rows = [];
        for (var r = 1; r < json.length; r++) {
          var row = json[r];
          var ing = row[idxIng] != null ? String(row[idxIng]).trim() : "";
          if (!ing) continue;
          rows.push({
            ingrediente: ing,
            pct_graso: parseNumCell(row[idxGraso]),
            azucar: parseNumCell(row[idxAzucar]),
            solidos_totales: parseNumCell(row[idxSolidos]),
            pod: parseNumCell(row[idxPod]),
            pac: parseNumCell(row[idxPac]),
            lactosa: parseNumCell(row[idxLactosa]),
            proteina: parseNumCell(row[idxProteina]),
            precio: parseNumCell(row[idxPrecio]),
            nota: idxNota >= 0 && row[idxNota] != null ? String(row[idxNota]).trim() : "",
          });
        }
        if (rows.length === 0) {
          showToast("No se encontraron filas con ingredientes.");
          return;
        }
        await loadBaseIngredientes();
        var nombresExistentes = {};
        state.baseIngredientes.forEach(function (b) {
          nombresExistentes[(b.ingrediente || "").toLowerCase().trim()] = true;
        });
        var insertados = 0;
        var omitidos = 0;
        var sb = getSupabase();
        if (!sb || !state.user) return;
        for (var i = 0; i < rows.length; i++) {
          var nombreNorm = (rows[i].ingrediente || "").toLowerCase().trim();
          if (nombresExistentes[nombreNorm]) {
            omitidos++;
            continue;
          }
          await sb.from("base_ingredientes").insert({
            user_id: state.user.id,
            ingrediente: rows[i].ingrediente,
            pct_graso: rows[i].pct_graso || 0,
            azucar: rows[i].azucar || 0,
            solidos_totales: rows[i].solidos_totales || 0,
            pod: rows[i].pod || 0,
            pac: rows[i].pac || 0,
            lactosa: rows[i].lactosa || 0,
            proteina: rows[i].proteina || 0,
            precio: rows[i].precio || 0,
            nota: rows[i].nota || "",
          });
          insertados++;
          nombresExistentes[nombreNorm] = true;
        }
        if (omitidos > 0) {
          showToast("Importados: " + insertados + ". Omitidos (duplicados): " + omitidos + ".");
        } else {
          showToast("Se importaron " + insertados + " ingredientes.");
        }
        await loadBaseIngredientes();
        renderBaseIngredientes();
      } catch (err) {
        console.error(err);
        showToast("Error al importar: " + (err.message || String(err)));
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function parseNumCell(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return isNaN(v) ? null : v;
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // --- Eventos ---
  function setup() {
    window.addEventListener("online", function () {
      setOfflineBanner(false);
    });
    window.addEventListener("offline", function () {
      setOfflineBanner(true);
    });
    setOfflineBanner(!navigator.onLine);

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        login(email, password);
      });
    }
    const btnRegister = document.getElementById("btn-register");
    if (btnRegister) {
      btnRegister.addEventListener("click", function () {
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        if (!email || !password) {
          showLoginMessage("Correo y contraseña requeridos");
          return;
        }
        register(email, password);
      });
    }
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) btnLogout.addEventListener("click", logout);

    document.querySelectorAll(".nav-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showView(btn.getAttribute("data-view"));
      });
    });

    const btnNewRecipe = document.getElementById("btn-new-recipe");
    if (btnNewRecipe) btnNewRecipe.addEventListener("click", async function () {
      await showView("recetas");
      await openRecipeForm(null);
    });
    const btnBackList = document.getElementById("btn-back-list");
    if (btnBackList) btnBackList.addEventListener("click", function () {
      document.getElementById("form-section").classList.add("hidden");
      document.getElementById("list-section").classList.remove("hidden");
    });
    const btnBackDetail = document.getElementById("btn-back-from-detail");
    if (btnBackDetail) btnBackDetail.addEventListener("click", function () {
      document.getElementById("detail-section").classList.add("hidden");
      document.getElementById("list-section").classList.remove("hidden");
    });
    const btnEditRecipe = document.getElementById("btn-edit-recipe");
    if (btnEditRecipe) btnEditRecipe.addEventListener("click", function () {
      openRecipeForm(state.editingRecipeId);
    });
    const btnDeleteRecipe = document.getElementById("btn-delete-recipe");
    if (btnDeleteRecipe) btnDeleteRecipe.addEventListener("click", deleteRecipe);
    var shareDropdown = document.getElementById("share-dropdown");
    var btnShareToggle = document.getElementById("btn-share-toggle");
    if (btnShareToggle && shareDropdown) {
      btnShareToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        shareDropdown.classList.toggle("hidden");
      });
      document.addEventListener("click", function () {
        shareDropdown.classList.add("hidden");
      });
    }
    const btnSharePdf = document.getElementById("btn-share-pdf");
    if (btnSharePdf) btnSharePdf.addEventListener("click", function () {
      shareRecipeAsPDF();
      if (shareDropdown) shareDropdown.classList.add("hidden");
    });
    const btnShareExcel = document.getElementById("btn-share-excel");
    if (btnShareExcel) btnShareExcel.addEventListener("click", function () {
      shareRecipeAsExcel();
      if (shareDropdown) shareDropdown.classList.add("hidden");
    });
    const btnCancelRecipe = document.getElementById("btn-cancel-recipe");
    if (btnCancelRecipe) btnCancelRecipe.addEventListener("click", function () {
      document.getElementById("form-section").classList.add("hidden");
      document.getElementById("list-section").classList.remove("hidden");
    });

    const recipeForm = document.getElementById("recipe-form");
    if (recipeForm) recipeForm.addEventListener("submit", saveRecipe);
    const btnAddLinea = document.getElementById("btn-add-linea");
    if (btnAddLinea) btnAddLinea.addEventListener("click", addLineaIngrediente);

    const searchRecipe = document.getElementById("search-recipe");
    if (searchRecipe) searchRecipe.addEventListener("input", renderRecipeList);
    const searchIngrediente = document.getElementById("search-ingrediente");
    if (searchIngrediente) searchIngrediente.addEventListener("input", renderBaseIngredientes);

    const btnNewIngrediente = document.getElementById("btn-new-ingrediente");
    if (btnNewIngrediente) btnNewIngrediente.addEventListener("click", function () {
      openModalIngrediente(null);
    });
    const btnImportExcel = document.getElementById("btn-import-excel");
    const inputImportExcel = document.getElementById("input-import-excel");
    if (btnImportExcel && inputImportExcel) {
      btnImportExcel.addEventListener("click", function () { inputImportExcel.click(); });
      inputImportExcel.addEventListener("change", handleImportExcel);
    }
    const formIngredienteBase = document.getElementById("form-ingrediente-base");
    if (formIngredienteBase) formIngredienteBase.addEventListener("submit", saveBaseIngrediente);
    const btnCerrarModal = document.getElementById("btn-cerrar-modal-ingrediente");
    const modalIngrediente = document.getElementById("modal-ingrediente");
    if (btnCerrarModal && modalIngrediente) {
      btnCerrarModal.addEventListener("click", function () { modalIngrediente.close(); });
      modalIngrediente.addEventListener("cancel", function () { modalIngrediente.close(); });
    }
    var inpNombreBase = document.getElementById("base-ingrediente-nombre");
    if (inpNombreBase) {
      inpNombreBase.addEventListener("blur", function () {
        var id = document.getElementById("base-ingrediente-id").value || null;
        var nombre = inpNombreBase.value.trim();
        if (!nombre) return;
        var duplicado = id ? ingredienteYaExiste(nombre, id) : ingredienteYaExiste(nombre, null);
        if (duplicado) {
          setModalIngredienteBloqueado(true, "Ese ingrediente ya existe. Cambia el nombre y luego guarda.");
          inpNombreBase.focus();
        }
      });
      inpNombreBase.addEventListener("input", function () {
        var id = document.getElementById("base-ingrediente-id").value || null;
        var nombre = inpNombreBase.value.trim();
        var duplicado = id ? ingredienteYaExiste(nombre, id) : ingredienteYaExiste(nombre, null);
        if (!duplicado) setModalIngredienteBloqueado(false, "");
      });
    }
  }

  function loadConfigFromApi() {
    var url = (window.location.origin || "") + "/api/config";
    return fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && typeof d.url === "string") window.RECETAS_SUPABASE_URL = d.url;
        if (d && typeof d.anonKey === "string") window.RECETAS_SUPABASE_ANON_KEY = d.anonKey;
      })
      .catch(function () {});
  }

  async function init() {
    var cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.key) {
      await loadConfigFromApi();
      cfg = getSupabaseConfig();
    }
    supabaseUrl = cfg.url;
    supabaseAnonKey = cfg.key;
    useSupabase = !!(supabaseUrl && supabaseAnonKey);
    setup();
    initAuth();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { init(); });
  } else {
    init();
  }
})();
