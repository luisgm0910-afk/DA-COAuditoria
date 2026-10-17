const LISTA_CATEGORIAS = ["Conteos Diarios", "Base de Datos", "Auditorias de Inventario"];
    let baseDeDatos = [];
    let logConsultasIA = [];
    let tabActual = "TODOS";
    let tempDatosGlobal = null;
    let idEditando = null;
    let idParaDescargar = null;
    let idParcialActual = null;
    let rolUsuarioActual = "";
    const claves = { AUDITOR: "20273008", GERENCIA: "acarigua" };
    
    let html5QrCode = null;
    let html5QrCodeModal = null;
    let miGrafico = null;
    
    let datosTablaValidadorCache = [];
    let conteoTemporalLista = {};

    // Resetear la variable del parcial al finalizar por completo
    idParcialActual = null;
    conteoTemporalLista = {}; 
    actualizarBotonYContadorMasivo();

    // --- INICIALIZACIÓN DE PÁGINA ---
    window.onload = async function() {
        await cargarDeServidor();
        if (datosTablaValidadorCache && datosTablaValidadorCache.length > 0) {
            document.getElementById('contenedorTablaValidador').style.display = "block";
            actualizarBotonYContadorMasivo();
            filtrarTablaValidadorInterno();
        }
    };

    // --- NAVEGACIÓN Y MENÚS ---
    function toggleMenuGestion() {
        const menu = document.getElementById('menuGestionUnificado');
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    }

    function abrirPuenteEtiqueta() { window.open("http://172.43.0.24/categoria/index.html", "_self"); }
    function abrirPuentePostventa() { window.open("http://172.43.0.24/postventa/2.html", "_self"); }
    function abrirPuentePrecios() { window.open("http://172.43.0.24/precios/precios.html", "_self"); }
    function abrirPuenteResguardo() { window.open("http://172.43.0.24/incidencia/reguardo.html", "_self"); }
    function abrirPuenteEtiquetas() { window.open("http://172.43.0.2:8099/www/DAMASCO/ETIQUETAS/index.php", "_blank"); }

    function toggleMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlayMenu');
        sidebar.classList.toggle('active');
        overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
    }

    function toggleSidebarPC() {
        const sidebar = document.getElementById('sidebar');
        const btn = document.getElementById('btnToggleSidebarPC');
        sidebar.classList.toggle('guardada');
        
        if (sidebar.classList.contains('guardada')) {
            btn.innerHTML = "➡️ Mostrar Menú";
            btn.style.backgroundColor = "#27ae60";
        } else {
            btn.innerHTML = "⬅️ Ocultar Menú";
            btn.style.backgroundColor = "var(--primary)";
        }
    }

    function toggleBarraFiltros() {
        const barra = document.getElementById('barraFiltrosValidadorContenedor');
        const btn = document.getElementById('btnToggleFiltrosVal');
        
        barra.classList.toggle('visible');
        
        if (barra.classList.contains('visible')) {
            btn.innerHTML = "🔍 OCULTAR FILTROS ▲";
            btn.style.backgroundColor = "#2c3e50";
        } else {
            btn.innerHTML = "🔍 BUSCAR / FILTRAR DATA ▼";
            btn.style.backgroundColor = "#34495e";
        }
    }

    // --- COMUNICACIÓN CON SERVIDOR API ---
    async function cargarDeServidor() {
        try {
            const resp = await fetch('api.php');
            if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`);
            
            const datosRecibidos = await resp.json();
            baseDeDatos = Array.isArray(datosRecibidos) ? datosRecibidos : [];
            
            actualizarTablaPrincipal();
            
            const docCache = baseDeDatos.find(r => r.nombre === "VAL_CACHE_SISTEMA");
            const docConteo = baseDeDatos.find(r => r.nombre === "VAL_CONTEO_SISTEMA");
            
            if (docCache && docCache.datos) { datosTablaValidadorCache = docCache.datos; }
            if (docConteo && docConteo.datos) { conteoTemporalLista = docConteo.datos; }

            if (datosTablaValidadorCache && datosTablaValidadorCache.length > 0) {
                const contTabla = document.getElementById('contenedorTablaValidador');
                if (contTabla) contTabla.style.display = "block";
                reconstruirSelectoresFiltros(datosTablaValidadorCache);
            }
        } catch(e) { 
            console.error("Error de conexión al servidor local:", e); 
        }
    }

    async function guardarEnServidor() {
        try {
            const resp = await fetch('api.php', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(baseDeDatos) 
            });
            if (!resp.ok) throw new Error(`Error de servidor status: ${resp.status}`);
            const resultado = await resp.json();
            if (resultado.status !== "ok") throw new Error(resultado.mensaje || "El servidor no confirmó el guardado.");
            return true;
        } catch(e) { 
            console.error("Error al sincronizar datos con api.php:", e); 
            return false;
        }
    }

    // --- GESTIÓN DE TABLA Y DOCUMENTOS ---
    function actualizarTablaPrincipal() {
        const tbody = document.querySelector('#tablaRegistros tbody');
        if (!tbody) return;
        tbody.replaceChildren();
        const filtrados = tabActual === "TODOS" ? baseDeDatos : baseDeDatos.filter(r => r.categoria === tabActual);

        filtrados.forEach(reg => {
            if (!reg || reg.nombre === "VAL_CACHE_SISTEMA" || reg.nombre === "VAL_CONTEO_SISTEMA") return;
            const tr = document.createElement('tr');
            const tdNombre = document.createElement('td');
            const strong = document.createElement('strong');
            strong.textContent = String(reg.nombre ?? '');
            tdNombre.appendChild(strong);

            const tdCategoria = document.createElement('td');
            tdCategoria.textContent = String(reg.categoria ?? '');
            const tdFecha = document.createElement('td');
            tdFecha.textContent = String(reg.fecha ?? '');
            const tdAcciones = document.createElement('td');

            const btnVer = document.createElement('button');
            btnVer.className = 'btn btn-ver';
            btnVer.textContent = 'Ver';
            btnVer.addEventListener('click', () => abrirParaEditar(reg.id));

            const btnDescargar = document.createElement('button');
            btnDescargar.className = 'btn btn-descargar';
            btnDescargar.textContent = '⬇';
            btnDescargar.title = 'Descargar documento';
            btnDescargar.addEventListener('click', () => abrirModalModalDescarga(reg.id));

            const btnBorrar = document.createElement('button');
            btnBorrar.className = 'btn btn-borrar';
            btnBorrar.textContent = 'X';
            btnBorrar.title = 'Eliminar documento';
            btnBorrar.addEventListener('click', () => borrarRegistro(reg.id));

            tdAcciones.append(btnVer, btnDescargar, btnBorrar);
            tr.append(tdNombre, tdCategoria, tdFecha, tdAcciones);
            tbody.appendChild(tr);
        });
    }

    function cambiarTab(cat) { 
        tabActual = cat; 
        document.getElementById('seccionIA').style.display = "none"; 
        document.getElementById('vistaReporte').style.display = "none"; 
        document.getElementById('vistaValidadorInterno').style.display = "none"; 
        document.getElementById('vistaTabla').style.display = "block"; 
        document.getElementById('controlesHeader').style.display = "flex"; 
        document.getElementById('tituloVista').innerText = cat; 
        actualizarTablaPrincipal(); 
        if(window.innerWidth <= 768) toggleMenu(); 
    }

    function abrirModalModalDescarga(id) {
        idParaDescargar = id;
        document.getElementById('modalDescarga').style.display = 'flex';
    }

    function ejecutarDescarga(tipo) {
        const reg = baseDeDatos.find(r => r.id === idParaDescargar);
        if (!reg) return;
        
        if (tipo === 'xlsx') {
            const ws = XLSX.utils.aoa_to_sheet(reg.datos);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Datos");
            XLSX.writeFile(wb, `${reg.nombre}.xlsx`);
        } else if (tipo === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'pt');
            doc.setFontSize(14);
            doc.text(reg.nombre, 40, 40);
            doc.autoTable({ startY: 60, head: [reg.datos[0]], body: reg.datos.slice(1), theme: 'grid' });
            doc.save(`${reg.nombre}.pdf`);
        }
        document.getElementById('modalDescarga').style.display = 'none';
    }

    async function borrarRegistro(id) {
        if (!confirm("¿Estás seguro de eliminar este documento permanentemente?")) return;
        await cargarDeServidor();
        baseDeDatos = baseDeDatos.filter(r => r.id !== id);
        await guardarEnServidor();
        actualizarTablaPrincipal();
    }

    // --- EDITOR DE TABLAS INTERACTIVO ---
    function abrirParaEditar(id) {
        idEditando = id; 
        const reg = baseDeDatos.find(r => r.id === id); 
        const tabla = document.getElementById('tablaEdicionContenido'); 
        tabla.innerHTML = "";
        reg.datos.forEach(fila => { 
            const tr = document.createElement('tr'); 
            fila.forEach(celda => { 
                const td = document.createElement('td'); 
                td.innerText = celda || ""; 
                td.contentEditable = "true"; 
                tr.appendChild(td); 
            }); 
            tabla.appendChild(tr); 
        });
        document.getElementById('tituloEditor').innerText = "Editando: " + reg.nombre; 
        document.getElementById('modalEditor').style.display = 'flex';
    }

    function abrirEditorNuevo() { 
        idEditando = null; 
        document.getElementById('tituloEditor').innerText = "Crear Nuevo Documento"; 
        const tabla = document.getElementById('tablaEdicionContenido'); 
        tabla.innerHTML = ""; 
        for(let f=0; f<10; f++){ 
            let tr = document.createElement('tr'); 
            for(let c=0; c<5; c++){ 
                let td = document.createElement('td'); 
                td.contentEditable = "true"; 
                tr.appendChild(td); 
            } 
            tabla.appendChild(tr); 
        } 
        document.getElementById('modalEditor').style.display = 'flex'; 
    }

    function cerrarEditor() { document.getElementById('modalEditor').style.display = 'none'; }
    function cerrarModalManual() { document.getElementById('modalSubidaManual').style.display = 'none'; }
    
    function agregarFila() { const tabla = document.getElementById('tablaEdicionContenido'); let tr = document.createElement('tr'); for(let i=0; i<(tabla.rows[0]?tabla.rows[0].cells.length:5); i++) { let td = document.createElement('td'); td.contentEditable = "true"; tr.appendChild(td); } tabla.appendChild(tr); }
    function eliminarFila() { const tabla = document.getElementById('tablaEdicionContenido'); if (tabla.rows.length > 0) tabla.deleteRow(-1); }
    function agregarColumna() { const tabla = document.getElementById('tablaEdicionContenido'); Array.from(tabla.rows).forEach(row => { let td = document.createElement('td'); td.contentEditable = "true"; row.appendChild(td); }); }
    function eliminarColumna() { const tabla = document.getElementById('tablaEdicionContenido'); Array.from(tabla.rows).forEach(row => { if(row.cells.length > 0) row.deleteCell(-1); }); }

    function prevenirColisionesGuardadoYCamposVacios() {
        const filas = Array.from(document.getElementById('tablaEdicionContenido').rows);
        tempDatosGlobal = filas.map(tr => Array.from(tr.cells).map(td => td.innerText || ""));
        document.getElementById('nombreArchivoNuevo').value = idEditando ? "" : "DOC_" + Date.now();
        llenarSelectorCategorias(); 
        document.getElementById('modalEditor').style.display = 'none'; 
        document.getElementById('modalSubidaManual').style.display = 'flex';
    }

    function llenarSelectorCategorias() {
        const select = document.getElementById('selectDestinoManual');
        select.innerHTML = `
            <option value="Conteos Diarios">📊 Conteos Diarios</option>
            <option value="Base de Datos">🗄️ Base de Datos</option>
            <option value="Auditorias de Inventario">📦 Auditorias de Inventario</option>`; 
    }

    async function confirmarSubidaFinal() {
        const nombre = document.getElementById('nombreArchivoNuevo').value || "SIN_NOMBRE";
        const cat = document.getElementById('selectDestinoManual').value;
        const indiceExistente = baseDeDatos.findIndex(r => r.nombre === nombre && r.categoria === cat);
        const nuevoRegistro = { id: (idEditando !== null) ? idEditando : (indiceExistente !== -1 ? baseDeDatos[indiceExistente].id : Date.now()), nombre: nombre, categoria: cat, fecha: new Date().toLocaleString(), datos: tempDatosGlobal };
        
        await cargarDeServidor();
        if (idEditando !== null) { 
            const indexReal = baseDeDatos.findIndex(r => r.id === idEditando);
            if(indexReal !== -1) baseDeDatos[indexReal] = nuevoRegistro;
            idEditando = null; 
        } else if (indiceExistente !== -1) { 
            baseDeDatos[indiceExistente] = nuevoRegistro; 
        } else { 
            baseDeDatos.push(nuevoRegistro); 
        }
        
        await guardarEnServidor(); 
        cerrarModalManual(); 
        actualizarTablaPrincipal();
    }

    async function abrirModalVistaPrevia(input) {
        if (!input.files[0]) return;
        const file = input.files[0]; 
        const data = await file.arrayBuffer(); 
        const workbook = XLSX.read(data);
        tempDatosGlobal = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1});
        document.getElementById('nombreArchivoNuevo').value = file.name.toUpperCase(); 
        llenarSelectorCategorias();
        
        const preview = document.getElementById('tablaPreviewManual'); 
        preview.innerHTML = "";
        tempDatosGlobal.slice(0, 5).forEach(fila => { 
            const tr = document.createElement('tr'); 
            fila.forEach(c => { const td = document.createElement('td'); td.innerText = c || ""; tr.appendChild(td); }); 
            preview.appendChild(tr); 
        });
        document.getElementById('modalSubidaManual').style.display = 'flex'; 
        input.value = "";
    }

    // --- CARGAS MASIVAS Y ESPECIALES ---
    async function procesarCiclicoGerencia(input) {
        if (!input.files[0]) return;
        const file = input.files[0]; 
        const data = await file.arrayBuffer(); 
        const workbook = XLSX.read(data);
        const matrizDatos = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1});
        
        const nombreArchivo = "CICLICO_" + file.name.toUpperCase().replace(".XLSX", "").replace(".XLS", "");
        await cargarDeServidor();
        
        const indiceExistente = baseDeDatos.findIndex(r => r.nombre === nombreArchivo && r.categoria === "Conteos Diarios");
        const nuevoRegistro = { 
            id: (indiceExistente !== -1) ? baseDeDatos[indiceExistente].id : Date.now(), 
            nombre: nombreArchivo, 
            categoria: "Conteos Diarios", 
            fecha: new Date().toLocaleString(), 
            datos: matrizDatos 
        };
        
        if (indiceExistente !== -1) { baseDeDatos[indiceExistente] = nuevoRegistro; } 
        else { baseDeDatos.push(nuevoRegistro); }
        
        await guardarEnServidor();
        input.value = ""; 
        alert("¡Conteo Cíclico cargado y sincronizado con éxito!");
        actualizarTablaPrincipal();
    }

    async function procesarCargaMasiva(input) {
        if (!input.files || input.files.length < 2) {
            alert("Selecciona ambos archivos (Inventario y Precios) usando Ctrl o Shift.");
            input.value = "";
            return;
        }

        await cargarDeServidor();
        let archivoInventario = null;
        let archivoPrecios = null;

        Array.from(input.files).forEach(file => {
            if (file.name.toUpperCase().includes("PRECIO")) { 
                archivoPrecios = file; 
            } else { 
                archivoInventario = file; 
            }
        });

        if (!archivoInventario || !archivoPrecios) {
            alert("Un archivo debe contener la palabra 'PRECIO' en su nombre para diferenciarlo.");
            input.value = "";
            return;
        }

        try {
            const dataInv = await archivoInventario.arrayBuffer();
            const wbInv = XLSX.read(dataInv);
            const matrizInv = XLSX.utils.sheet_to_json(wbInv.Sheets[wbInv.SheetNames[0]], {header: 1});
            
            const nombreBaseInv = "INVENTARIO_SISTEMA_CENTRAL";
            
            const idxInv = baseDeDatos.findIndex(r => r.nombre === nombreBaseInv);
            const regInv = { 
                id: (idxInv !== -1 ? baseDeDatos[idxInv].id : Date.now()), 
                nombre: nombreBaseInv, 
                categoria: "Base de Datos", 
                fecha: new Date().toLocaleString(), 
                datos: matrizInv 
            };
            
            if (idxInv !== -1) {
                baseDeDatos[idxInv] = regInv;
            } else {
                baseDeDatos.push(regInv);
            }

            const dataPre = await archivoPrecios.arrayBuffer();
            const wbPre = XLSX.read(dataPre);
            const matrizPre = XLSX.utils.sheet_to_json(wbPre.Sheets[wbPre.SheetNames[0]], {header: 1});
            
            const nombreBasePre = "PRECIOS_SISTEMA_CENTRAL";
            
            const idxPre = baseDeDatos.findIndex(r => r.nombre === nombreBasePre);
            const regPre = { 
                id: (idxPre !== -1 ? baseDeDatos[idxPre].id : Date.now() + 1), 
                nombre: nombreBasePre, 
                categoria: "Base de Datos", 
                fecha: new Date().toLocaleString(), 
                datos: matrizPre 
            };
            
            if (idxPre !== -1) {
                baseDeDatos[idxPre] = regPre;
            } else {
                baseDeDatos.push(regPre);
            }

            await guardarEnServidor();
            alert("Sincronización masiva completada: Inventario y Precios actualizados.");
            actualizarTablaPrincipal();
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al procesar los libros de Excel.");
        }
        input.value = "";
    }

    // --- VALIDADOR DE STOCK DINÁMICO ---
    function abrirValidador() {
        document.getElementById('vistaTabla').style.display = "none";
        document.getElementById('vistaReporte').style.display = "none";
        document.getElementById('seccionIA').style.display = "none";
        document.getElementById('controlesHeader').style.display = "none";
        
        document.getElementById('vistaValidadorInterno').style.display = "flex";
        document.getElementById('tituloVista').innerText = "📦 Validador de Stock Interno";
        if(window.innerWidth <= 768) toggleMenu();
    }

    function reconstruirSelectoresFiltros(dataCache) {
        const selectorAlmacen = document.getElementById('filtroValAlmacen');
        const selectorLinea = document.getElementById('filtroValLineaInterna');
        if(!selectorAlmacen || !selectorLinea || !dataCache || dataCache.length === 0) return;

        const prevAlmacen = selectorAlmacen.value;
        const prevLinea = selectorLinea.value;

        const almacenesUnicos = [...new Set(dataCache.map(f => f.almacen))].sort();
        selectorAlmacen.innerHTML = '<option value="">TODOS LOS ALMACENES</option>';
        almacenesUnicos.forEach(almacen => {
            if (almacen && almacen.trim() !== "") {
                const op = document.createElement('option'); op.value = almacen; op.innerText = almacen; selectorAlmacen.appendChild(op);
            }
        });
        selectorAlmacen.value = prevAlmacen;

        const lineasUnicas = [...new Set(dataCache.map(f => f.codAlm))].sort();
        selectorLinea.innerHTML = '<option value="">TODAS LAS LÍNEAS</option>';
        lineasUnicas.forEach(linea => {
            if (linea && linea.trim() !== "") {
                const op = document.createElement('option'); op.value = linea; op.innerText = linea.toUpperCase(); selectorLinea.appendChild(op);
            }
        });
        selectorLinea.value = prevLinea;
    }

    async function procesarExcelValidadorInterno(input) {
        if (!input.files[0]) return;
        const file = input.files[0];
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array", bookFiles: true, cellStyles: true, cellNF: true });
        
        const hojaOriginal = workbook.Sheets[workbook.SheetNames[0]];
        const matriz = XLSX.utils.sheet_to_json(hojaOriginal, {header: 1, raw: false, defval: ""});
        
        datosTablaValidadorCache = []; 
        conteoTemporalLista = {}; 
        actualizarBotonYContadorMasivo();
        
        const regexSKUUniversal = /^[A-Z]\d+/i;

        for (let i = 0; i < matriz.length; i++) {
            let fila = matriz[i];
            if (!fila || fila.length === 0) continue;
            let columnaSKUDetectada = -1;
            
            for (let j = 0; j < fila.length; j++) {
                let valorCelda = fila[j] !== undefined ? String(fila[j]).trim() : "";
                
                if (regexSKUUniversal.test(valorCelda) && valorCelda.length >= 4) {
                    columnaSKUDetectada = j;
                    break; 
                }
            }
            
            if (columnaSKUDetectada !== -1) {
                let idxBase = columnaSKUDetectada;
                let skuVal = String(fila[idxBase]).trim().toUpperCase();
                let articuloVal = fila[idxBase + 2] !== undefined ? String(fila[idxBase + 2]).trim() : "SIN DESCRIPCIÓN";
                let almacenVal = fila[idxBase + 3] !== undefined ? String(fila[idxBase + 3]).trim() : "GENERAL";
                let existenciaVal = fila[idxBase + 4] !== undefined ? String(fila[idxBase + 4]).trim() : "0";
                let precioVal = fila[idxBase + 5] !== undefined ? String(fila[idxBase + 5]).trim() : "0.00";
                let lineaCategoriaProducto = fila[19] !== undefined ? String(fila[19]).trim() : "SIN CLASIFICAR";
                
                datosTablaValidadorCache.push({
                    sku: skuVal, codAlm: lineaCategoriaProducto, articulo: articuloVal,
                    almacen: almacenVal, precio: precioVal, existencia: existenciaVal
                });
            }
        }
        
        if (datosTablaValidadorCache.length > 0) {
            datosTablaValidadorCache.sort((a, b) => String(a.articulo).localeCompare(String(b.articulo)));
            document.getElementById('contenedorTablaValidador').style.display = "block";
            document.getElementById('barraFiltrosValidadorContenedor').style.display = "grid"; 
            
            reconstruirSelectoresFiltros(datosTablaValidadorCache);
            renderizarFilasValidadorInterno(datosTablaValidadorCache);
            
            await cargarDeServidor();
            const idxC = baseDeDatos.findIndex(r => r.nombre === "VAL_CACHE_SISTEMA");
            const regC = { id: (idxC !== -1 ? baseDeDatos[idxC].id : Date.now()), nombre: "VAL_CACHE_SISTEMA", categoria: "Base de Datos", fecha: new Date().toLocaleString(), datos: datosTablaValidadorCache };
            if(idxC !== -1) baseDeDatos[idxC] = regC; else baseDeDatos.push(regC);
            await guardarEnServidor();
        } else {
            alert("No se detectó ninguna columna con SKUs formateados (Letra + Números).");
        }
        input.value = ""; 
    }

    function renderizarFilasValidadorInterno(listaFilas) {
        const tbody = document.querySelector('#tablaDinamicaValidadorInterno tbody');
        tbody.innerHTML = "";
        
        let listaOrdenada = [...listaFilas].sort((a, b) => {
            let claveA = (a.sku || "") + "_" + (a.almacen || "GENERAL");
            let claveB = (b.sku || "") + "_" + (b.almacen || "GENERAL");

            let yaContadoA = conteoTemporalLista[claveA];
            let yaContadoB = conteoTemporalLista[claveB];

            let totalFisicoA = yaContadoA ? yaContadoA.fisico : 0;
            let totalFisicoB = yaContadoB ? yaContadoB.fisico : 0;

            let difA = totalFisicoA - (parseInt(a.existencia) || 0);
            let difB = totalFisicoB - (parseInt(b.existencia) || 0);

            let esCuadradoA = (yaContadoA && difA === 0) ? 1 : 0;
            let esCuadradoB = (yaContadoB && difB === 0) ? 1 : 0;

            return esCuadradoA - esCuadradoB;
        });
        
        listaOrdenada.forEach(fila => {
            const tr = document.createElement('tr');
            
            const articuloTexto = String(fila.articulo || "SIN DESCRIPCIÓN");
            const modeloSeguro = articuloTexto.replace(/'/g, "").replace(/"/g, "");
            const skuSeguro = String(fila.sku || "");
            
            const claveUnica = skuSeguro + "_" + (fila.almacen || "GENERAL");
            const yaContado = conteoTemporalLista[claveUnica];
            
            if (yaContado) { tr.style.backgroundColor = "#e8f8f5"; }

            let existenciaPlana = parseInt(fila.existencia) || 0;
            let totalFisico = yaContado ? yaContado.fisico : 0;
            let difCalculada = totalFisico - existenciaPlana;

            let textoDiferencia = "";
            let estiloDiferencia = "";

            if (difCalculada < 0) {
                textoDiferencia = "Falta: -" + Math.abs(difCalculada);
                estiloDiferencia = "color: #922b21; background-color: #fadbd8; padding: 4px 8px; border-radius: 4px; font-weight: bold;";
            } else if (difCalculada > 0) {
                textoDiferencia = "Sobra: +" + difCalculada;
                estiloDiferencia = "color: #1e8449; background-color: #d4efdf; padding: 4px 8px; border-radius: 4px; font-weight: bold;";
            } else {
                textoDiferencia = "✔ Cuadrado";
                estiloDiferencia = "color: #1e8449; background-color: #e8f8f5; padding: 4px 8px; border-radius: 4px; font-weight: bold;";
            }

            let precioFormateado = isNaN(parseFloat(fila.precio)) ? (fila.precio || "$0.00") : "$" + parseFloat(fila.precio).toFixed(2);

            tr.style.cursor = "pointer";
            tr.onclick = (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                registrarZonaUnica(skuSeguro, modeloSeguro, fila.existencia, fila.almacen, 'PDV');
            };

            tr.innerHTML = `
                <td><strong>${skuSeguro}</strong><br><small style="color:#7f8c8d;">📍 ${fila.almacen || 'GENERAL'}</small></td>
                <td>
                    ${articuloTexto} 
                    ${yaContado ? '<br><small style="color:#27ae60;"><b>Acumulado:</b> PDVTA: '+yaContado.pdv+' | ALM: '+yaContado.alm+' | TRAS: '+yaContado.tras+' (Total: '+yaContado.fisico+' Unds)</small>' : ''}
                </td>
                <td><strong style="color: var(--primary);">${existenciaPlana}</strong></td>
                <td><strong style="color: #2c3e50;">${precioFormateado}</strong></td>
                <td><span style="${estiloDiferencia}">${textoDiferencia}</span></td> 
                <td>
                    <div class="contenedor-botones-zonas">
                        <button class="btn-zona-conteo btn-z-prc" onclick="event.stopPropagation(); validarPrecioHabladorPiso('${skuSeguro}', '${modeloSeguro}', '${fila.precio}')">$ PRECIO</button> 
                        <button class="btn-zona-conteo btn-z-pdv" onclick="event.stopPropagation(); registrarZonaUnica('${skuSeguro}', '${modeloSeguro}', '${fila.existencia}', '${fila.almacen}', 'PDV')">PDVTA</button>
                        <button class="btn-zona-conteo btn-z-alm" onclick="event.stopPropagation(); registrarZonaUnica('${skuSeguro}', '${modeloSeguro}', '${fila.existencia}', '${fila.almacen}', 'ALM')">Almacén</button>
                        <button class="btn-zona-conteo btn-z-tras" onclick="event.stopPropagation(); registrarZonaUnica('${skuSeguro}', '${modeloSeguro}', '${fila.existencia}', '${fila.almacen}', 'TRAS')">Traslado</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function validarPrecioHabladorPiso(sku, modelo, precioExcel) {
        const pRef = parseFloat(precioExcel) || 0;
        const inputPrecio = prompt(`[AUDITORÍA DE PRECIOS - HABLADOR]\nSKU: ${sku}\n${modelo}\n\nPrecio sistema: $${pRef.toFixed(2)}\n\nIngrese precio publicado en el hablador:`);
        
        if (inputPrecio === null || inputPrecio.trim() === "") return;
        const pTienda = parseFloat(inputPrecio.replace(',', '.'));
        
        if (isNaN(pTienda)) { alert("Ingrese un monto numérico válido."); return; }

        if (pTienda === pRef) {
            alert(`✅ ¡Precio correcto! El hablador coincide ($${pTienda.toFixed(2)}).`);
        } else {
            const diferenciaPrecios = pTienda - pRef;
            const msgAlerta = diferenciaPrecios > 0 ? `Sobra: +$${diferenciaPrecios.toFixed(2)} (Hablador más caro)` : `Falta: -$${Math.abs(diferenciaPrecios).toFixed(2)} (Hablador más barato)`;
            
            alert(`🚨 DESCUADRE DE PRECIO DETECTADO\n\n${msgAlerta}\n\nSe enviará reporte a "Incidencias".`);

            const nuevaIncidenciaPrecio = {
                id: Date.now(),
                nombre: "PRC_" + sku + "_" + Date.now().toString().slice(-4),
                categoria: "Auditorias de Inventario",
                fecha: new Date().toLocaleString(),
                datos: [
                    ["SKU", "ARTÍCULO / MODELO", "PRECIO EXCEL", "PRECIO HABLADOR", "DESCUADRE NETO"],
                    [sku, modelo, "$" + pRef.toFixed(2), "$" + pTienda.toFixed(2), (diferenciaPrecios > 0 ? "+$" : "-$") + Math.abs(diferenciaPrecios).toFixed(2)]
                ]
            };

            await cargarDeServidor();
            baseDeDatos.push(nuevaIncidenciaPrecio);
            await guardarEnServidor();
        }
    }

    function registrarZonaUnica(sku, modelo, existenciaExcel, almacen, zonaInicial) {
        const almacenVal = almacen || "GENERAL";
        const claveUnica = sku + "_" + almacenVal;

        if (!conteoTemporalLista[claveUnica]) {
            conteoTemporalLista[claveUnica] = {
                claveUnica: claveUnica,
                sku: sku, 
                modelo: modelo, 
                almacenOriginal: almacenVal,
                pdv: 0, 
                alm: 0, 
                tras: 0, 
                sistema: parseInt(existenciaExcel) || 0, 
                fisico: 0, 
                dif: 0
            };
        }

        document.getElementById('modalCantSKU').value = claveUnica;
        document.getElementById('modalCantModelo').value = modelo;
        document.getElementById('modalCantExistencia').value = existenciaExcel;
        document.getElementById('modalCantAlmacen').value = almacenVal;

        document.getElementById('modalCantSKU_Txt').innerText = sku + " (" + almacenVal + ")";
        document.getElementById('modalCantDetalleProducto').innerText = modelo;

        document.getElementById('modalIngresoCantidad').style.display = 'flex';
        actualizarCantidadSegunZonaSeleccionada(zonaInicial || 'PDV');
    }

    function actualizarCantidadSegunZonaSeleccionada(zona) {
        const claveUnica = document.getElementById('modalCantSKU').value;
        let item = conteoTemporalLista[claveUnica];
        let valorPrevio = 0;
        let nombreZona = "";

        document.getElementById('btnZonaPDV').classList.remove('activa');
        document.getElementById('btnZonaALM').classList.remove('activa');
        document.getElementById('btnZonaTRAS').classList.remove('activa');

        if (zona === 'PDV') { 
            nombreZona = "PDVTA"; 
            valorPrevio = item ? item.pdv : 0; 
            document.getElementById('btnZonaPDV').classList.add('activa');
        } else if (zona === 'ALM') { 
            nombreZona = "ALMACÉN"; 
            valorPrevio = item ? item.alm : 0; 
            document.getElementById('btnZonaALM').classList.add('activa');
        } else if (zona === 'TRAS') { 
            nombreZona = "TRASLADO"; 
            valorPrevio = item ? item.tras : 0; 
            document.getElementById('btnZonaTRAS').classList.add('activa');
        }
        document.getElementById('modalCantZona').value = zona;
        document.getElementById('modalCantZonaEtiqueta').innerText = nombreZona;

        const inputCant = document.getElementById('inputCantidadValidador');
        inputCant.value = valorPrevio;

        setTimeout(() => {
            inputCant.focus();
            inputCant.select();
        }, 50);
    }

    function cerrarModalCantidadValidador() {
        document.getElementById('modalIngresoCantidad').style.display = 'none';
    }

    async function confirmarCantidadModalValidador(e) {
        e.preventDefault();

        const claveUnica = document.getElementById('modalCantSKU').value;
        const zona = document.getElementById('modalCantZona').value; 
        const cantidad = parseInt(document.getElementById('inputCantidadValidador').value);

        if (isNaN(cantidad) || cantidad < 0) {
            alert("Ingrese un número entero válido mayor o igual a 0.");
            return;
        }

        let item = conteoTemporalLista[claveUnica];
        if (item) {
            if (zona === 'PDV') item.pdv = cantidad;
            if (zona === 'ALM') item.alm = cantidad;
            if (zona === 'TRAS') item.tras = cantidad;
            item.fisico = item.pdv + item.alm + item.tras;
            item.dif = item.fisico - item.sistema;
        }

        actualizarBotonYContadorMasivo();
        filtrarTablaValidadorInterno();
        cerrarModalCantidadValidador();

        try {
            const resp = await fetch('api.php');
            let baseActual = await resp.json();
            const idxS = baseActual.findIndex(r => r.nombre === "VAL_CONTEO_SISTEMA");
            const regS = { 
                id: (idxS !== -1 ? baseActual[idxS].id : Date.now() + 5), 
                nombre: "VAL_CONTEO_SISTEMA", 
                categoria: "Base de Datos", 
                fecha: new Date().toLocaleString(), 
                datos: conteoTemporalLista 
            };
            if(idxS !== -1) baseActual[idxS] = regS; else baseActual.push(regS);
            await fetch('api.php', { method: 'POST', body: JSON.stringify(baseActual) });
            baseDeDatos = baseActual;
        } catch(err) {
            console.log("Error al sincronizar el conteo individual.");
        }
    }

    function actualizarBotonYContadorMasivo() {
        const totalContados = Object.keys(conteoTemporalLista).length;
        const btnFinalizar = document.getElementById('btnFinalizarConteoMasivo');
        const btnParcial = document.getElementById('btnCierreParcial');
        const contadorTexto = document.getElementById('contadorItemsConteo');
        const contadorTextoParcial = document.getElementById('contadorItemsParcial');
        
        if (totalContados > 0) {
            if (btnFinalizar) btnFinalizar.style.display = "inline-block";
            if (btnParcial) btnParcial.style.display = "inline-block";
            if (contadorTexto) contadorTexto.innerText = totalContados;
            if (contadorTextoParcial) contadorTextoParcial.innerText = totalContados;
        } else {
            if (btnFinalizar) btnFinalizar.style.display = "none";
            if (btnParcial) btnParcial.style.display = "none";
            if (contadorTexto) contadorTexto.innerText = "0";
            if (contadorTextoParcial) contadorTextoParcial.innerText = "0";
        }
    }

    async function guardarCierreParcialValidador() {
        try {
            const listaItems = Object.values(conteoTemporalLista);
            if (listaItems.length === 0) return;

            if (!confirm(`¿Desea actualizar el respaldo parcial con los (${listaItems.length}) productos auditados hasta el momento?`)) return;

            let matrizReporte = [["SKU", "DESCRIPCIÓN / MODELO", "ALMACÉN", "CANT. PDVTA", "CANT. ALMACÉN", "POR TRASLADAR", "SISTEMA", "TOTAL FÍSICO", "DIFERENCIA", "ESTADO"]];

            listaItems.forEach(item => {
                matrizReporte.push([
                    item.sku, 
                    item.modelo, 
                    item.almacenOriginal, 
                    item.pdv, 
                    item.alm, 
                    item.tras, 
                    item.sistema, 
                    item.fisico, 
                    item.dif,
                    "PARCIAL"
                ]);
            });

            await cargarDeServidor();

            const NOMBRE_RESPALDO_UNICO = "RESPALDO_PARCIAL_ACTIVO";
            const indiceExistente = baseDeDatos.findIndex(reg => reg.nombre === NOMBRE_RESPALDO_UNICO);

            const documentoParcial = {
                id: (indiceExistente !== -1) ? baseDeDatos[indiceExistente].id : Date.now(),
                nombre: NOMBRE_RESPALDO_UNICO,
                categoria: "Conteos Diarios",
                fecha: new Date().toLocaleString(),
                datos: matrizReporte
            };

            if (indiceExistente !== -1) {
                baseDeDatos[indiceExistente] = documentoParcial;
            } else {
                baseDeDatos.push(documentoParcial);
            }

            await guardarEnServidor();

            alert("🔄 ¡Respaldo parcial sobrescrito exitosamente en el archivo único!");
            actualizarTablaPrincipal();

        } catch (error) {
            console.error("Error al guardar el cierre parcial:", error);
            alert("Ocurrió un error al intentar guardar el cierre parcial.");
        }
    }

    async function finalizarConteoMasivoValidador() {
        const listaItems = Object.values(conteoTemporalLista);
        if (listaItems.length === 0) return;

        if (!confirm(`¿Desea consolidar el reporte masivo de (${listaItems.length}) productos en "Auditorias de Inventario"?`)) return;

        let matrizReporte = [["SKU", "DESCRIPCIÓN / MODELO", "ALMACÉN", "CANT. PDVTA", "CANT. ALMACÉN", "POR TRASLADAR", "SISTEMA", "TOTAL FÍSICO", "DIFERENCIA"]];

        listaItems.forEach(item => {
            matrizReporte.push([item.sku, item.modelo, item.almacenOriginal, item.pdv, item.alm, item.tras, item.sistema, item.fisico, item.dif]);
        });

        const idUnico = Date.now();
        const nuevoDocumentoMasivo = {
            id: idUnico,
            nombre: "AUDIT_INV_" + idUnico.toString().slice(-5),
            categoria: "Auditorias de Inventario", 
            fecha: new Date().toLocaleString(),
            datos: matrizReporte
        };

        await cargarDeServidor();
        baseDeDatos.push(nuevoDocumentoMasivo);
        baseDeDatos = baseDeDatos.filter(r => r.nombre !== "VAL_CACHE_SISTEMA" && r.nombre !== "VAL_CONTEO_SISTEMA");
        await guardarEnServidor();

        conteoTemporalLista = {};
        datosTablaValidadorCache = [];
        actualizarBotonYContadorMasivo();
        
        document.getElementById('contenedorTablaValidador').style.display = "none";
        document.getElementById('barraFiltrosValidadorContenedor').style.display = "none";

        alert("📦 ¡Reporte consolidado y sincronizado!");
        cambiarTab('Auditorias de Inventario');
    }

    function filtrarTablaValidadorInterno() {
        const fSKU = document.getElementById('filtroValSKU').value.trim().toUpperCase();
        const fArt = document.getElementById('filtroValArticulo').value.trim().toUpperCase();
        const fAlm = document.getElementById('filtroValAlmacen').value; 
        const fLin = document.getElementById('filtroValLineaInterna').value; 
        
        const filtrados = datosTablaValidadorCache.filter(fila => {
            const skuTexto = String(fila.sku || "").toUpperCase();
            const artTexto = String(fila.articulo || "").toUpperCase();

            const cumpleSKU = skuTexto.includes(fSKU);
            const cumpleArt = artTexto.includes(fArt);
            const cumpleAlm = (fAlm === "") ? true : fila.almacen === fAlm;
            const cumpleLinea = (fLin === "") ? true : fila.codAlm === fLin;
            
            return cumpleSKU && cumpleArt && cumpleAlm && cumpleLinea;
        });
        
        renderizarFilasValidadorInterno(filtrados);
    }

    async function reiniciarValidadorCompleto() {
        if (!confirm("¿Deseas reiniciar todos los filtros y datos cargados?")) return;

        datosTablaValidadorCache = [];
        conteoTemporalLista = {};

        const tbody = document.querySelector('#tablaDinamicaValidadorInterno tbody');
        if (tbody) tbody.innerHTML = '';
        
        document.getElementById('contenedorTablaValidador').style.display = "none";
        document.getElementById('btnFinalizarConteoMasivo').style.display = "none";
        document.getElementById('contadorItemsConteo').innerText = "0";

        limpiarFiltrosBusquedaValidador();

        baseDeDatos = baseDeDatos.filter(r => r.nombre !== "VAL_CACHE_SISTEMA" && r.nombre !== "VAL_CONTEO_SISTEMA");
        await guardarEnServidor();

        alert("Validador reiniciado correctamente.");
    }

    // --- MANEJO Y LIMPIEZA DE FILTROS ---
    function limpiarCampoFiltro(idInput) {
        const input = document.getElementById(idInput);
        if (!input) return;

        input.value = "";
        input.focus();
        filtrarTablaValidadorInterno();
    }

    function limpiarFiltrosBusquedaValidador() {
        const inputSKU = document.getElementById('filtroValSKU');
        const inputArt = document.getElementById('filtroValArticulo');
        const selectAlm = document.getElementById('filtroValAlmacen');
        const selectLin = document.getElementById('filtroValLineaInterna');
        const btnToggleFiltros = document.getElementById('btnToggleFiltrosVal');

        if (inputSKU) inputSKU.value = '';
        if (inputArt) inputArt.value = '';
        if (selectAlm) selectAlm.value = '';
        if (selectLin) selectLin.value = '';
        if (btnToggleFiltros) btnToggleFiltros.innerText = "🔍 BUSCAR / FILTRAR DATA ▼";

        renderizarFilasValidadorInterno(datosTablaValidadorCache);
        if (inputSKU) inputSKU.focus();
    }

    // --- ESCÁNER DE CÓDIGOS INTERNO ---
    async function abrirModalEscanerValidador() {
        const modal = document.getElementById('modalEscanerValidador');
        modal.style.display = 'flex';

        try {
            if (!html5QrCodeModal) { html5QrCodeModal = new Html5Qrcode("readerModalValidador"); }
            const config = { fps: 15, qrbox: { width: 250, height: 160 } };
            await html5QrCodeModal.start({ facingMode: "environment" }, config, (decodedText) => {
                aplicarCodigoModalValidador(decodedText);
            });
        } catch (err) { console.log("Camara no disponible"); }
    }

    async function cerrarModalEscanerValidador() {
        const modal = document.getElementById('modalEscanerValidador');
        if (html5QrCodeModal) {
            try {
                await html5QrCodeModal.stop();
                html5QrCodeModal.clear();
            } catch (e) {}
        }
        modal.style.display = 'none';
    }

    function aplicarCodigoModalValidador(codigo) {
        document.getElementById('filtroValSKU').value = codigo.trim().toUpperCase();
        filtrarTablaValidadorInterno();
        cerrarModalEscanerValidador();
    }

    function procesarFotoModalValidador(input) {
        if (!input.files || input.files.length === 0) return;
        const scannerAux = new Html5Qrcode("readerModalValidador");
        scannerAux.scanFile(input.files[0], true).then(decodedText => {
            aplicarCodigoModalValidador(decodedText);
            input.value = "";
        }).catch(err => {
            alert("No se detectó un código legible en la imagen.");
            input.value = "";
        });
    }

    // --- ASISTENTE IA & ESCÁNER LECTOR ---
    function activarSeccionIA() { 
        document.getElementById('vistaTabla').style.display = "none"; 
        document.getElementById('vistaReporte').style.display = "none"; 
        document.getElementById('vistaValidadorInterno').style.display = "none"; 
        document.getElementById('seccionIA').style.display = "flex"; 
        document.getElementById('controlesHeader').style.display = "none"; 
        document.getElementById('tituloVista').innerText = "Asistente de Precios"; 
        document.getElementById('cajaMensajes').innerHTML = `<div class="msj msj-ia">Hola, ingresa SKU o Modelo para verificar precios en red central.</div>`;
        if(window.innerWidth <= 768) toggleMenu(); 
    }

    function alternarEscaner() {
        const reader = document.getElementById('reader');
        if (reader.style.display === 'block') { if(html5QrCode) { html5QrCode.stop().then(() => { reader.style.display = 'none'; html5QrCode.clear(); }); } return; }
        reader.style.display = 'block';
        if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 20, qrbox: { width: 280, height: 180 }, aspectRatio: 1.0 };
        html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
            document.getElementById('inputIA').value = decodedText; procesarConsultaIA();
            html5QrCode.stop().then(() => { reader.style.display = 'none'; });
        }).catch(err => { alert("Error de cámara"); reader.style.display = 'none'; });
    }

    function procesarConsultaIA() {
        const input = document.getElementById('inputIA');
        const caja = document.getElementById('cajaMensajes');
        const consulta = input.value.trim().toUpperCase();
        if (!consulta) return;
        
        logConsultasIA.push([new Date().toLocaleString(), consulta]);
        const docPrecios = baseDeDatos.find(doc => doc.nombre.toUpperCase().includes("PRECIO"));
        const docInventario = baseDeDatos.find(doc => doc.nombre.toUpperCase().includes("INVENTARIO"));
        let resultados = [];
        
        if (docPrecios) {
            docPrecios.datos.forEach(fila => {
                if (!fila[0] || !fila[2]) return;
                let sku = String(fila[0]).toUpperCase().trim(); 
                let mod = String(fila[2]).toUpperCase().trim();
                
                if (sku === consulta || mod.includes(consulta)) {
                    let precio = null; 
                    fila.forEach(c => { let n = parseFloat(String(c).replace(',','.')); if(!isNaN(n) && n > 0.5) precio = n.toFixed(2); });
                    
                    let stockTotal = 0;
                    let desgloseAlmacenesHTML = "";
                    
                    if (docInventario) {
                        docInventario.datos.forEach(filaInv => {
                            if (!filaInv[0]) return;
                            let skuInv = String(filaInv[0]).toUpperCase().trim();
                            
                            if (skuInv === sku) {
                                let nombreAlmacen = filaInv[3] ? String(filaInv[3]).trim() : "Almacén No Definido";
                                let cantidadVal = filaInv[4] ? parseInt(String(filaInv[4]).replace(/\./g, '').replace(',', '.')) : 0;
                                
                                if (!isNaN(cantidadVal) && cantidadVal > 0) {
                                    stockTotal += cantidadVal;
                                    desgloseAlmacenesHTML += `<div style="display:flex; justify-content:space-between; font-size:11px; color:#555; border-bottom:1px dashed #eee; padding:4px 0;">
                                        <span>📍 ${nombreAlmacen}:</span>
                                        <strong style="color:#2c3e50;">${cantidadVal} Unds</strong>
                                    </div>`;
                                }
                            }
                        });
                    }
                    if(precio && !resultados.some(r => r.sku === sku)) {
                        resultados.push({sku, mod, precio, stock: stockTotal, desgloseHTML: desgloseAlmacenesHTML});
                    }
                }
            });
        }
        
        caja.innerHTML += `<div class="msj msj-user">${consulta}</div>`;
        
        if (resultados.length === 0) { 
            caja.innerHTML += `<div class="msj msj-ia">❌ No encontrado.</div>`; 
        } else {
            resultados.forEach(r => {
                const modSeguro = r.mod.replace(/'/g, "").replace(/"/g, "");
                const tieneStock = r.stock > 0;
                const iconoStatus = tieneStock ? '✅ ' : '❌ ';
                const textoStatus = tieneStock ? 'DISPONIBLE' : 'SIN STOCK';
                const colorStatus = tieneStock ? '#27ae60' : '#e74c3c';
                const detalleAlmacenes = r.desgloseHTML || `<div style="font-size:11px; color:#7f8c8d; font-style:italic;">Sin existencias en almacenes.</div>`;

                caja.innerHTML += `
                    <div class="msj msj-ia">
                        <small>SKU: ${r.sku}</small><br><strong>${r.mod}</strong><br>
                        <div style="background:#f8f9fa; padding:10px; border-radius:5px; text-align:center; margin-top:5px; border: 1px solid #ddd;">
                            <span style="color:#2c3e50; font-size:18px; font-weight:bold;">$${r.precio}</span><br>
                            <div style="margin-top:5px; font-weight:bold; color:${colorStatus}; font-size:12px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 5px;">
                                ${iconoStatus} ${textoStatus}: ${r.stock} Unds Total
                            </div>
                            <div style="text-align:left; max-height:130px; overflow-y:auto; padding-right:2px;">${detalleAlmacenes}</div>
                        </div>
                        
                        <button onclick="generarIncidenciaDesdeIA('${r.sku}', '${modSeguro}', '${r.precio}')" 
                                style="width:100%; margin-top:5px; padding:10px; font-size:10px; background:var(--danger); color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
                            🚨 REPORTAR DIFERENCIA GLOBAL
                        </button>
                    </div>`;
            });
        }
        input.value = ""; 
        caja.scrollTop = caja.scrollHeight;
    }

    async function generarIncidenciaDesdeIA(sku, modelo, precioRef) {
        const precioReal = prompt("Precio visto en tienda para " + modelo + ":");
        if (precioReal) {
            const pReal = parseFloat(precioReal.replace(',', '.'));
            const pRef = parseFloat(precioRef);
            const dif = (pReal - pRef).toFixed(2);
            const nuevaIncidencia = { id: Date.now(), nombre: "AUDIT_" + sku + "_" + Date.now().toString().slice(-4), categoria: "Auditorias de Inventario", fecha: new Date().toLocaleString(), datos: [["SKU", "MODELO", "PRECIO EXCEL", "PRECIO TIENDA", "DIFERENCIA"], [sku, modelo, "$" + precioRef, "$" + pReal.toFixed(2), "$" + dif]] };
            await cargarDeServidor(); 
            baseDeDatos.push(nuevaIncidencia); 
            await guardarEnServidor();
            alert("Incidencia sincronizada.");
            if(tabActual === "Auditorias de Inventario" || tabActual === "TODOS") actualizarTablaPrincipal();
        }
    }

    // --- REPORTES GENERALES DE AUDITORÍA ---
    function activarSeccionReporte() {
        document.getElementById('vistaTabla').style.display = "none";
        document.getElementById('seccionIA').style.display = "none";
        document.getElementById('vistaValidadorInterno').style.display = "none";
        document.getElementById('vistaReporte').style.display = "block";
        document.getElementById('controlesHeader').style.display = "none";
        document.getElementById('tituloVista').innerText = "📊 Reporte de Gestión";
        generarEstadisticas();
        renderizarGrafico();
        if(window.innerWidth <= 768) toggleMenu();
    }

    function renderizarGrafico() {
        const ctx = document.getElementById('graficoOperativo').getContext('2d');
        const detalle = obtenerDetalleProfundo();
        const etiquetas = Object.keys(detalle).filter(cat => cat !== "Base de Datos" && cat !== "VAL_CACHE_INTERNAL");
        const valores = etiquetas.map(cat => detalle[cat].archivos);

        if (miGrafico) { miGrafico.destroy(); }

        miGrafico = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: etiquetas,
                datasets: [{
                    label: 'Cantidad de Documentos',
                    data: valores,
                    backgroundColor: ['#3498db', '#27ae60', '#f1c40f', '#e74c3c', '#9b59b6', '#2c3e50'],
                    borderWidth: 0, borderRadius: 8
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
            }
        });
    }

    function obtenerDetalleProfundo() {
        let resumen = {};
        LISTA_CATEGORIAS.forEach(cat => {
            let totalArchivos = 0; let totalProductos = 0; let ultimaCarga = "---";
            const archivos = baseDeDatos.filter(r => r.categoria === cat && r.nombre !== "VAL_CACHE_SISTEMA" && r.nombre !== "VAL_CONTEO_SISTEMA");
            totalArchivos = archivos.length;
            archivos.forEach(doc => {
                ultimaCarga = doc.fecha;
                if (doc.datos && doc.datos.length > 1) {
                    for (let i = 1; i < doc.datos.length; i++) {
                        const fila = doc.datos[i];
                        if (fila) {
                            fila.forEach(celda => {
                                const valor = parseInt(celda);
                                if (!isNaN(valor) && valor > 0 && valor < 1000000) { totalProductos += valor; }
                            });
                        }
                    }
                }
            });
            resumen[cat] = { archivos: totalArchivos, productos: totalProductos, fecha: ultimaCarga };
        });
        return resumen;
    }

    function generarEstadisticas() {
        const statsCont = document.getElementById('statsReporte');
        const tablaRepo = document.querySelector('#tablaReporteDetalle tbody');
        if(tablaRepo) {
            statsCont.innerHTML = ""; tablaRepo.innerHTML = "";
            const detalle = obtenerDetalleProfundo();
            const archivosFiltradosValidos = baseDeDatos.filter(r => r.nombre !== "VAL_CACHE_SISTEMA" && r.nombre !== "VAL_CONTEO_SISTEMA").length;
            statsCont.innerHTML += `<div class="stat-card" style="border-top-color: var(--primary)"><span class="stat-val">${archivosFiltradosValidos}</span><span class="stat-label">Archivos Totales</span></div>`;
            for (const cat in detalle) {
                if (detalle[cat].archivos > 0) {
                    statsCont.innerHTML += `<div class="stat-card" style="border-top-color: var(--success)"><span class="stat-val">${detalle[cat].archivos}</span><span class="stat-label">${cat}</span></div>`;
                }
                tablaRepo.innerHTML += `<tr><td><strong>${cat}</strong></td><td><div style="display:flex; flex-direction:column"><span>${detalle[cat].archivos} Archivos</span><small style="color:var(--accent)">Total: ${detalle[cat].productos} unds detectadas</small></div></td><td>${detalle[cat].fecha}</td></tr>`;
            }
        }
    }

    function generarPDFResumenMensual() {
        const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'pt');
        const fechaActual = new Date(); const mesAnio = fechaActual.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
        const detalle = obtenerDetalleProfundo();
        doc.setFontSize(18); doc.setTextColor(44, 62, 80); doc.text("CORPORACIÓN DA+CO - INFORME DETALLADO", 40, 50);
        doc.setFontSize(11); doc.setTextColor(100); doc.text(`AUDITOR: LUIS GARCÍA (ACARIGUA)`, 40, 75); doc.text(`PERÍODO: ${mesAnio}`, 40, 90);
        const filasResumenMapeo = Object.keys(detalle).map(cat => { const info = detalle[cat]; return [cat, info.archivos.toString(), info.productos.toString(), info.archivos > 0 ? "OPERATIVO" : "SIN REGISTROS"]; });
        doc.autoTable({ startY: 130, head: [['CATEGORÍA', 'ARCHIVOS', 'UNIDADES', 'ESTADO']], body: filasResumenMapeo, theme: 'grid', headStyles: { fillColor: [44, 62, 80] } });
        const finalY = doc.lastAutoTable.finalY + 70; doc.line(40, finalY, 200, finalY); doc.line(350, finalY, 510, finalY); doc.text("Firma del Auditor", 75, finalY + 15); doc.text("Sello de Gerencia", 390, finalY + 15);
        doc.save(`Reporte_Auditoria_${mesAnio.replace(" ","_")}.pdf`);
    }

    // --- SESIÓN Y PERMISOS ---
    function verificarClave(tipo) { const pass = prompt("Clave:"); if (pass === claves[tipo]) accederModo(tipo); else alert("Clave Incorrecta"); }
    
    function desaparecerMenuGestionSiAplica() {
        const contDropdown = document.getElementById('contendorDropdownGestion');
        const btnCiclicoDirecto = document.getElementById('btnCargarCiclicoDirecto');
        
        if (rolUsuarioActual === 'GERENCIA') {
            contDropdown.style.display = "inline-block"; btnCiclicoDirecto.style.display = "inline-block";
            document.getElementById('opcionCrearManual').style.display = "none";
            document.getElementById('opcionSubirManual').style.display = "none";
            document.getElementById('opcionCargaMasiva').style.display = "flex";

        } else {
            contDropdown.style.display = "inline-block"; btnCiclicoDirecto.style.display = "none";
            document.getElementById('opcionCrearManual').style.display = "flex";
            document.getElementById('opcionSubirManual').style.display = "flex";
            document.getElementById('opcionCargaMasiva').style.display = "flex";
        }
    }

    function accederModo(modo) {
        rolUsuarioActual = modo; 
        document.getElementById('pantallaInicio').style.display = 'none'; 
        document.getElementById('contenedorPrincipal').style.display = 'flex';
        const menu = document.getElementById('menuLateral'); 
        menu.innerHTML = ""; 
        
        desaparecerMenuGestionSiAplica();

        if (modo === 'SOLO_IA') { 
            document.getElementById('sidebar').style.display = 'none'; 
            activarSeccionIA(); 

        } else if (modo === 'GERENCIA') { 
            document.getElementById('sidebar').style.display = 'flex'; 
            document.getElementById('nombreUsuarioSidebar').innerText = "💼 Gerencia Tienda"; 
            menu.innerHTML = `
                <div class="tab" onclick="cambiarTab('Base de Datos')">🗄️ Base de Datos</div>
                <div class="tab" onclick="cambiarTab('Conteos Diarios')">📊 Conteos Diarios</div>
                <div class="tab" onclick="activarSeccionIA()" style="color:var(--warning);">🤖 ASISTENTE IA</div>`; 
            cambiarTab('Conteos Diarios');
        } else {
            document.getElementById('sidebar').style.display = 'flex'; 
            document.getElementById('nombreUsuarioSidebar').innerText = "🏠 Luis García"; 
            menu.innerHTML = `
                <div class="tab" onclick="activarSeccionReporte()" style="color:var(--accent);">📊 REPORTE DE GESTIÓN</div>
                <div class="tab" onclick="abrirPuenteEtiquetas()" style="color:#9b59b6; border-bottom: 1px solid #34495e;">🏷️ IMPRIMIR ETIQUETA</div>
                <div class="tab" onclick="abrirPuenteResguardo()" style="color:#9b59b6; border-bottom: 1px solid #34495e;">🏷️ RESGUARDOS</div>
                <div class="tab" onclick="abrirValidador()" style="color:#27ae60;">📦 VALIDADOR DE STOCK</div>
                <div class="tab" onclick="cambiarTab('TODOS')">📁 TODOS</div>
                <div class="tab" onclick="cambiarTab('Base de Datos')">🗄️ Base de Datos</div>
                <div class="tab" onclick="cambiarTab('Conteos Diarios')">📊 Conteos Diarios</div>
                <div class="tab" onclick="cambiarTab('Auditorias de Inventario')">📦 Auditorias Inv.</div>
                <div class="tab" onclick="activarSeccionIA()" style="color:var(--warning);">🤖 ASISTENTE IA</div>`;
            cambiarTab('TODOS');
        }
    }

    function cerrarSesion() { location.reload(); }

    function mostrarProgresoAuditoria() {
        if (!datosTablaValidadorCache || datosTablaValidadorCache.length === 0) {
            alert("⚠️ Primero debes cargar un archivo Excel en el validador.");
            return;
        }

        const totalSKU = datosTablaValidadorCache.length;
        let totalPiezasSistema = 0;

        datosTablaValidadorCache.forEach(item => {
            const cantSistema = parseInt(item.existencia || item.stock || item.sistema || item.cantidad || item.CANTIDAD || 0);
            totalPiezasSistema += cantSistema;
        });

        const clavesContadas = Object.keys(conteoTemporalLista);
        const skusContados = clavesContadas.length;

        let totalPiezasContadas = 0;
        let skusCuadrados = 0;
        let skusFaltantes = 0;
        let skusSobrantes = 0;

        clavesContadas.forEach(clave => {
            const item = conteoTemporalLista[clave];
            const fisico = parseInt(item.fisico) || 0;
            const sistema = parseInt(item.existencia || item.stock || item.sistema || item.cantidad || item.CANTIDAD || 0);

            totalPiezasContadas += fisico;

            if (fisico === sistema) {
                skusCuadrados++;
            } else if (fisico < sistema) {
                skusFaltantes++;
            } else if (fisico > sistema) {
                skusSobrantes++;
            }
        });

        const skusPendientes = totalSKU - skusContados;

        const porcentajeSKU = totalSKU > 0 ? ((skusContados / totalSKU) * 100).toFixed(1) : 0;
        const porcentajePiezas = totalPiezasSistema > 0 ? ((totalPiezasContadas / totalPiezasSistema) * 100).toFixed(1) : 0;

        const pctCuadrados = skusContados > 0 ? ((skusCuadrados / skusContados) * 100).toFixed(0) : 0;
        const pctFaltantes = skusContados > 0 ? ((skusFaltantes / skusContados) * 100).toFixed(0) : 0;
        const pctSobrantes = skusContados > 0 ? ((skusSobrantes / skusContados) * 100).toFixed(0) : 0;

        document.getElementById('progresoSKUTexto').innerText = `${skusContados} de ${totalSKU}`;
        document.getElementById('progresoSKUPorcentaje').innerText = `${porcentajeSKU}% avance`;

        document.getElementById('progresoCantTexto').innerText = `${totalPiezasContadas} de ${totalPiezasSistema}`;
        document.getElementById('progresoCantPorcentaje').innerText = `${porcentajePiezas}% avance`;

        document.getElementById('progresoCuadrados').innerText = skusCuadrados;
        document.getElementById('progresoCuadradosPct').innerText = `${pctCuadrados}% de contados`;

        document.getElementById('progresoFaltantes').innerText = skusFaltantes;
        document.getElementById('progresoFaltantesPct').innerText = `${pctFaltantes}% de contados`;

        document.getElementById('progresoSobrantes').innerText = skusSobrantes;
        document.getElementById('progresoSobrantesPct').innerText = `${pctSobrantes}% de contados`;

        document.getElementById('progresoPendientes').innerText = `${skusPendientes} SKUs`;

        document.getElementById('modalProgresoAuditoria').style.display = 'flex';
    }

    function cerrarModalProgreso() {
        document.getElementById('modalProgresoAuditoria').style.display = 'none';
    }

    // --- FILTRADO INTERACTIVO DESDE EL MODAL DE PROGRESO ---
    function filtrarPorEstadoAuditoria(estado) {
        cerrarModalProgreso();

        if (!datosTablaValidadorCache || datosTablaValidadorCache.length === 0) {
            alert("⚠️ No hay datos cargados para filtrar.");
            return;
        }

        const filtrados = datosTablaValidadorCache.filter(fila => {
            const skuSeguro = String(fila.sku || fila.SKU || fila.codigo || fila.CODIGO || "").trim();
            const almacenVal = fila.almacen || fila.ALMACEN || "GENERAL";
            
            const claveCompuesta = skuSeguro + "_" + almacenVal;
            const yaContado = conteoTemporalLista[claveCompuesta] || conteoTemporalLista[skuSeguro];
            
            const existenciaPlana = parseInt(
                fila.existencia || fila.stock || fila.sistema || fila.cantidad || fila.CANTIDAD || 0
            );
            
            const totalFisico = yaContado ? (parseInt(yaContado.fisico) || 0) : 0;
            const difCalculada = totalFisico - existenciaPlana;

            if (estado === 'FALTANTE') return yaContado && difCalculada < 0;
            if (estado === 'SOBRANTE') return yaContado && difCalculada > 0;
            if (estado === 'CUADRADO') return yaContado && difCalculada === 0;
            if (estado === 'PENDIENTE') return !yaContado;
            
            return true;
        });

        if (typeof renderizarFilasValidadorInterno === "function") {
            renderizarFilasValidadorInterno(filtrados);
        } else if (typeof renderizarTablaValidador === "function") {
            renderizarTablaValidador(filtrados);
        } else if (typeof renderizarValidador === "function") {
            renderizarValidador(filtrados);
        }

        const btnToggleFiltros = document.getElementById('btnToggleFiltrosVal');
        if (btnToggleFiltros) {
            btnToggleFiltros.innerText = `🔍 FILTRO ACTIVO: ${estado} (${filtrados.length} SKUs) ▼`;
            btnToggleFiltros.style.backgroundColor = "#e67e22";
        }
    }

    // 1. Guardar el archivo JSON directamente en la carpeta de tu sitio web
async function respaldarEnCarpetaServidor() {
    try {
        const datosBackup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const clave = localStorage.key(i);
            datosBackup[clave] = localStorage.getItem(clave);
        }

        const respuesta = await fetch('guardar_backup.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosBackup, null, 2)
        });

        const resultado = await respuesta.json();
        console.log("✔ Respaldo automático guardado en carpeta web:", resultado);
    } catch (error) {
        console.error("Error al guardar respaldo en carpeta web:", error);
    }
}

// 2. Cargar automáticamente el JSON de la carpeta si el localStorage se borró
async function cargarBackupDesdeServidorAuto() {
    // Solo se ejecuta si el localStorage está totalmente vacío
    if (localStorage.length === 0) {
        try {
            const respuesta = await fetch('backup_auto.json');
            if (respuesta.ok) {
                const datosRestaurados = await respuesta.json();
                Object.keys(datosRestaurados).forEach(clave => {
                    localStorage.setItem(clave, datosRestaurados[clave]);
                });
                console.log("✔ Datos recuperados automáticamente desde backup_auto.json");
                location.reload(); // Recargar para mostrar la información restaurada
            }
        } catch (error) {
            console.log("No se encontró un respaldo automático en la carpeta.");
        }
    }
}

// 3. Ejecutar la comprobación automática al abrir la aplicación
document.addEventListener('DOMContentLoaded', () => {
    cargarBackupDesdeServidorAuto();
});