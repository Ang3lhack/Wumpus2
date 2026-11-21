// =============================================
// ia.js
// AGENTE DE INTELIGENCIA ARTIFICIAL (CAZADOR AUTOMÁTICO)
// Inferencia Bayesiana Exacta + Restricciones Conjuntas + Búsqueda BFS/Dijkstra
// =============================================

import { grafo, obtenerVecinos } from "./mapa";

const NUM_HABITACIONES = 15;

// Precalcular los 105 pares distintos (a < b) para Pozos
const PARES_DISTINTOS = [];
for (let a = 1; a <= NUM_HABITACIONES; a++) {
    for (let b = a + 1; b <= NUM_HABITACIONES; b++) {
        PARES_DISTINTOS.push([a, b]);
    }
}

// Precalcular los 120 pares (a <= b) para Murciélagos (dos murciélagos pueden coincidir tras reubicación)
const PARES_MURCIELAGOS = [];
const INDICE_PAR_MURCIELAGO = {};
for (let a = 1; a <= NUM_HABITACIONES; a++) {
    for (let b = a; b <= NUM_HABITACIONES; b++) {
        const idx = PARES_MURCIELAGOS.length;
        PARES_MURCIELAGOS.push([a, b]);
        INDICE_PAR_MURCIELAGO[`${a}-${b}`] = idx;
    }
}

function indiceParMurcielago(x, y) {
    const a = Math.min(x, y);
    const b = Math.max(x, y);
    return INDICE_PAR_MURCIELAGO[`${a}-${b}`];
}

function normalizarArray(arr) {
    let suma = 0;
    for (let i = 0; i < arr.length; i++) suma += arr[i];
    if (suma <= 0) return false;
    for (let i = 0; i < arr.length; i++) arr[i] /= suma;
    return true;
}

function clonarMemoria(memoria) {
    return {
        wumpusDist: [...memoria.wumpusDist],
        pozoPesos: [...memoria.pozoPesos],
        murcielagoPesos: [...memoria.murcielagoPesos],
        wumpusPudoMoverse: memoria.wumpusPudoMoverse,
        murcielagoReubicado: memoria.murcielagoReubicado,
        segurasConfirmadas: new Set(memoria.segurasConfirmadas),
        historialObservaciones: [...memoria.historialObservaciones],
        idxUltimoEventoWumpus: memoria.idxUltimoEventoWumpus || 0
    };
}

// Aplica restricciones de exclusión mutua mientras Wumpus no se haya movido
function aplicarExclusividad(memoria) {
    if (memoria.wumpusPudoMoverse) return;

    // Si algún pozo es 100% seguro, el Wumpus no puede estar ahí (antes de moverse)
    const pPozo = new Array(NUM_HABITACIONES + 1).fill(0);
    for (let i = 0; i < PARES_DISTINTOS.length; i++) {
        const w = memoria.pozoPesos[i];
        if (w <= 0) continue;
        const [a, b] = PARES_DISTINTOS[i];
        pPozo[a] += w;
        pPozo[b] += w;
    }

    let cambioW = false;
    const wBackup = [...memoria.wumpusDist];
    for (let r = 1; r <= NUM_HABITACIONES; r++) {
        if (pPozo[r] >= 0.9999 && memoria.wumpusDist[r] > 0) {
            memoria.wumpusDist[r] = 0;
            cambioW = true;
        }
    }
    if (cambioW && !normalizarArray(memoria.wumpusDist)) {
        memoria.wumpusDist = wBackup;
    }

    // Si el Wumpus es 100% seguro en r, no hay pozo ahí
    for (let r = 1; r <= NUM_HABITACIONES; r++) {
        if (memoria.wumpusDist[r] >= 0.9999) {
            const pBackup = [...memoria.pozoPesos];
            for (let i = 0; i < PARES_DISTINTOS.length; i++) {
                const [a, b] = PARES_DISTINTOS[i];
                if (a === r || b === r) memoria.pozoPesos[i] = 0;
            }
            if (!normalizarArray(memoria.pozoPesos)) {
                memoria.pozoPesos = pBackup;
            }
        }
    }
}

// Aplica las pistas observadas en la habitación actual `pos`
function aplicarObservacion(memoria, pos, pistas) {
    const vecinos = obtenerVecinos(pos);
    const hayHedor = pistas.some((p) => p.tipo === "wumpus");
    const hayBrisa = pistas.some((p) => p.tipo === "pozo");
    const hayAleteo = pistas.some((p) => p.tipo === "murcielago");

    memoria.segurasConfirmadas.add(pos);
    if (!hayHedor && !hayBrisa && !hayAleteo) {
        vecinos.forEach((v) => memoria.segurasConfirmadas.add(v));
    }

    // 1. Actualizar creencia sobre el Wumpus
    const wBackup = [...memoria.wumpusDist];
    memoria.wumpusDist[pos] = 0;
    for (let r = 1; r <= NUM_HABITACIONES; r++) {
        const esVecino = vecinos.includes(r);
        if (hayHedor && !esVecino) {
            memoria.wumpusDist[r] = 0;
        } else if (!hayHedor && esVecino) {
            memoria.wumpusDist[r] = 0;
        }
    }
    if (!normalizarArray(memoria.wumpusDist)) {
        memoria.wumpusDist = wBackup;
        memoria.wumpusDist[pos] = 0;
        if (!normalizarArray(memoria.wumpusDist)) {
            for (let r = 1; r <= NUM_HABITACIONES; r++) {
                memoria.wumpusDist[r] = r === pos ? 0 : 1;
            }
            normalizarArray(memoria.wumpusDist);
        }
    }

    // 2. Actualizar creencia exacta sobre pares de Pozos (estáticos)
    const pBackup = [...memoria.pozoPesos];
    for (let i = 0; i < PARES_DISTINTOS.length; i++) {
        if (memoria.pozoPesos[i] === 0) continue;
        const [a, b] = PARES_DISTINTOS[i];
        if (a === pos || b === pos) {
            memoria.pozoPesos[i] = 0;
            continue;
        }
        const vecinoTienePozo = vecinos.includes(a) || vecinos.includes(b);
        if ((hayBrisa && !vecinoTienePozo) || (!hayBrisa && vecinoTienePozo)) {
            memoria.pozoPesos[i] = 0;
        }
    }
    if (!normalizarArray(memoria.pozoPesos)) {
        memoria.pozoPesos = pBackup;
    }

    // 3. Actualizar creencia sobre pares de Murciélagos
    const mBackup = [...memoria.murcielagoPesos];
    for (let i = 0; i < PARES_MURCIELAGOS.length; i++) {
        if (memoria.murcielagoPesos[i] === 0) continue;
        const [a, b] = PARES_MURCIELAGOS[i];
        if (a === pos || b === pos) {
            memoria.murcielagoPesos[i] = 0;
            continue;
        }
        const vecinoTieneBat = vecinos.includes(a) || vecinos.includes(b);
        if ((hayAleteo && !vecinoTieneBat) || (!hayAleteo && vecinoTieneBat)) {
            memoria.murcielagoPesos[i] = 0;
        }
    }
    if (!normalizarArray(memoria.murcielagoPesos)) {
        for (let i = 0; i < PARES_MURCIELAGOS.length; i++) {
            const [a, b] = PARES_MURCIELAGOS[i];
            if (a === pos || b === pos) {
                memoria.murcielagoPesos[i] = 0;
                continue;
            }
            const vecinoTieneBat = vecinos.includes(a) || vecinos.includes(b);
            memoria.murcielagoPesos[i] = (hayAleteo ? vecinoTieneBat : !vecinoTieneBat) ? 1 : 0;
        }
        if (!normalizarArray(memoria.murcielagoPesos)) {
            memoria.murcielagoPesos = mBackup;
        }
    }

    aplicarExclusividad(memoria);
    memoria.historialObservaciones.push({ pos, hayHedor, hayBrisa, hayAleteo });
    return memoria;
}

// =============================================
// INICIALIZAR MEMORIA DE LA IA
// =============================================
export function crearMemoriaIA(posicionInicial, pistasIniciales) {
    const wumpusDist = new Array(NUM_HABITACIONES + 1).fill(1);
    wumpusDist[0] = 0;
    wumpusDist[posicionInicial] = 0;
    normalizarArray(wumpusDist);

    const pozoPesos = new Array(PARES_DISTINTOS.length).fill(1);
    normalizarArray(pozoPesos);

    const murcielagoPesos = new Array(PARES_MURCIELAGOS.length).fill(0);
    for (let i = 0; i < PARES_MURCIELAGOS.length; i++) {
        const [a, b] = PARES_MURCIELAGOS[i];
        murcielagoPesos[i] = a !== b ? 1 : 0;
    }
    normalizarArray(murcielagoPesos);

    const memoria = {
        wumpusDist,
        pozoPesos,
        murcielagoPesos,
        wumpusPudoMoverse: false,
        murcielagoReubicado: false,
        segurasConfirmadas: new Set([posicionInicial]),
        historialObservaciones: [],
        idxUltimoEventoWumpus: 0
    };

    return aplicarObservacion(memoria, posicionInicial, pistasIniciales);
}

// =============================================
// ACTUALIZAR MEMORIA TRAS UN MOVIMIENTO
// =============================================
export function actualizarMemoriaMovimiento(memoriaAnterior, { destino, teletransportado, nuevaPos, pistas }) {
    const memoria = clonarMemoria(memoriaAnterior);

    if (teletransportado) {
        memoria.murcielagoReubicado = true;
        memoria.wumpusDist[destino] = 0;
        normalizarArray(memoria.wumpusDist);

        for (let i = 0; i < PARES_DISTINTOS.length; i++) {
            const [a, b] = PARES_DISTINTOS[i];
            if (a === destino || b === destino) {
                memoria.pozoPesos[i] = 0;
            }
        }
        normalizarArray(memoria.pozoPesos);

        const nuevosPesosBat = new Array(PARES_MURCIELAGOS.length).fill(0);
        let sumaPre = 0;
        const paresConDestino = [];
        for (let i = 0; i < PARES_MURCIELAGOS.length; i++) {
            const w = memoria.murcielagoPesos[i];
            if (w <= 0) continue;
            const [a, b] = PARES_MURCIELAGOS[i];
            if (a === destino || b === destino) {
                const otro = a === destino ? b : a;
                paresConDestino.push({ otro, w });
                sumaPre += w;
            }
        }

        if (sumaPre > 0) {
            for (const { otro, w } of paresConDestino) {
                const wNorm = w / sumaPre;
                let pesoTotalDest = 0;
                const candidatos = [];
                for (let bNueva = 1; bNueva <= NUM_HABITACIONES; bNueva++) {
                    if (bNueva === nuevaPos) continue;
                    const pNoWumpus = Math.max(0.01, 1 - memoria.wumpusDist[bNueva]);
                    candidatos.push({ bNueva, peso: pNoWumpus });
                    pesoTotalDest += pNoWumpus;
                }
                for (const { bNueva, peso } of candidatos) {
                    const idx = indiceParMurcielago(otro, bNueva);
                    nuevosPesosBat[idx] += wNorm * (peso / pesoTotalDest);
                }
            }
            memoria.murcielagoPesos = nuevosPesosBat;
            normalizarArray(memoria.murcielagoPesos);
        } else {
            memoria.murcielagoPesos.fill(1);
            normalizarArray(memoria.murcielagoPesos);
        }
    }

    return aplicarObservacion(memoria, nuevaPos, pistas);
}

// =============================================
// ACTUALIZAR MEMORIA TRAS UN DISPARO FALLIDO
// =============================================
export function actualizarMemoriaDisparo(memoriaAnterior, { destino, wumpusSeMovio, posicionActual, pistas }) {
    const memoria = clonarMemoria(memoriaAnterior);

    memoria.wumpusDist[destino] = 0;
    normalizarArray(memoria.wumpusDist);

    if (wumpusSeMovio) {
        memoria.wumpusPudoMoverse = true;
        memoria.idxUltimoEventoWumpus = memoria.historialObservaciones.length;
        const nuevaDist = new Array(NUM_HABITACIONES + 1).fill(0);
        for (let u = 1; u <= NUM_HABITACIONES; u++) {
            const p = memoria.wumpusDist[u];
            if (p <= 0) continue;
            const vecinosU = obtenerVecinos(u);
            for (const v of vecinosU) {
                nuevaDist[v] += p / vecinosU.length;
            }
        }
        memoria.wumpusDist = nuevaDist;
        normalizarArray(memoria.wumpusDist);
    }

    return aplicarObservacion(memoria, posicionActual, pistas);
}

// =============================================
// CALCULAR PROBABILIDADES MARGINALES POR CAVERNA
// =============================================
export function calcularProbabilidades(memoria) {
    const pWumpus = [...memoria.wumpusDist];
    const pPozo = new Array(NUM_HABITACIONES + 1).fill(0);
    const pMurcielago = new Array(NUM_HABITACIONES + 1).fill(0);

    for (let i = 0; i < PARES_DISTINTOS.length; i++) {
        const w = memoria.pozoPesos[i];
        if (w <= 0) continue;
        const [a, b] = PARES_DISTINTOS[i];
        pPozo[a] += w;
        pPozo[b] += w;
    }

    for (let i = 0; i < PARES_MURCIELAGOS.length; i++) {
        const w = memoria.murcielagoPesos[i];
        if (w <= 0) continue;
        const [a, b] = PARES_MURCIELAGOS[i];
        pMurcielago[a] += w;
        if (a !== b) {
            pMurcielago[b] += w;
        }
    }

    const pMuerte = new Array(NUM_HABITACIONES + 1).fill(0);
    const esSegura = new Array(NUM_HABITACIONES + 1).fill(false);

    // Un murciélago te teletransporta a 1 de 14 salas, ~3 son mortales (3/14 ≈ 0.214)
    const probTeletransporteMortal = 3 / 14;

    for (let r = 1; r <= NUM_HABITACIONES; r++) {
        const pw = pWumpus[r];
        const pp = pPozo[r];
        const pm = pMurcielago[r];
        pMuerte[r] = Math.min(1, pw + pp + pm * probTeletransporteMortal);
        esSegura[r] = pw < 1e-6 && pp < 1e-6 && pm < 1e-6;
    }

    return {
        pWumpus,
        pPozo,
        pMurcielago,
        pMuerte,
        esSegura
    };
}

// =============================================
// BÚSQUEDA DE RUTAS (BFS SEGURO Y DIJKSTRA DE RIESGO MÍNIMO)
// =============================================
function bfsRutaSegura(origen, objetivosSet, esSegura) {
    const cola = [[origen]];
    const visitadosBfs = new Set([origen]);

    while (cola.length > 0) {
        const ruta = cola.shift();
        const actual = ruta[ruta.length - 1];

        if (actual !== origen && objetivosSet.has(actual)) {
            return ruta;
        }

        for (const v of obtenerVecinos(actual)) {
            if (!visitadosBfs.has(v) && esSegura[v]) {
                visitadosBfs.add(v);
                cola.push([...ruta, v]);
            }
        }
    }
    return null;
}

function dijkstraMenorRiesgo(origen, objetivosSet, pMuerte) {
    const dist = new Array(NUM_HABITACIONES + 1).fill(Infinity);
    const padre = new Array(NUM_HABITACIONES + 1).fill(null);
    const procesado = new Set();

    dist[origen] = 0;

    for (let iter = 0; iter < NUM_HABITACIONES; iter++) {
        let u = -1;
        let mejor = Infinity;
        for (let r = 1; r <= NUM_HABITACIONES; r++) {
            if (!procesado.has(r) && dist[r] < mejor) {
                mejor = dist[r];
                u = r;
            }
        }
        if (u === -1 || mejor === Infinity) break;
        if (u !== origen && objetivosSet.has(u)) {
            const ruta = [];
            let curr = u;
            while (curr !== null) {
                ruta.unshift(curr);
                curr = padre[curr];
            }
            const probSobrevivir = Math.exp(-dist[u]);
            return {
                ruta,
                riesgoTotal: Math.max(0, Math.min(1, 1 - probSobrevivir))
            };
        }

        procesado.add(u);
        for (const v of obtenerVecinos(u)) {
            if (procesado.has(v)) continue;
            const riesgoV = Math.min(0.9999, pMuerte[v]);
            const costoPaso = -Math.log(1 - riesgoV) + 0.002;
            if (dist[u] + costoPaso < dist[v]) {
                dist[v] = dist[u] + costoPaso;
                padre[v] = u;
            }
        }
    }

    return null;
}

// =============================================
// MOTOR DE DECISIÓN TÁCTICA DE LA IA
// =============================================
export function decidirAccionIA(partida, memoria) {
    if (!partida.vivo || partida.gano) return null;

    const pos = partida.jugador;
    const vecinos = obtenerVecinos(pos);
    const visitadasSet = new Set(partida.visitadas || [pos]);
    const probs = calcularProbabilidades(memoria);
    const { pWumpus, pPozo, pMurcielago, pMuerte, esSegura } = probs;

    // Candidatos donde podría estar el Wumpus
    const wumpusCandidatos = [];
    for (let r = 1; r <= NUM_HABITACIONES; r++) {
        if (pWumpus[r] > 1e-6) wumpusCandidatos.push(r);
    }

    // Mejor vecino actual para disparar
    let mejorVecinoDisparo = vecinos[0];
    let maxPWumpusVecino = -1;
    for (const v of vecinos) {
        if (pWumpus[v] > maxPWumpusVecino) {
            maxPWumpusVecino = pWumpus[v];
            mejorVecinoDisparo = v;
        }
    }

    // 1. DISPARO GARANTIZADO (100% certeza)
    if (partida.flechas > 0 && maxPWumpusVecino >= 0.999) {
        return {
            tipo: "disparar",
            objetivo: mejorVecinoDisparo,
            probs,
            razon: `🎯 ¡Wumpus deducido al 100% en caverna #${mejorVecinoDisparo}! Disparando flecha dorada.`
        };
    }

    // 2. WUMPUS LOCALIZADO A DISTANCIA: Acercarse por ruta 100% segura para ponerse a tiro
    if (partida.flechas > 0 && wumpusCandidatos.length === 1) {
        const wTarget = wumpusCandidatos[0];
        const vecinosWumpusSeguros = new Set(
            obtenerVecinos(wTarget).filter((v) => esSegura[v] && v !== pos)
        );
        if (vecinosWumpusSeguros.size > 0) {
            const rutaAlTiro = bfsRutaSegura(pos, vecinosWumpusSeguros, esSegura);
            if (rutaAlTiro && rutaAlTiro.length >= 2) {
                const paso = rutaAlTiro[1];
                return {
                    tipo: "mover",
                    objetivo: paso,
                    meta: rutaAlTiro[rutaAlTiro.length - 1],
                    probs,
                    razon: `🎯 Wumpus confirmado en #${wTarget}. Avanzando sin riesgo por #${paso} para disparar.`
                };
            }
        }
    }

    // 3. EXPLORACIÓN SEGURA: Buscar cavernas no visitadas 100% seguras
    const noVisitadasSeguras = [];
    for (let r = 1; r <= NUM_HABITACIONES; r++) {
        if (!visitadasSet.has(r) && esSegura[r]) {
            noVisitadasSeguras.push(r);
        }
    }

    if (noVisitadasSeguras.length > 0) {
        let mejorRuta = null;
        let mejorPuntaje = -Infinity;

        for (const candidato of noVisitadasSeguras) {
            const ruta = bfsRutaSegura(pos, new Set([candidato]), esSegura);
            if (!ruta || ruta.length < 2) continue;

            const distancia = ruta.length - 1;
            const vecinosCand = obtenerVecinos(candidato);
            // Si la sala divide el conjunto de candidatos de Wumpus, da información máxima
            const numCandAdj = wumpusCandidatos.filter((wc) => vecinosCand.includes(wc)).length;
            const divideCandidatos = numCandAdj > 0 && numCandAdj < wumpusCandidatos.length ? 1 : 0;
            const infoNueva = vecinosCand.filter((v) => !visitadasSet.has(v)).length;

            const puntaje = divideCandidatos * 15 + (numCandAdj > 0 ? 6 : 0) + infoNueva * 1.5 - distancia * 2;
            if (puntaje > mejorPuntaje) {
                mejorPuntaje = puntaje;
                mejorRuta = ruta;
            }
        }

        if (mejorRuta) {
            const siguientePaso = mejorRuta[1];
            const meta = mejorRuta[mejorRuta.length - 1];
            const esTriangulacion = wumpusCandidatos.length > 1 &&
                obtenerVecinos(meta).some((v) => wumpusCandidatos.includes(v));

            return {
                tipo: "mover",
                objetivo: siguientePaso,
                meta,
                probs,
                razon: esTriangulacion
                    ? `🧠 Explorando caverna segura #${siguientePaso} (rumbo a #${meta}) para triangular el hedor.`
                    : `🗺️ Avanzando a caverna segura #${siguientePaso}${meta !== siguientePaso ? ` (rumbo a #${meta})` : ""} para mapear el grafo.`
            };
        }
    }

    // 4. SIN SALAS 100% SEGURAS POR VISITAR:
    // Evaluar primero si hay un punto de triangulación segura para distinguir los candidatos del Wumpus
    // (ej. si el Wumpus se movió a una zona ya conocida o quedan 2 candidatos)
    if (wumpusCandidatos.length > 1 && wumpusCandidatos.length <= 4) {
        const salasDivisoras = new Set();
        const obsRecientes = memoria.historialObservaciones.slice(memoria.idxUltimoEventoWumpus || 0);
        for (let r = 1; r <= NUM_HABITACIONES; r++) {
            if (!esSegura[r] || r === pos) continue;
            const vecR = obtenerVecinos(r);
            const adjCount = wumpusCandidatos.filter((wc) => vecR.includes(wc)).length;
            if (adjCount > 0 && adjCount < wumpusCandidatos.length) {
                const yaObservado = obsRecientes.some((h) => h.pos === r);
                if (!yaObservado) {
                    salasDivisoras.add(r);
                }
            }
        }
        if (salasDivisoras.size > 0) {
            const rutaDiv = bfsRutaSegura(pos, salasDivisoras, esSegura);
            if (rutaDiv && rutaDiv.length >= 2) {
                return {
                    tipo: "mover",
                    objetivo: rutaDiv[1],
                    meta: rutaDiv[rutaDiv.length - 1],
                    probs,
                    razon: `🧠 Reubicándose sin riesgo hacia #${rutaDiv[rutaDiv.length - 1]} para confirmar posición del Wumpus.`
                };
            }
        }
    }

    // Construir objetivos de exploración con mínimo riesgo
    const objetivosRiesgo = new Set();
    if (partida.flechas > 0 && wumpusCandidatos.length === 1) {
        for (const v of obtenerVecinos(wumpusCandidatos[0])) {
            if (v !== pos) objetivosRiesgo.add(v);
        }
    }
    for (let r = 1; r <= NUM_HABITACIONES; r++) {
        if (!visitadasSet.has(r) && pMuerte[r] < 0.999) {
            objetivosRiesgo.add(r);
        }
    }

    const planArriesgado = objetivosRiesgo.size > 0
        ? dijkstraMenorRiesgo(pos, objetivosRiesgo, pMuerte)
        : null;

    const riesgoMovimiento = planArriesgado ? planArriesgado.riesgoTotal : 1;

    // 4B. Si no hay camino seguro y moverse conlleva alto riesgo,
    // verificar si conviene disparar o caminar por salas seguras hacia un buen candidato de tiro
    if (partida.flechas > 0 && partida.pasos < 35 && riesgoMovimiento >= 0.38) {
        const umbralTiro = partida.flechas >= 2 ? 0.33 : Math.max(0.49, 1 - riesgoMovimiento);
        if (maxPWumpusVecino >= umbralTiro) {
            const pct = Math.round(maxPWumpusVecino * 100);
            return {
                tipo: "disparar",
                objetivo: mejorVecinoDisparo,
                probs,
                razon: `🏹 Disparo táctico a #${mejorVecinoDisparo} (${pct}% prob. de Wumpus; más seguro que arriesgar un pozo).`
            };
        }

        const candidatosFuertes = wumpusCandidatos
            .filter((wc) => pWumpus[wc] >= umbralTiro)
            .sort((a, b) => pWumpus[b] - pWumpus[a]);

        for (const wc of candidatosFuertes) {
            const posicionesTiroSeguras = new Set(
                obtenerVecinos(wc).filter((v) => esSegura[v] && v !== pos)
            );
            if (posicionesTiroSeguras.size > 0) {
                const rutaTiro = bfsRutaSegura(pos, posicionesTiroSeguras, esSegura);
                if (rutaTiro && rutaTiro.length >= 2) {
                    const pct = Math.round(pWumpus[wc] * 100);
                    return {
                        tipo: "mover",
                        objetivo: rutaTiro[1],
                        meta: rutaTiro[rutaTiro.length - 1],
                        probs,
                        razon: `🎯 Sin paso seguro adelante: reubicándose sin riesgo hacia #${rutaTiro[rutaTiro.length - 1]} para cazar a #${wc} (${pct}%).`
                    };
                }
            }
        }
    }

    // 4C. Si ya estamos adyacentes a un candidato y moverse tiene riesgo alto o no quedan salas útiles
    if (partida.flechas > 0 && maxPWumpusVecino > 0) {
        const convieneConMultiplesFlechas =
            partida.flechas >= 2 && maxPWumpusVecino >= 0.32 && riesgoMovimiento >= 0.25;

        const convieneConUltimaFlecha =
            partida.flechas === 1 &&
            (maxPWumpusVecino >= 1 - riesgoMovimiento || !planArriesgado);

        if (convieneConMultiplesFlechas || convieneConUltimaFlecha || !planArriesgado) {
            const pct = Math.round(maxPWumpusVecino * 100);
            return {
                tipo: "disparar",
                objetivo: mejorVecinoDisparo,
                probs,
                razon: `🏹 Sin rutas seguras: disparando flecha táctica a #${mejorVecinoDisparo} (${pct}% prob. de Wumpus).`
            };
        }
    }

    // 4D. Ejecutar movimiento de mínimo riesgo hacia una caverna no visitada
    if (planArriesgado && planArriesgado.ruta.length >= 2) {
        const siguientePaso = planArriesgado.ruta[1];
        const pctPeligro = Math.round(pMuerte[siguientePaso] * 100);
        const esProbBat = pMurcielago[siguientePaso] > 0.25 && pPozo[siguientePaso] < 0.05 && pWumpus[siguientePaso] < 0.05;

        return {
            tipo: "mover",
            objetivo: siguientePaso,
            meta: planArriesgado.ruta[planArriesgado.ruta.length - 1],
            probs,
            razon: esProbBat
                ? `🦇 Sin rutas libres: cruzando posible zona de murciélagos en #${siguientePaso} (mejor opción que pozos).`
                : `⚠️ Asumiendo menor riesgo posible hacia #${siguientePaso} (${pctPeligro}% peligro estimado).`
        };
    }

    // 5. Respaldo final si todas las salas no visitadas parecen letales y aún hay flechas
    if (partida.flechas > 0) {
        let mejorW = 1;
        for (let r = 1; r <= NUM_HABITACIONES; r++) {
            if (pWumpus[r] > pWumpus[mejorW]) mejorW = r;
        }
        if (vecinos.includes(mejorW)) {
            return {
                tipo: "disparar",
                objetivo: mejorW,
                probs,
                razon: `🏹 Disparando al candidato más probable en #${mejorW}.`
            };
        }
        const vecinosMejorW = new Set(obtenerVecinos(mejorW).filter((v) => v !== pos));
        const rutaFinal = dijkstraMenorRiesgo(pos, vecinosMejorW, pMuerte);
        if (rutaFinal && rutaFinal.ruta.length >= 2) {
            return {
                tipo: "mover",
                objetivo: rutaFinal.ruta[1],
                probs,
                razon: `🎯 Acercándose al candidato más probable (#${mejorW}).`
            };
        }
    }

    // Último recurso absoluto
    let vecinoMasSeguro = vecinos[0];
    let menorMuerte = Infinity;
    for (const v of vecinos) {
        if (pMuerte[v] < menorMuerte) {
            menorMuerte = pMuerte[v];
            vecinoMasSeguro = v;
        }
    }

    return {
        tipo: "mover",
        objetivo: vecinoMasSeguro,
        probs,
        razon: `⚠️ Avanzando a la opción menos letal (#${vecinoMasSeguro}).`
    };
}

export { grafo };
