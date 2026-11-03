const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const estructuraAreas = {
    'MATEMÁTICA': ['Aritmética', 'Álgebra', 'Geometría', 'Trigonometría', 'RM'],
    'COMUNICACIÓN': ['Lenguaje', 'Literatura', 'Raz. Verbal', 'Plan Lector'],
    'INGLÉS': ['Inglés'],
    'ARTE Y CULTURA': ['Arte y Cultura'],
    'CIENCIAS SOCIALES': ['Geografía', 'Historia del Perú y del Mundo', 'Economía'],
    'DESARROLLO PER. Y CIUD.': ['Educación Cívica', 'Psicología', 'Filosofía Cívica'],
    'EDUCACIÓN FÍSICA': ['Educación Física'],
    'EDUCACIÓN RELIGIOSA': ['Educación Religiosa'],
    'CIENCIA Y TECNOLOGÍA': ['Biología', 'Física', 'Química'],
    'EDUCACIÓN PARA EL TRABAJO': ['Computación']
};

let planesGuardados = {};
let planEnEdicion = {}; 
let docentes = [];

document.addEventListener("DOMContentLoaded", () => {
    actualizarBanner();
});

// ---------------- 1. REGISTRO Y ELIMINACIÓN DE DOCENTES ----------------
document.getElementById('form-docente').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre-docente').value;
    const area = document.getElementById('area-docente').value;
    const nivel = document.getElementById('nivel-docente').value;
    const maxHoras = document.getElementById('horas-max-docente').value;
    const id = Date.now().toString();

    const diasSeleccionados = Array.from(document.querySelectorAll('.dia-docente:checked')).map(cb => cb.value);
    if(diasSeleccionados.length === 0) return alert('El docente debe asistir al colegio al menos un día.');

    docentes.push({ id, nombre, area, nivel, maxHoras: parseInt(maxHoras), diasPermitidos: diasSeleccionados });
    
    renderizarListaDocentes();
    actualizarSelectsDocentesUI();

    document.getElementById('nombre-docente').value = '';
    document.getElementById('horas-max-docente').value = '';
});

function renderizarListaDocentes() {
    const lista = document.getElementById('lista-docentes');
    lista.innerHTML = '';
    docentes.forEach(d => {
        let diasStr = d.diasPermitidos.length === 5 ? "Toda la semana" : d.diasPermitidos.join(', ');
        lista.innerHTML += `
            <li class="docente-item">
                <span>👨‍🏫 <strong>${d.nombre}</strong> | Área: ${d.area} | 🏫 Nivel: ${d.nivel} | 🕒 Max ${d.maxHoras}h/sem | 📅 Días: ${diasStr}</span>
                <button class="btn-delete" onclick="eliminarDocente('${d.id}')" title="Eliminar Docente">🗑️</button>
            </li>
        `;
    });
}

window.eliminarDocente = function(id) {
    if(!confirm("¿Estás seguro de eliminar a este docente? Se removerá también de los planes de estudio donde esté asignado.")) return;
    
    docentes = docentes.filter(d => d.id !== id);
    Object.values(planesGuardados).forEach(plan => {
        Object.values(plan.horas).forEach(cursoObj => {
            if (cursoObj.docenteId === id) cursoObj.docenteId = "";
        });
    });

    renderizarListaDocentes();
    renderizarTarjetasArea(); 
}

function actualizarSelectsDocentesUI() {
    const selects = document.querySelectorAll('.curso-docente-select');
    const nivelActual = document.getElementById('select-nivel').value;

    selects.forEach(select => {
        const selectedVal = select.value; 
        const area = select.getAttribute('data-area');
        const profesDisponibles = docentes.filter(d => d.area === area && nivelCoincide(nivelActual, d.nivel));
        
        let opcionesProfe = `<option value="">Sin Asignar</option>`;
        profesDisponibles.forEach(p => {
            opcionesProfe += `<option value="${p.id}">${p.nombre}</option>`;
        });
        
        select.innerHTML = opcionesProfe;
        if (selectedVal && profesDisponibles.some(p => p.id === selectedVal)) {
            select.value = selectedVal;
        }
    });
}

// ---------------- 2. PLAN DE ESTUDIOS (EDICIÓN Y ELIMINACIÓN) ----------------
window.actualizarBanner = function() {
    const nivel = document.getElementById('select-nivel').value;
    const grado = document.getElementById('select-grado').value;
    const sufijos = {'1':'ro', '2':'do', '3':'ro', '4':'to', '5':'to', '6':'to'};
    
    document.getElementById('banner-edicion').innerText = `ⓘ Configurando Plan de Estudios de ${grado}${sufijos[grado]} ${nivel}`;
    renderizarTarjetasArea();
}

function generarClaveGrado() {
    const nivel = document.getElementById('select-nivel').value;
    const grado = document.getElementById('select-grado').value;
    const sufijos = {'1':'ro', '2':'do', '3':'ro', '4':'to', '5':'to', '6':'to'};
    return `${grado}${sufijos[grado]} ${nivel}`;
}

function nivelCoincide(nivelClase, nivelDocente) {
    if (nivelDocente === 'Todos') return true;
    return nivelDocente.includes(nivelClase); 
}

function renderizarTarjetasArea() {
    const contenedor = document.getElementById('contenedor-areas');
    contenedor.innerHTML = '';
    const clave = generarClaveGrado();
    const nivelActual = document.getElementById('select-nivel').value;
    
    if (!planesGuardados[clave]) {
        planEnEdicion = JSON.parse(JSON.stringify(estructuraAreas));
        document.getElementById('input-secciones').value = 1;
    } else {
        planEnEdicion = JSON.parse(JSON.stringify(planesGuardados[clave].estructura));
        document.getElementById('input-secciones').value = planesGuardados[clave].secciones;
    }

    Object.keys(planEnEdicion).forEach(area => {
        const divCard = document.createElement('div');
        divCard.className = 'area-card';
        
        const profesDisponibles = docentes.filter(d => d.area === area && nivelCoincide(nivelActual, d.nivel));
        
        let htmlCursos = '';
        planEnEdicion[area].forEach((curso, index) => {
            let horasVal = 0;
            let docenteGuardadoId = "";

            if(planesGuardados[clave] && planesGuardados[clave].horas[curso]) {
                horasVal = planesGuardados[clave].horas[curso].horas;
                docenteGuardadoId = planesGuardados[clave].horas[curso].docenteId;
            }

            let opcionesProfe = `<option value="">Sin Asignar</option>`;
            profesDisponibles.forEach(p => {
                opcionesProfe += `<option value="${p.id}" ${docenteGuardadoId === p.id ? 'selected' : ''}>${p.nombre}</option>`;
            });

            htmlCursos += `
                <div class="curso-row">
                    <span class="curso-nombre">${curso}</span>
                    <input type="number" class="curso-horas" id="horas-${area}-${index}" value="${horasVal}" min="0">
                    <select class="curso-docente-select" id="docente-${area}-${index}" data-area="${area}">
                        ${opcionesProfe}
                    </select>
                    <button class="btn-delete" onclick="eliminarCurso('${area}', ${index})">🗑️</button>
                </div>
            `;
        });

        divCard.innerHTML = `
            <span class="area-tag">Área: ${area}</span>
            <div id="lista-cursos-${area}">${htmlCursos}</div>
            <div class="add-curso-row">
                <input type="text" id="nuevo-curso-${area}" placeholder="Agregar curso...">
                <button class="btn-add" onclick="agregarCurso('${area}')">+</button>
            </div>
        `;
        contenedor.appendChild(divCard);
    });
}

window.agregarCurso = function(area) {
    const input = document.getElementById(`nuevo-curso-${area}`);
    const nuevoNombre = input.value.trim();
    if (nuevoNombre) {
        planEnEdicion[area].push(nuevoNombre);
        guardarEstadoTemporal();
        renderizarTarjetasArea();
    }
}

window.eliminarCurso = function(area, index) {
    planEnEdicion[area].splice(index, 1);
    guardarEstadoTemporal();
    renderizarTarjetasArea();
}

function guardarEstadoTemporal() {
    const clave = generarClaveGrado();
    if(!planesGuardados[clave]) planesGuardados[clave] = { horas: {}, estructura: {} };
    
    Object.keys(planEnEdicion).forEach(area => {
        planEnEdicion[area].forEach((curso, index) => {
            const inputHoras = document.getElementById(`horas-${area}-${index}`);
            const inputDocente = document.getElementById(`docente-${area}-${index}`);
            if(inputHoras && inputDocente) {
                if(!planesGuardados[clave].horas[curso]) planesGuardados[clave].horas[curso] = {};
                planesGuardados[clave].horas[curso].horas = parseInt(inputHoras.value) || 0;
                planesGuardados[clave].horas[curso].docenteId = inputDocente.value;
            }
        });
    });
}

window.guardarPlanEstudios = function() {
    let totalCursosConHoras = 0;
    let cursosConDocenteAsignado = 0;

    Object.keys(planEnEdicion).forEach(area => {
        planEnEdicion[area].forEach((curso, index) => {
            const horas = parseInt(document.getElementById(`horas-${area}-${index}`).value) || 0;
            const docenteId = document.getElementById(`docente-${area}-${index}`).value;
            
            if (horas > 0) {
                totalCursosConHoras++;
                if (docenteId) cursosConDocenteAsignado++;
            }
        });
    });

    if (totalCursosConHoras === 0) return alert("⚠️ Asigna horas a los cursos primero.");
    
    const porcentajeAsignado = (cursosConDocenteAsignado / totalCursosConHoras) * 100;
    if (porcentajeAsignado < 90) {
        return alert(`⚠️ BLOQUEO: Debes asignar un docente al menos al 90% de los cursos activos. Tienes asignado el ${porcentajeAsignado.toFixed(1)}%.`);
    }

    const clave = generarClaveGrado();
    const secciones = parseInt(document.getElementById('input-secciones').value) || 1;
    let horasAsignadas = {};

    Object.keys(planEnEdicion).forEach(area => {
        planEnEdicion[area].forEach((curso, index) => {
            const horas = parseInt(document.getElementById(`horas-${area}-${index}`).value) || 0;
            const docenteId = document.getElementById(`docente-${area}-${index}`).value;
            if (horas > 0) {
                horasAsignadas[curso] = { horas: horas, area: area, docenteId: docenteId }; 
            }
        });
    });

    planesGuardados[clave] = { secciones, estructura: JSON.parse(JSON.stringify(planEnEdicion)), horas: horasAsignadas };
    actualizarPanelEstado();
    alert(`✅ Plan de estudios para ${clave} guardado correctamente.`);
}

function actualizarPanelEstado() {
    const lista = document.getElementById('lista-grados-guardados');
    lista.innerHTML = '';
    const claves = Object.keys(planesGuardados);
    
    if (claves.length === 0) {
        lista.innerHTML = '<li class="sin-datos">Sin planes guardados.</li>';
        return;
    }
    claves.forEach(c => {
        const numSecciones = planesGuardados[c].secciones;
        // Genera array de letras según la cantidad (ej: 3 => "A, B, C")
        const letrasSecciones = Array.from({length: numSecciones}, (_, i) => String.fromCharCode(65 + i)).join(', ');
        
        lista.innerHTML += `
            <li class="estado-item">
                <span>✔️ ${c} (Secciones: ${letrasSecciones})</span>
                <div class="estado-actions">
                    <button onclick="editarPlanGuardado('${c}')" title="Editar">✏️</button>
                    <button onclick="eliminarPlanGuardado('${c}')" title="Eliminar">🗑️</button>
                </div>
            </li>
        `;
    });
}

window.editarPlanGuardado = function(clave) {
    const grado = clave.charAt(0);
    const nivel = clave.split(" ")[1];
    document.getElementById('select-grado').value = grado;
    document.getElementById('select-nivel').value = nivel;
    actualizarBanner();
    window.scrollTo({ top: document.getElementById('plan-estudios').offsetTop, behavior: 'smooth' });
}

window.eliminarPlanGuardado = function(clave) {
    if(!confirm(`¿Seguro que deseas eliminar el plan guardado de ${clave}?`)) return;
    delete planesGuardados[clave];
    actualizarPanelEstado();
    
    if(generarClaveGrado() === clave) {
        actualizarBanner(); 
    }
}

// ---------------- 3. ALGORITMO DE BLOQUES Y SECCIONES EN LETRAS ----------------
document.getElementById('btn-generar').addEventListener('click', function() {
    if(Object.keys(planesGuardados).length === 0) return alert("Guarda al menos un plan de estudios primero.");
    
    const recreos = parseInt(document.getElementById('num-recreos').value);
    const horasPorDia = 8; 
    const contenedor = document.getElementById('contenedor-tablas');
    contenedor.innerHTML = ''; 

    let ocupacionGlobal = {}; 
    let horasSemanalesAsignadasGlobal = {}; 
    let hubieronConflictosGlobales = false;

    Object.keys(planesGuardados).forEach(claveGrado => {
        const config = planesGuardados[claveGrado];
        const nivelClase = claveGrado.split(' ')[1]; 

        for (let s = 1; s <= config.secciones; s++) {
            // Convertimos número a letra de la sección (1=A, 2=B, 3=C...)
            const seccionLetra = String.fromCharCode(64 + s); 
            
            const { matriz, conflictos } = generarHorarioAula(config.horas, horasPorDia, ocupacionGlobal, nivelClase, horasSemanalesAsignadasGlobal);
            if(conflictos > 0) hubieronConflictosGlobales = true;
            renderizarTabla(claveGrado, seccionLetra, matriz, conflictos, recreos, contenedor);
        }
    });

    if(hubieronConflictosGlobales) alert("⚠️ ATENCIÓN: Se generaron conflictos. Faltaron ubicar horas (ver casilleros Libre/Conflicto).");
});

function generarHorarioAula(horasRequeridas, horasPorDia, ocupacionGlobal, nivelClase, horasSemanalesAsignadasGlobal) {
    let matriz = Array.from({ length: horasPorDia }, () => Array(5).fill(null));
    
    let cursosPendientes = Object.keys(horasRequeridas).map(c => ({
        nombre: c, area: horasRequeridas[c].area, docenteId: horasRequeridas[c].docenteId, horasFaltantes: horasRequeridas[c].horas
    })).filter(c => c.horasFaltantes > 0);

    let contadorAreasDiarias = Array.from({ length: 5 }, () => ({}));

    for (let dia = 0; dia < 5; dia++) {
        for (let hora = 0; hora < horasPorDia; hora++) {
            if (matriz[hora][dia] !== null) continue; 

            cursosPendientes.sort(() => Math.random() - 0.5); 
            let asignacion = null;

            for (let curso of cursosPendientes) {
                if (curso.horasFaltantes <= 0) continue;
                let doc = docentes.find(d => d.id === curso.docenteId);
                if (!doc) continue; 

                if (!doc.diasPermitidos.includes(diasSemana[dia])) continue; 
                if ((horasSemanalesAsignadasGlobal[doc.id] || 0) >= doc.maxHoras) continue;

                let areaContadorActual = contadorAreasDiarias[dia][curso.area] || 0;

                // REGLA: Bloque indivisible de 2 horas
                if (curso.horasFaltantes >= 2) {
                    if (hora + 1 >= horasPorDia || matriz[hora+1][dia] !== null) continue; 
                    if (ocupacionGlobal[`${dia}-${hora}-${doc.id}`] || ocupacionGlobal[`${dia}-${hora+1}-${doc.id}`]) continue; 
                    if (areaContadorActual + 2 > 4) continue; 

                    asignacion = { curso: curso.nombre, profe: doc.nombre };
                    matriz[hora][dia] = asignacion;
                    matriz[hora+1][dia] = asignacion; 
                    
                    ocupacionGlobal[`${dia}-${hora}-${doc.id}`] = true;
                    ocupacionGlobal[`${dia}-${hora+1}-${doc.id}`] = true;
                    horasSemanalesAsignadasGlobal[doc.id] = (horasSemanalesAsignadasGlobal[doc.id] || 0) + 2;
                    curso.horasFaltantes -= 2;
                    contadorAreasDiarias[dia][curso.area] = areaContadorActual + 2;
                    break;
                } else {
                    // Solo asigna 1 hora suelta si le queda exactamente 1
                    if (ocupacionGlobal[`${dia}-${hora}-${doc.id}`]) continue; 
                    if (areaContadorActual + 1 > 4) continue; 

                    asignacion = { curso: curso.nombre, profe: doc.nombre };
                    matriz[hora][dia] = asignacion;
                    ocupacionGlobal[`${dia}-${hora}-${doc.id}`] = true;
                    horasSemanalesAsignadasGlobal[doc.id] = (horasSemanalesAsignadasGlobal[doc.id] || 0) + 1;
                    curso.horasFaltantes -= 1;
                    contadorAreasDiarias[dia][curso.area] = areaContadorActual + 1;
                    break; 
                }
            }
        }
    }
    
    let horasConflicto = cursosPendientes.reduce((acc, curr) => acc + curr.horasFaltantes, 0);
    return { matriz, conflictos: horasConflicto };
}

function renderizarTabla(grado, seccionLetra, matriz, conflictos, recreos, contenedor) {
    // Reemplaza los espacios para no romper el ID HTML (Ej: "tabla-1roPrimaria-A")
    const idTabla = `tabla-${grado.replace(/\s/g,'')}-${seccionLetra}`;
    const divContenedor = document.createElement('div');
    divContenedor.className = 'horario-container';
    
    const divHeader = document.createElement('div');
    divHeader.className = 'header-horario';
    
    let mensajeConflicto = conflictos > 0 ? `<div class="text-error">⚠️ Faltaron ubicar ${conflictos} horas.</div>` : `<div style="color: #059669; font-weight:bold;">✅ Horario completo.</div>`;

    divHeader.innerHTML = `
        <div><h3 style="margin:0;">${grado} - Sección ${seccionLetra}</h3>${mensajeConflicto}</div>
        <div class="header-actions">
            <button class="btn-conformidad" id="btn-conf-${idTabla}">Dar Conformidad</button>
            <button class="btn-pdf" id="btn-pdf-${idTabla}" disabled>📄 Descargar PDF</button>
        </div>
    `;
    divContenedor.appendChild(divHeader);

    const tabla = document.createElement('table');
    tabla.id = idTabla;
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>Hora</th>${diasSemana.map(d => `<th>${d}</th>`).join('')}</tr>`;
    tabla.appendChild(thead);

    const tbody = document.createElement('tbody');
    let horaLogica = 1;
    
    for (let h = 0; h < matriz.length; h++) {
        if (recreos === 1 && h === 4) tbody.innerHTML += `<tr class="recreo-row"><td>-</td><td colspan="5">🍔 RECREO ÚNICO</td></tr>`;
        else if (recreos === 2 && (h === 3 || h === 6)) tbody.innerHTML += `<tr class="recreo-row"><td>-</td><td colspan="5">🍎 RECREO</td></tr>`;

        let tr = `<tr><td><strong>Hora ${horaLogica}</strong></td>`;
        for (let d = 0; d < 5; d++) {
            let celda = matriz[h][d];
            if (celda) tr += `<td><strong>${celda.curso}</strong><br><small>${celda.profe}</small></td>`;
            else tr += `<td class="hora-libre">Libre / Conflicto</td>`;
        }
        tr += '</tr>';
        tbody.innerHTML += tr;
        horaLogica++;
    }
    tabla.appendChild(tbody);
    divContenedor.appendChild(tabla);
    contenedor.appendChild(divContenedor);

    document.getElementById(`btn-conf-${idTabla}`).onclick = function() {
        if(confirm("¿Estás seguro de aprobar este horario?")) {
            this.innerText = "Conformidad Aprobada ✔️";
            this.classList.add('aprobado');
            document.getElementById(`btn-pdf-${idTabla}`).disabled = false;
        }
    };

    document.getElementById(`btn-pdf-${idTabla}`).onclick = function() {
        imprimirHorario(grado, seccionLetra, idTabla);
    };
}

function imprimirHorario(grado, seccionLetra, idTabla) {
    const tablaHtml = document.getElementById(idTabla).outerHTML;
    const ventanaImpresion = window.open('', '', 'width=900,height=650');
    ventanaImpresion.document.write(`
        <html><head><title>Horario ${grado} - Sección ${seccionLetra}</title>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #1e3a8a; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: center; }
            th { background-color: #1e3a8a; color: white; -webkit-print-color-adjust: exact; }
            .recreo-row { background-color: #fef08a; font-weight: bold; -webkit-print-color-adjust: exact; }
            .hora-libre { background-color: #fee2e2; color: #ef4444; -webkit-print-color-adjust: exact; }
        </style></head>
        <body><h1>Horario Escolar: ${grado} - Sección ${seccionLetra}</h1>${tablaHtml}
        <script>window.onload = function() { window.print(); window.close(); }<\/script></body></html>
    `);
    ventanaImpresion.document.close();
}