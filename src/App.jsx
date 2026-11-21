// =============================================
// App.jsx - CAZA AL WUMPUS (VERSIÓN MEJORADA + IA CAZADORA)
// =============================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    grafo,
    posiciones,
    obtenerVecinos,
    estanConectadas
} from "./game/mapa";

import {
    crearPartida,
    obtenerPistas
} from "./game/juego";

import {
    crearMemoriaIA,
    actualizarMemoriaMovimiento,
    actualizarMemoriaDisparo,
    calcularProbabilidades,
    decidirAccionIA
} from "./game/ia";

import { gestorAudio } from "./game/audio";
import { PantallaInicio } from "./components/PantallaInicio";
import { MapaCaverna } from "./components/MapaCaverna";
import { PanelControl } from "./components/PanelControl";
import { ModalGameOver } from "./components/ModalGameOver";
import { EfectosHorror } from "./components/EfectosHorror";
import { Home, Bot } from "lucide-react";

import "./App.css";

const VELOCIDADES_IA = {
    lenta: 1100,
    normal: 550,
    rapida: 220
};

export function App() {
    // =========================================
    // ESTADOS PRINCIPALES
    // =========================================
    const [enInicio, setEnInicio] = useState(true);
    const [dificultadSeleccionada, setDificultadSeleccionada] = useState("normal");
    const [partida, setPartida] = useState(() => crearPartida("normal"));
    const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);

    // INTELIGENCIA ARTIFICIAL (JUEGO AUTOMÁTICO)
    const [iaActiva, setIaActiva] = useState(false);
    const [velocidadIA, setVelocidadIA] = useState("normal");
    const [mostrarAnalisisIA, setMostrarAnalisisIA] = useState(true);
    const [memoriaIA, setMemoriaIA] = useState(() =>
        crearMemoriaIA(partida.jugador, obtenerPistas(partida))
    );
    const [ultimaRazonIA, setUltimaRazonIA] = useState(
        "🧠 Analizando pistas iniciales de la caverna..."
    );
    const [metaIA, setMetaIA] = useState(null);
    const [statsIA, setStatsIA] = useState({ partidas: 0, victorias: 0 });
    const resultadoRegistradoRef = useRef(false);

    // MODO DESARROLLADOR Y CALIBRACIÓN
    const [modoDesarrollador, setModoDesarrollador] = useState(false);
    const [coordenadas, setCoordenadas] = useState({ x: 0, y: 0 });
    const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);

    // ATMÓSFERA Y EFECTOS
    const [nieblaActiva, setNieblaActiva] = useState(true);
    const [temblorPantalla, setTemblorPantalla] = useState(false);
    const [flechaAnimada, setFlechaAnimada] = useState(null);

    // SONIDO
    const [silenciado, setSilenciado] = useState(false);
    const [volumenMusica, setVolumenMusica] = useState(0.35);
    const [volumenEfectos, setVolumenEfectos] = useState(0.7);

    // =========================================
    // VECINOS, PISTAS Y PROBABILIDADES IA
    // =========================================
    const vecinos = useMemo(() => {
        return obtenerVecinos(partida.jugador);
    }, [partida.jugador]);

    const pistas = useMemo(() => {
        return obtenerPistas(partida);
    }, [partida]);

    const probsIA = useMemo(() => {
        return calcularProbabilidades(memoriaIA);
    }, [memoriaIA]);

    const hayWumpusCerca = useMemo(() => {
        return pistas.some(p => p.tipo === "wumpus");
    }, [pistas]);

    const hayPozoCerca = useMemo(() => {
        return pistas.some(p => p.tipo === "pozo");
    }, [pistas]);

    const hayMurcielagoCerca = useMemo(() => {
        return pistas.some(p => p.tipo === "murcielago");
    }, [pistas]);

    // =========================================
    // GESTIÓN DE AUDIOS SEGÚN EL ENTORNO
    // =========================================
    useEffect(() => {
        if (!enInicio && partida.vivo && !partida.gano) {
            if (hayWumpusCerca) {
                gestorAudio.iniciarLatidos(2);
                gestorAudio.reproducirGrunidoDistante();
            } else {
                gestorAudio.detenerLatidos();
            }

            if (hayPozoCerca) {
                gestorAudio.reproducirArchivo("brisa");
            } else {
                gestorAudio.detenerArchivo("brisa");
            }

            if (hayMurcielagoCerca) {
                gestorAudio.reproducirArchivo("murcielagos");
            } else {
                gestorAudio.detenerArchivo("murcielagos");
            }
        } else {
            gestorAudio.detenerLatidos();
            gestorAudio.detenerArchivo("brisa");
            gestorAudio.detenerArchivo("murcielagos");
        }
    }, [enInicio, partida.jugador, partida.vivo, partida.gano, hayWumpusCerca, hayPozoCerca, hayMurcielagoCerca]);

    const registrarResultadoIA = useCallback((victoria) => {
        if (iaActiva && !resultadoRegistradoRef.current) {
            resultadoRegistradoRef.current = true;
            setStatsIA(prev => ({
                partidas: prev.partidas + 1,
                victorias: prev.victorias + (victoria ? 1 : 0)
            }));
        }
    }, [iaActiva]);

    // =========================================
    // INICIAR Y REINICIAR PARTIDA
    // =========================================
    const iniciarJuego = (dificultad = "normal", activarIA = false) => {
        setDificultadSeleccionada(dificultad);
        setEnInicio(false);
        const nueva = crearPartida(dificultad);
        setPartida(nueva);
        setMemoriaIA(crearMemoriaIA(nueva.jugador, obtenerPistas(nueva)));
        setUltimaRazonIA("🧠 Analizando pistas iniciales de la caverna...");
        setMetaIA(null);
        resultadoRegistradoRef.current = false;
        setIaActiva(activarIA);
        setHabitacionSeleccionada(null);
        setTemblorPantalla(false);
        setFlechaAnimada(null);
        gestorAudio.iniciarAmbiente();
    };

    const reiniciar = useCallback(() => {
        gestorAudio.detenerTodosLosEfectos();
        gestorAudio.iniciarAmbiente();
        const nueva = crearPartida(dificultadSeleccionada);
        setPartida(nueva);
        setMemoriaIA(crearMemoriaIA(nueva.jugador, obtenerPistas(nueva)));
        setUltimaRazonIA("🧠 Analizando pistas iniciales de la caverna...");
        setMetaIA(null);
        resultadoRegistradoRef.current = false;
        setHabitacionSeleccionada(null);
        setTemblorPantalla(false);
        setFlechaAnimada(null);
    }, [dificultadSeleccionada]);

    const volverAlMenu = useCallback(() => {
        gestorAudio.detenerTodosLosEfectos();
        gestorAudio.iniciarAmbiente();
        setIaActiva(false);
        setEnInicio(true);
        setHabitacionSeleccionada(null);
        setMetaIA(null);
        setTemblorPantalla(false);
        setFlechaAnimada(null);
    }, []);

    // =========================================
    // MOVER JUGADOR
    // =========================================
    const moverJugador = useCallback((destino) => {
        if (!partida.vivo || partida.gano) return;

        if (!estanConectadas(partida.jugador, destino)) {
            setPartida(prev => ({
                ...prev,
                mensaje: `❌ La caverna #${destino} no conecta directamente con tu posición (#${prev.jugador}).`
            }));
            return;
        }

        gestorAudio.reproducirPaso();

        const nuevasVisitadas = Array.from(new Set([...(partida.visitadas || []), destino]));

        // 1. Peligro: Wumpus
        if (destino === partida.wumpus) {
            setTemblorPantalla(true);
            gestorAudio.detenerAmbiente();
            gestorAudio.detenerLatidos();
            gestorAudio.reproducirArchivo("wumpus");
            registrarResultadoIA(false);

            setPartida(prev => ({
                ...prev,
                jugador: destino,
                vivo: false,
                causaMuerte: "wumpus",
                pasos: prev.pasos + 1,
                visitadas: nuevasVisitadas,
                mensaje: "💀 ¡Entraste directamente a las fauces del Wumpus! La bestia te ha devorado."
            }));
            return;
        }

        // 2. Peligro: Pozo sin fondo
        if (partida.pozos.includes(destino)) {
            setTemblorPantalla(true);
            gestorAudio.detenerAmbiente();
            gestorAudio.detenerLatidos();
            gestorAudio.reproducirArchivo("caida");
            registrarResultadoIA(false);

            setPartida(prev => ({
                ...prev,
                jugador: destino,
                vivo: false,
                causaMuerte: "pozo",
                pasos: prev.pasos + 1,
                visitadas: nuevasVisitadas,
                mensaje: "🕳️ ¡El suelo se quebró bajo tus pies! Caíste en un pozo sin fondo."
            }));
            return;
        }

        // 3. Peligro: Murciélagos gigantes
        if (partida.murcielagos.includes(destino)) {
            gestorAudio.reproducirArchivo("murcielagos");

            let habitacionDestino;
            do {
                habitacionDestino = Math.floor(Math.random() * 15) + 1;
            } while (habitacionDestino === destino);

            const nuevosMurcielagos = partida.murcielagos.map(m => {
                if (m === destino) {
                    let nuevaPosBat;
                    do {
                        nuevaPosBat = Math.floor(Math.random() * 15) + 1;
                    } while (nuevaPosBat === habitacionDestino || nuevaPosBat === partida.wumpus);
                    return nuevaPosBat;
                }
                return m;
            });

            if (habitacionDestino === partida.wumpus) {
                setTemblorPantalla(true);
                gestorAudio.detenerAmbiente();
                gestorAudio.reproducirArchivo("wumpus");
                registrarResultadoIA(false);
                setPartida(prev => ({
                    ...prev,
                    jugador: habitacionDestino,
                    murcielagos: nuevosMurcielagos,
                    vivo: false,
                    causaMuerte: "wumpus",
                    pasos: prev.pasos + 1,
                    visitadas: Array.from(new Set([...nuevasVisitadas, habitacionDestino])),
                    mensaje: `🦇 ¡Murciélagos gigantes te levantaron en vilo y te arrojaron a la guarida del Wumpus (#${habitacionDestino})!`
                }));
                return;
            }

            if (partida.pozos.includes(habitacionDestino)) {
                setTemblorPantalla(true);
                gestorAudio.detenerAmbiente();
                gestorAudio.reproducirArchivo("caida");
                registrarResultadoIA(false);
                setPartida(prev => ({
                    ...prev,
                    jugador: habitacionDestino,
                    murcielagos: nuevosMurcielagos,
                    vivo: false,
                    causaMuerte: "pozo",
                    pasos: prev.pasos + 1,
                    visitadas: Array.from(new Set([...nuevasVisitadas, habitacionDestino])),
                    mensaje: `🦇 ¡Los murciélagos te soltaron en el vacío de un pozo sin fondo (#${habitacionDestino})!`
                }));
                return;
            }

            const partidaSobrevivida = {
                ...partida,
                jugador: habitacionDestino,
                murcielagos: nuevosMurcielagos,
                pasos: partida.pasos + 1,
                visitadas: Array.from(new Set([...nuevasVisitadas, habitacionDestino])),
                mensaje: `🦇 ¡Una bandada de murciélagos te alzó en el aire y te soltó en la caverna #${habitacionDestino}!`
            };
            setPartida(partidaSobrevivida);
            setMemoriaIA(prevMem =>
                actualizarMemoriaMovimiento(prevMem, {
                    destino,
                    teletransportado: true,
                    nuevaPos: habitacionDestino,
                    pistas: obtenerPistas(partidaSobrevivida)
                })
            );
            setHabitacionSeleccionada(null);
            return;
        }

        // Movimiento exitoso seguro
        const partidaActualizada = {
            ...partida,
            jugador: destino,
            pasos: partida.pasos + 1,
            visitadas: nuevasVisitadas,
            mensaje: `Te adentraste en la caverna #${destino}. La penumbra te rodea.`
        };
        setPartida(partidaActualizada);
        setMemoriaIA(prevMem =>
            actualizarMemoriaMovimiento(prevMem, {
                destino,
                teletransportado: false,
                nuevaPos: destino,
                pistas: obtenerPistas(partidaActualizada)
            })
        );
        setHabitacionSeleccionada(null);
    }, [partida, registrarResultadoIA]);

    // =========================================
    // DISPARAR FLECHA
    // =========================================
    const disparar = useCallback((destino) => {
        if (!partida.vivo || partida.gano) return;

        if (partida.flechas <= 0) {
            setPartida(prev => ({
                ...prev,
                mensaje: "🏹 Tu carcaj está completamente vacío. ¡No te quedan flechas!"
            }));
            return;
        }

        if (!estanConectadas(partida.jugador, destino)) {
            setPartida(prev => ({
                ...prev,
                mensaje: "❌ No puedes disparar hacia una caverna que no tenga túnel directo."
            }));
            return;
        }

        gestorAudio.reproducirDisparoFlecha();
        setFlechaAnimada({ origen: partida.jugador, destino });

        setTimeout(() => {
            setFlechaAnimada(null);
        }, 400);

        const flechasRestantes = partida.flechas - 1;

        // 1. ¿Le diste al Wumpus?
        if (destino === partida.wumpus) {
            gestorAudio.detenerAmbiente();
            gestorAudio.detenerLatidos();
            gestorAudio.reproducirArchivo("victoria");
            registrarResultadoIA(true);

            setPartida(prev => ({
                ...prev,
                flechas: flechasRestantes,
                gano: true,
                mensaje: `🏆 ¡TIRO CERTERO! Atravesaste al Wumpus en la caverna #${destino}. ¡Eres el héroe de las cavernas!`
            }));
            return;
        }

        // 2. Fallaste: El sonido de la flecha alerta al Wumpus
        gestorAudio.reproducirImpactoRoca();
        let nuevoWumpus = partida.wumpus;
        let wumpusSeMovio = false;

        if (Math.random() < 0.75) {
            const vecinosWumpus = obtenerVecinos(partida.wumpus);
            if (vecinosWumpus.length > 0) {
                nuevoWumpus = vecinosWumpus[Math.floor(Math.random() * vecinosWumpus.length)];
                wumpusSeMovio = true;
            }
        }

        if (nuevoWumpus === partida.jugador) {
            setTemblorPantalla(true);
            gestorAudio.detenerAmbiente();
            gestorAudio.detenerLatidos();
            gestorAudio.reproducirArchivo("wumpus");
            registrarResultadoIA(false);

            setPartida(prev => ({
                ...prev,
                flechas: flechasRestantes,
                wumpus: nuevoWumpus,
                vivo: false,
                causaMuerte: "wumpus",
                mensaje: "💀 ¡El estruendo de tu flecha enfureció al Wumpus! La bestia cargó contra tu caverna y te devoró."
            }));
            return;
        }

        if (flechasRestantes === 0) {
            setTemblorPantalla(true);
            gestorAudio.detenerAmbiente();
            gestorAudio.detenerLatidos();
            gestorAudio.reproducirArchivo("wumpus");
            registrarResultadoIA(false);

            setPartida(prev => ({
                ...prev,
                flechas: 0,
                wumpus: nuevoWumpus,
                vivo: false,
                causaMuerte: "sin_flechas",
                mensaje: "💀 ¡Disparaste tu última flecha y erraste! En la oscuridad y desarmado, el Wumpus te cazó."
            }));
            return;
        }

        const partidaActualizada = {
            ...partida,
            flechas: flechasRestantes,
            wumpus: nuevoWumpus,
            mensaje: wumpusSeMovio
                ? "🏹 ¡La flecha rebotó contra la roca! El eco alertó al Wumpus y escuchas pasos pesados moviéndose..."
                : "🏹 ¡Fallaste el tiro! Tu flecha se partió contra las estalagmitas."
        };
        setPartida(partidaActualizada);
        setMemoriaIA(prevMem =>
            actualizarMemoriaDisparo(prevMem, {
                destino,
                wumpusSeMovio,
                posicionActual: partida.jugador,
                pistas: obtenerPistas(partidaActualizada)
            })
        );
    }, [partida, registrarResultadoIA]);

    // =========================================
    // BUCLE DE JUEGO AUTOMÁTICO DE LA IA
    // =========================================
    useEffect(() => {
        if (enInicio || !iaActiva || !partida.vivo || partida.gano) return;

        const delay = VELOCIDADES_IA[velocidadIA] || 550;
        const timer = setTimeout(() => {
            const decision = decidirAccionIA(partida, memoriaIA);
            if (!decision) return;

            setUltimaRazonIA(decision.razon);
            setMetaIA(decision.meta || decision.objetivo);
            setHabitacionSeleccionada(decision.objetivo);

            if (decision.tipo === "mover") {
                moverJugador(decision.objetivo);
            } else if (decision.tipo === "disparar") {
                disparar(decision.objetivo);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [enInicio, iaActiva, velocidadIA, partida, memoriaIA, moverJugador, disparar]);

    // =========================================
    // CONTROLES DE TECLADO
    // =========================================
    useEffect(() => {
        if (enInicio) return;

        const manejarTeclado = (e) => {
            const key = e.key.toLowerCase();

            if (!iaActiva && key === "m" && habitacionSeleccionada) {
                moverJugador(habitacionSeleccionada);
            }
            if (!iaActiva && (key === "d" || key === "f") && habitacionSeleccionada) {
                disparar(habitacionSeleccionada);
            }
            if (key === "escape") {
                setHabitacionSeleccionada(null);
            }
            if (key === "r" || key === "n") {
                if (e.ctrlKey) return;
                reiniciar();
            }
        };

        window.addEventListener("keydown", manejarTeclado);
        return () => window.removeEventListener("keydown", manejarTeclado);
    }, [enInicio, iaActiva, habitacionSeleccionada, moverJugador, disparar, reiniciar]);

    // =========================================
    // CONEXIONES VISUALES
    // =========================================
    const conexiones = useMemo(() => {
        const list = [];
        Object.entries(grafo).forEach(([origen, destinos]) => {
            destinos.forEach(destino => {
                if (Number(origen) < destino) {
                    list.push({ origen: Number(origen), destino });
                }
            });
        });
        return list;
    }, []);

    // =========================================
    // COORDENADAS MODO DEV
    // =========================================
    const obtenerCoordenadasMapa = (event) => {
        const mapa = event.currentTarget;
        const rect = mapa.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        const xRedondeado = Number(x.toFixed(2));
        const yRedondeado = Number(y.toFixed(2));

        setCoordenadas({ x: xRedondeado, y: yRedondeado });
        setPuntoSeleccionado({ x: xRedondeado, y: yRedondeado });
    };

    // =========================================
    // CONTROLES DE SONIDO
    // =========================================
    const toggleSilencio = () => {
        const nuevoEstado = !silenciado;
        setSilenciado(nuevoEstado);
        gestorAudio.establecerSilenciado(nuevoEstado);
    };

    const cambiarVolumenMusica = (vol) => {
        setVolumenMusica(vol);
        gestorAudio.establecerVolumenMusica(vol);
    };

    const cambiarVolumenEfectos = (vol) => {
        setVolumenEfectos(vol);
        gestorAudio.establecerVolumenEfectos(vol);
    };

    const toggleIA = () => {
        gestorAudio.obtenerContexto();
        gestorAudio.iniciarAmbiente();
        setIaActiva(prev => !prev);
    };

    // =========================================
    // RENDER: PANTALLA DE INICIO
    // =========================================
    if (enInicio) {
        return (
            <PantallaInicio
                onIniciarJuego={iniciarJuego}
                silenciado={silenciado}
                onToggleSilencio={toggleSilencio}
            />
        );
    }

    // =========================================
    // RENDER: JUEGO ACTIVO
    // =========================================
    return (
        <div className="app">
            <EfectosHorror
                hayWumpusCerca={hayWumpusCerca}
                hayPozoCerca={hayPozoCerca}
                hayMurcielagoCerca={hayMurcielagoCerca}
                temblorPantalla={temblorPantalla}
            />

            {/* Encabezado del juego */}
            <header className="cabecera-juego">
                <div className="cabecera-info">
                    <h1 className="titulo-app">
                        🏹 CAZA AL WUMPUS
                    </h1>
                    <p className="subtitulo-app">
                        Adéntrate en el laberinto subterráneo, siente las corrientes y da caza a la bestia.
                    </p>
                </div>

                <div className="cabecera-acciones">
                    <button
                        id="btn-toggle-ia-cabecera"
                        className={`boton-ia-cabecera ${iaActiva ? "activa" : ""}`}
                        onClick={toggleIA}
                        title={iaActiva ? "Pausar Cazador Automático (IA)" : "Activar Cazador Automático (IA)"}
                    >
                        <Bot size={16} />
                        <span>{iaActiva ? "IA: ACTIVA" : "Auto-Juego IA"}</span>
                    </button>
                    <button
                        id="btn-volver-menu-cabecera"
                        className="boton-menu-cabecera"
                        onClick={volverAlMenu}
                        title="Volver a la portada principal y cambiar dificultad"
                    >
                        <Home size={16} />
                        <span>Menú Principal</span>
                    </button>
                    <button
                        className={`boton-dev ${modoDesarrollador ? "activo" : ""}`}
                        onClick={() => setModoDesarrollador(!modoDesarrollador)}
                        title="Activar vista de desarrollo y calibración de coordenadas"
                    >
                        {modoDesarrollador ? "🔧 Ocultar Modo Dev" : "🔧 Modo Desarrollador"}
                    </button>
                </div>
            </header>

            {/* Área de juego principal */}
            <main className="area-juego">
                <section className="mapa-seccion">
                    <MapaCaverna
                        posiciones={posiciones}
                        conexiones={conexiones}
                        partida={partida}
                        vecinos={vecinos}
                        habitacionSeleccionada={habitacionSeleccionada}
                        onSeleccionarHabitacion={setHabitacionSeleccionada}
                        modoDesarrollador={modoDesarrollador}
                        puntoSeleccionado={puntoSeleccionado}
                        onObtenerCoordenadasMapa={obtenerCoordenadasMapa}
                        flechaAnimada={flechaAnimada}
                        nieblaActiva={nieblaActiva}
                        onToggleNiebla={() => setNieblaActiva(!nieblaActiva)}
                        iaActiva={iaActiva}
                        mostrarAnalisisIA={mostrarAnalisisIA}
                        onToggleAnalisisIA={() => setMostrarAnalisisIA(!mostrarAnalisisIA)}
                        probsIA={probsIA}
                        metaIA={metaIA}
                    />
                </section>

                <PanelControl
                    partida={partida}
                    vecinos={vecinos}
                    pistas={pistas}
                    habitacionSeleccionada={habitacionSeleccionada}
                    onMover={moverJugador}
                    onDisparar={disparar}
                    onReiniciar={reiniciar}
                    onVolverMenu={volverAlMenu}
                    modoDesarrollador={modoDesarrollador}
                    coordenadas={coordenadas}
                    puntoSeleccionado={puntoSeleccionado}
                    onSeleccionarHabitacion={setHabitacionSeleccionada}
                    posiciones={posiciones}
                    silenciado={silenciado}
                    onToggleSilencio={toggleSilencio}
                    volumenMusica={volumenMusica}
                    onCambiarVolumenMusica={cambiarVolumenMusica}
                    volumenEfectos={volumenEfectos}
                    onCambiarVolumenEfectos={cambiarVolumenEfectos}
                    iaActiva={iaActiva}
                    onToggleIA={toggleIA}
                    velocidadIA={velocidadIA}
                    onCambiarVelocidadIA={setVelocidadIA}
                    ultimaRazonIA={ultimaRazonIA}
                    statsIA={statsIA}
                />
            </main>

            {/* Modal de Victoria o Muerte */}
            <ModalGameOver
                partida={partida}
                onReiniciar={reiniciar}
                onVolverMenu={volverAlMenu}
                iaActiva={iaActiva}
                onToggleIA={toggleIA}
            />

            {/* Pie de página con créditos */}
            <footer className="pie-pagina">
                <p>
                    Adaptación del clásico Caza al Wumpus • 15 Cavernas conectadas en Grafo • Desarrollado por Angel Gael Garcia Ramos, Valeria Martin Llamas y Maricarmen Hernandez Gomez
                </p>
            </footer>
        </div>
    );
}

export default App;
