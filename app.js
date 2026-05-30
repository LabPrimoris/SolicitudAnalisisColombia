 // ── Set global de análisis seleccionados (lo usan las tarjetas del index.html) ──
const analisisSeleccionados = new Set();

// Códigos que SÍ permiten servicio urgente / extra urgente
const CODIGOS_URGENTE_PERMITIDOS = new Set([
    'GMS + LMS', 'LMS', 'GMS', 'GMSL + LMSL', 'GGA', 'CS2', 'DTC'
]);

function actualizarDisponibilidadUrgente() {
    // Hay análisis seleccionado que NO está en la lista permitida?
    const hayNoPermitido = [...analisisSeleccionados].some(val => {
        const match = val.match(/^\(([^)]+)\)/);
        if (!match) return true; // sin código entre paréntesis → no permitido
        return !CODIGOS_URGENTE_PERMITIDOS.has(match[1].trim());
    });

    const btn36    = document.getElementById('urgente36');
    const btnExtra = document.getElementById('extraurgente');
    const wrap36   = btn36   && btn36.closest('.form-check');
    const wrapExtra= btnExtra && btnExtra.closest('.form-check');
    const aviso    = document.getElementById('aviso-urgente');

    if (hayNoPermitido) {
        // Si estaba marcado un urgente, vuelve a Normal
        if (btn36   && btn36.checked)   { btn36.checked   = false; document.getElementById('normal').checked = true; }
        if (btnExtra && btnExtra.checked){ btnExtra.checked = false; document.getElementById('normal').checked = true; }
        if (btn36)    btn36.disabled    = true;
        if (btnExtra) btnExtra.disabled = true;
        if (wrap36)   { wrap36.style.opacity = '0.35'; wrap36.style.pointerEvents = 'none'; }
        if (wrapExtra) { wrapExtra.style.opacity = '0.35'; wrapExtra.style.pointerEvents = 'none'; }
        if (aviso)    aviso.style.display = 'none';
    } else {
        if (btn36)    btn36.disabled    = false;
        if (btnExtra) btnExtra.disabled = false;
        if (wrap36)   { wrap36.style.opacity = ''; wrap36.style.pointerEvents = ''; }
        if (wrapExtra) { wrapExtra.style.opacity = ''; wrapExtra.style.pointerEvents = ''; }
        if (aviso)    aviso.style.display = '';
    }
}

function toggleAnalisis(card, value) {
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        analisisSeleccionados.delete(value);
    } else {
        card.classList.add('selected');
        analisisSeleccionados.add(value);
    }
    actualizarResumen();
    verificarAlertaEspecial(card);
    actualizarDisponibilidadUrgente();
}

function actualizarResumen() {
    const el = document.getElementById('analisis-resumen');
    if (!el) return;
    if (analisisSeleccionados.size === 0) {
        el.innerHTML = '<span style="color:#aaa;">Ningún análisis seleccionado aún.</span>';
    } else {
        const tags = [...analisisSeleccionados].map(v => {
            const code = v.match(/\(([^)]+)\)/);
            const label = code ? code[1] : v.split(' ')[0];
            return `<span class="resumen-tag">${label}</span>`;
        }).join('');
        el.innerHTML = `<span class="resumen-titulo">${analisisSeleccionados.size} análisis seleccionado${analisisSeleccionados.size > 1 ? 's' : ''}:</span>${tags}`;
    }
}

// ── Alertas especiales por tarjeta ──
const alertasEspeciales = {
    'card-mino':  '⚠️ Para este análisis la muestra debe enviarse en <b>frasco de vidrio</b> y con <b>aluminio en la tapa</b> para evitar contacto con materiales plásticos.',
    'card-ethox': '⚠️ Esta muestra debe enviarse en un <b>empaque herméticamente sellado</b>.',
    'card-phos':  '⚠️ Esta muestra debe enviarse en un <b>empaque herméticamente sellado</b>.',
    'card-sulfi': '⚠️ Esta muestra debe enviarse en un <b>empaque herméticamente sellado</b>.',
    'card-vinac': '⚠️ Esta muestra debe enviarse en un <b>empaque herméticamente sellado</b>.',
    'card-cloro': '⚠️ Para este método es necesario enviar la <b>muestra de forma independiente</b>.'
    
};

function verificarAlertaEspecial(card) {
    if (!card.classList.contains('selected')) return;
    const id = card.id;
    if (id && alertasEspeciales[id]) showInfoPopup(alertasEspeciales[id]);
}

function showInfoPopup(message) {
    if (document.getElementById('__popup_overlay__')) return;
    const overlay = document.createElement('div');
    overlay.id = '__popup_overlay__';
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.45)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 9999
    });
    const box = document.createElement('div');
    Object.assign(box.style, {
        background: '#fff', padding: '18px', borderRadius: '10px',
        maxWidth: '480px', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', textAlign: 'left'
    });
    const p = document.createElement('p');
    p.style.margin = '0 0 12px';
    p.innerHTML = message;
    box.appendChild(p);
    const btn = document.createElement('button');
    btn.textContent = 'Entendido';
    Object.assign(btn.style, {
        background: '#3B6D11', color: '#fff', border: 'none',
        padding: '8px 14px', borderRadius: '8px', cursor: 'pointer'
    });
    btn.addEventListener('click', () => document.body.removeChild(overlay));
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

// ── Pestañas ──
function switchAnalisisTab(name, btn) {
    document.querySelectorAll('.analisis-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.analisis-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    btn.classList.add('active');
}

// ── Carga imagen para PDF ──
async function loadImage(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('No se pudo cargar la imagen: ' + url);
    const blob = await r.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ── Evento submit del formulario ──
window.addEventListener('load', () => {

    const form = document.querySelector('#form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const NombreSolicitante = document.getElementById('NombreSolicitante').value;
        const Nit               = document.getElementById('Nit').value;
        const Direccion         = document.getElementById('Direccion').value;
        const Ciudad            = document.getElementById('Ciudad').value;
        const PersonaContacto   = document.getElementById('PersonaContacto').value;
        const TelefonoContacto  = document.getElementById('TelefonoContacto').value;

        let NombreFacturante, NitFacturante, CiudadFacturante, TelefonoFacturante;
        if (document.getElementById('FacturanteSi').checked) {
            NombreFacturante   = NombreSolicitante;
            NitFacturante      = Nit;
            CiudadFacturante   = Ciudad;
            TelefonoFacturante = TelefonoContacto;
        } else {
            NombreFacturante   = document.getElementById('NombreFacturante').value;
            NitFacturante      = document.getElementById('NitFacturante').value;
            CiudadFacturante   = document.getElementById('CiudadFacturante').value;
            TelefonoFacturante = document.getElementById('TelefonoFacturante').value;
        }

        const fact        = document.getElementById('fact').value;
        const matriz      = document.getElementById('matriz').value;
        const fecha       = document.getElementById('fecha').value;
        const codigo      = document.getElementById('codigo').value;
        const anotaciones   = document.getElementById('anotaciones').value;
        const fechaenvio    = document.getElementById('fechaenvio').value;
        const enviante      = document.getElementById('enviante').value;
        const servicioEl    = document.querySelector('input[name="tipoServicio"]:checked');
        const tipoServicio  = servicioEl ? servicioEl.value : 'normal';

        const todosAnalisis = [...analisisSeleccionados];

        generatePDF(
            NombreSolicitante, Nit, TelefonoContacto, Direccion, Ciudad, PersonaContacto,
            NombreFacturante, NitFacturante, CiudadFacturante, TelefonoFacturante,
            fact, matriz, fecha, codigo,
            todosAnalisis,
            anotaciones, fechaenvio, enviante, tipoServicio
        );
    });

    // ── Botón correo ──
    document.getElementById("enviarCorreoBtn").addEventListener("click", function () {
        const nombre = document.getElementById("NombreSolicitante").value.trim();
        if (!nombre) {
            alert("Por favor, completa el campo 'Empresa o persona titular del resultado'.");
            return;
        }

        // Disparar descarga del PDF automáticamente
        document.getElementById("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        const destinatarios = "registro@primoris-lab.ec;luz.romero@primoris-lab.ec;christian.velasco@primoris-lab.ec";
        const asunto = `Solicitud de servicio / Demanda de análisis ${nombre}`;
        const cuerpo =
            `Cordial saludo, Adjunto solicitud de servicio para ${nombre}.\n\n` +
            `⚠️ ¡IMPORTANTE! ⚠️\n` +
            `No olvide adjuntar en este correo la solicitud PDF generada.`;
        window.location.href = `mailto:${destinatarios}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    });
});

// ── Generar PDF ──
async function generatePDF(
    NombreSolicitante, Nit, TelefonoContacto, Direccion, Ciudad, PersonaContacto,
    NombreFacturante, NitFacturante, CiudadFacturante, TelefonoFacturante,
    fact, matriz, fecha, codigo,
    todosAnalisis,
    anotaciones, fechaenvio, enviante, tipoServicio
) {
    const image = await loadImage("imagenes/FormatoSolicitud2.jpg");
    const pdf = new jsPDF('1', 'pt', [612, 792]);

    pdf.addImage(image, 'PNG', 0, 0, 612, 792);

    // Datos empresa
    pdf.setFontSize(9);
    pdf.text(NombreSolicitante, 130, 155);
    pdf.text(Nit, 448, 155);
    pdf.setFontSize(8);
    pdf.text(Direccion, 130, 165);
    pdf.text(Ciudad, 448, 165);
    pdf.text(PersonaContacto, 130, 175);
    pdf.text(TelefonoContacto, 448, 175);

    // Datos facturante
    pdf.setFontSize(9);
    pdf.text(NombreFacturante, 130, 205);
    pdf.text(NitFacturante, 448, 205);
    pdf.setFontSize(8);
    pdf.text(CiudadFacturante, 130, 217);
    pdf.text(TelefonoFacturante, 448, 217);
    pdf.text(fact, 130, 227);

    // Datos muestra
    pdf.text(matriz, 175, 265);
    pdf.text(fecha, 448, 263);
    pdf.text(codigo, 175, 280);

    // Análisis seleccionados
    const colCodigo  = 60;
    const colDesc    = 165;
    const SPACE_AVAIL = 130;   // pt disponibles entre startY=338 y el borde de la sección siguiente
    let startY = 338;

    if (todosAnalisis.length > 0) {
        const n = todosAnalisis.length;

        // Tamaño de fuente y alto de fila se reducen cuando hay muchos análisis
        // Mínimos razonables: fontSize 5.5 pt, rowH 8 pt
        const fontSize = Math.max(5.5, Math.min(8,   (SPACE_AVAIL / n) * 0.62));
        const ROW_H    = Math.max(8,   Math.min(14,  SPACE_AVAIL / n));

        // Ancho descripción se recalcula con la fuente elegida
        const colDescW = 375;

        todosAnalisis.forEach((analisis, i) => {
            if (i % 2 === 0) {
                pdf.setFillColor(246, 250, 244);
                pdf.rect(colCodigo - 4, startY - ROW_H + 2, 490, ROW_H, 'F');
            }

            const matchCodigo = analisis.match(/^\(([^)]+)\)/);
            const codigo_pdf  = matchCodigo ? matchCodigo[1] : analisis.split(' ').slice(0, 2).join(' ');
            const desc_pdf    = matchCodigo
                ? analisis.replace(/^\([^)]+\)\s*/, '').trim()
                : analisis;

            pdf.setFontSize(fontSize);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(45, 90, 15);
            pdf.text(codigo_pdf, colCodigo, startY);

           pdf.setFont(undefined, 'normal');
            pdf.setTextColor(30, 30, 30);
            // Con fuente pequeña las descripciones caben en 1 línea; splitTextToSize lo confirma
            const descLines = pdf.splitTextToSize(desc_pdf, colDescW);
            pdf.text(descLines[0], colDesc, startY);   // solo primera línea para respetar el ROW_H dinámico

            startY += ROW_H;
        });
    }

    // Orgánico
    const orgSi = document.getElementById('OrgSi');
    const orgNo = document.getElementById('OrgNo');
    if (orgSi && orgSi.checked) pdf.text('X', 358, 510);
    if (orgNo && orgNo.checked) pdf.text('X', 448, 510);

    // Tipo servicio
    pdf.setFontSize(10);
    if (tipoServicio === 'urgente36')         pdf.text("X", 320, 562);
    else if (tipoServicio === 'extraurgente') pdf.text("X", 429, 562);
    else                                      pdf.text("X", 159, 562);

    // Observaciones
    pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(anotaciones, 450);
    pdf.text(lines, 125, 536);

    // Fecha y responsable
    pdf.text(fechaenvio, 240, 600);
    pdf.text(enviante, 435, 600);

    pdf.save("Solicitud_Analisis_PRIMORIS.pdf");
}
