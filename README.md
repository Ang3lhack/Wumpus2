# 🏹 Caza al Wumpus (Hunt the Wumpus)

> Una adaptación moderna, visual y atmosférica del legendario clásico de 1973 creado por Gregory Yob. Explora un laberinto subterráneo de 15 cavernas interconectadas mediante teoría de grafos, percibe las pistas sensoriales del entorno y da caza al temible Wumpus antes de caer en pozos o ser devorado.

---

## 👥 Desarrolladores del Proyecto
- **Angel Gael Garcia Ramos**
- **Valeria Martin Llamas**
- **Maricarmen Hernandez Gomez**

---

## 🎮 Características del Juego

- 🗺️ **Grafo de Cavernas Interactivo:** 15 cavernas conectadas como un grafo no dirigido con visualización de túneles, aristas y nodos explorables.
- 🌫️ **Niebla de Guerra y Antorcha Dinámica:** Cada caverna no visitada permanece oculta en la penumbra hasta que te adentras en ella, revelando conexiones con iluminación atmosférica.
- 👂 **Sistema Sensorial de Deducción:**
  - 🩸 **Hedor nauseabundo:** Advierte que el Wumpus está en una caverna vecina.
  - 💨 **Brisa gélida:** Indica la cercanía de un pozo sin fondo mortal.
  - 🦇 **Aleteo estridente:** Alerta sobre murciélagos gigantes que te transportarán a ciegas a otra sala.
- 🎯 **Mecánica de Tiro Táctico:** Dispara flechas mágicas a través de los túneles conectados. Si aciertas al Wumpus ganas; si fallas, la bestia puede moverse o puedes quedarte sin munición.
- 🔊 **Motor de Audio Híbrido (Web Audio API + Muestras de Sonido):**
  - Sintetizador procedimental de tonos binaurales, tensión harmónica en bucle infinito y silbidos de viento subterráneo sin cortes perceptibles.
  - Efectos sonoros posicionales para rugidos, pasos sobre piedra, caídas y victorias.
  - Controles independientes de volumen de música de tensión y efectos de sonido en tiempo real.
- 🤖 **Modo Juego Automático (IA Cazadora):** Agente inteligente integrado que explora el laberinto, deduce la posición exacta de peligros mediante inferencia bayesiana y dispara al Wumpus sin hacer trampa (solo usa las pistas sensoriales disponibles para un jugador humano).
  - **Velocidad ajustable:** Lenta, Normal y Rápida para observar cada razonamiento paso a paso.
  - **Superposición de Análisis IA en el mapa:** Visualiza en tiempo real las cavernas confirmadas como seguras (`✓`) y los porcentajes de riesgo (`👹`, `🕳️`, `🦇`).
  - **Bitácora de Deducción Táctica:** Explica en lenguaje natural por qué la IA decide moverse, triangular o disparar en cada turno.
- ⚙️ **Niveles de Dificultad Configurable:**
  - **Fácil:** 3 flechas doradas, 2 pozos, 2 colonias de murciélagos.
  - **Normal:** 2 flechas doradas, 2 pozos, 2 colonias de murciélagos.
  - **Pesadilla:** 1 flecha dorada, 2 pozos, 2 colonias de murciélagos (margen de error cero al disparar).
- 📖 **Pantalla de Inicio Narrativa:** Introducción retro estilo arcade con arte de personajes, diorama enfrentamiento y tutorial en 4 capítulos paginados con animación de máquina de escribir.
- 🔧 **Modo Desarrollador Integrado:** Herramienta para calibrar nodos sobre el mapa, ver entidades en tiempo real y probar mecánicas.

---

## 🛠️ Tecnologías y Librerías Utilizadas

| Tecnología | Versión | Propósito en el Proyecto |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | Biblioteca principal para el renderizado declarativo de la interfaz, componentes modulares y gestión del ciclo de vida del juego (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`). |
| **Vite** | `^8.2.2` | Entorno de desarrollo de última generación y empaquetador ultrarrápido con soporte ESM. |
| **JavaScript (ES6+)** | Moderno | Lógica de grafos, algoritmos de adyacencia, gestión de estados y motor de audio. |
| **Web Audio API** | Nativa del Navegador | Generación matemática de atmósferas continuas de terror mediante osciladores, moduladores de frecuencia y filtros de audio en tiempo real. |
| **CSS3 Avanzado** | Estándar | Variables CSS (`custom properties`), diseño adaptable a móviles y pantallas ultra-anchas, animaciones `@keyframes`, efectos de temblor de pantalla y viñetas de terror. |
| **Lucide React** | `^1.43.0` | Conjunto de iconos vectoriales consistentes y accesibles para los controles y estados del juego. |
| **Canvas Confetti** | `^1.9.4` | Animación de partículas de victoria al vencer a la bestia. |
| **ESLint** | `^10.9.0` | Análisis estático de código para garantizar buenas prácticas y calidad en React Hooks. |

---

## 📁 Estructura del Repositorio

```text
wumpus/
├── index.html                   # Punto de entrada HTML con fuentes retro y metadatos
├── package.json                 # Declaración de dependencias y scripts de ejecución
├── vite.config.js               # Configuración del entorno de compilación de Vite
├── eslint.config.js             # Reglas de linting y buenas prácticas
├── public/                      # Recursos públicos estáticos e iconos
└── src/
    ├── main.jsx                 # Inicialización y renderizado del árbol React en el DOM
    ├── App.jsx                  # Orquestador del juego, gestión de partidas y navegación
    ├── App.css                  # Hoja de estilos principal, diseño responsivo y efectos visuales
    ├── index.css                # Reseteo de estilos base globales
    ├── assets/                  # Sprites pixel art y pistas de audio de efectos
    │   ├── jugador.png          # Sprite del cazador
    │   ├── wumpus.png           # Sprite de la bestia
    │   ├── murcielago.png       # Sprite de murciélago gigante
    │   ├── pozo.png             # Sprite del abismo
    │   ├── mapa.jpg             # Textura base de la caverna rocosa
    │   └── *.mp3                # Efectos sonoros (gritos, brisas, chillidos, caídas)
    ├── components/              # Componentes visuales desacoplados
    │   ├── PantallaInicio.jsx   # Portada con selector de dificultad, narrativa y controles
    │   ├── MapaCaverna.jsx      # Canvas interactivo del grafo de cavernas y niebla
    │   ├── PanelControl.jsx     # Bitácora táctica, brújula, pistas, acciones y volumen
    │   ├── ModalGameOver.jsx    # Modal dinámico de victoria o causa de muerte
    │   └── EfectosHorror.jsx    # Capas de temblor, latidos y viñetas de alerta
    └── game/                    # Motor de lógica, IA y reglas del juego
        ├── mapa.js              # Definición de las 15 cavernas, adyacencias y coordenadas
        ├── juego.js             # Estados de partida, generación de entidades y pistas
        ├── ia.js                # Agente de IA (Inferencia Bayesiana + BFS/Dijkstra)
        └── audio.js             # Motor sintetizador continuo y gestor de efectos sonoros
```

---

## 🤖 Cómo Funciona la IA Cazadora Automática (`src/game/ia.js`)

El modo automático implementa un agente racional basado en **conocimiento parcial** (no consulta la ubicación secreta de las entidades). En cada turno, la IA observa únicamente las pistas sensoriales de su caverna actual (*hedor*, *brisa*, *aleteo*) y los resultados visibles de sus acciones para tomar decisiones óptimas:

### 1. Inferencia Bayesiana Exacta sobre el Grafo
- **Pozos (105 configuraciones posibles):** Al existir exactamente 2 pozos estáticos en el grafo de 15 salas ($\binom{15}{2} = 105$ pares), la IA mantiene el conjunto exacto de pares consistentes con todas las brisas observadas y calcula la probabilidad exacta $P(\text{Pozo en } x)$ para cada caverna.
- **Murciélagos (120 pares con modelo de reubicación):** Modela los pares posibles de murciélagos y, si es teletransportada tras entrar a una caverna con murciélagos, redistribuye la probabilidad del murciélago desplazado hacia las salas válidas de aterrizaje.
- **Wumpus (Filtro Bayesiano + Cadena de Markov):** Mantiene una distribución de probabilidad sobre las 15 cavernas. Si dispara y falla escuchando pasos pesados (75% de probabilidad de que el Wumpus se mueva a una sala adyacente), actualiza la distribución aplicando una matriz de transición sobre el grafo.
- **Exclusión Mutua:** Mientras el Wumpus no se haya desplazado, descarta de sus candidatos las cavernas ya confirmadas al 100% como pozos.

### 2. Planificación de Rutas y Toma de Decisiones
En cada turno, el motor `decidirAccionIA` sigue esta jerarquía táctica:
1. **Disparo Garantizado:** Si una caverna vecina tiene `100%` de certeza de contener al Wumpus, dispara inmediatamente para ganar.
2. **Aproximación Segura al Objetivo:** Si el Wumpus ya fue localizado con `100%` de certeza en otro sector del mapa, calcula mediante **BFS (Búsqueda en Anchura)** la ruta más corta usando exclusivamente salas 100% seguras para ponerse a tiro.
3. **Exploración y Triangulación Segura:** Busca salas no visitadas 100% seguras, priorizando aquellas que dividen el conjunto de candidatos del Wumpus para triangular su ubicación exacta en el menor número de pasos.
4. **Cálculo de Riesgo Mínimo (Dijkstra):** Cuando el mapa queda bloqueado por brisas o aleteos sin rutas 100% libres, utiliza el algoritmo de **Dijkstra** minimizando la probabilidad acumulada de muerte ($-\ln(1 - P(\text{Muerte}))$). Prefiere cruzar posibles zonas de murciélagos ($\sim 21\%$ de teletransporte mortal) antes que arriesgar un pozo ($100\%$ mortal), o realiza un disparo táctico si la probabilidad de acierto supera el riesgo de avanzar.

### 3. Desempeño Esperado y Cómo Activarlo
- **Resultados empíricos en simulación (6,000 partidas):**
  - **Fácil / Normal:** ~63% – 64% de victorias (prácticamente todas las derrotas restantes se deben a teletransportes directos de murciélagos hacia pozos/Wumpus o encierros inevitables de 50/50 al inicio).
  - **Pesadilla (1 sola flecha):** ~54% – 57% de victorias.
- **Cómo usar el modo automático:**
  - Desde la **Pantalla de Inicio**, haz clic en **`MODO IA AUTO`**.
  - Durante cualquier partida manual, puedes activar o pausar el agente en cualquier momento usando el botón **`Auto-Juego IA`** en la cabecera o **`ACTIVAR JUEGO AUTOMÁTICO`** en el panel lateral derecho, y ajustar su velocidad (*Lenta*, *Normal*, *Rápida*).

---

## 🚀 Guía Paso a Paso para Correr el Proyecto Localmente

Sigue estos sencillos pasos para clonar, instalar y ejecutar el juego en tu computadora:

### 1. Prerrequisitos
Asegúrate de tener instalado en tu sistema:
- **Node.js** (versión 18.0.0 o superior recomendada): [Descargar Node.js](https://nodejs.org/)
- **Git**: [Descargar Git](https://git-scm.com/)
- Un navegador web moderno (Google Chrome, Mozilla Firefox, Microsoft Edge o Safari) con soporte para Web Audio API.

Para comprobar si tienes Node.js y npm instalados, abre tu terminal y ejecuta:
```bash
node -v
npm -v
```

---

### 2. Clonar el Repositorio
Abre tu terminal o consola de comandos y clona el proyecto de GitHub:

```bash
git clone https://github.com/valeriamartin5203/wumpus.git
```

Entra al directorio del proyecto:
```bash
cd wumpus
```

---

### 3. Instalar las Dependencias
Descarga todos los paquetes necesarios especificados en el `package.json`:

```bash
npm install
```

---

### 4. Iniciar el Servidor de Desarrollo Local
Ejecuta el siguiente comando para levantar el servidor local de Vite:

```bash
npm run dev
```

La consola te mostrará una salida similar a esta:
```text
  VITE v8.2.2  ready in 180 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

Abre tu navegador e ingresa a:
👉 **`http://localhost:3000`** (o el puerto que te indique la terminal).

---

### 5. Comandos Adicionales Disponibles

- **Construir para Producción:**
  Compila y optimiza el proyecto para desplegarlo en cualquier hosting estático (Vercel, Netlify, GitHub Pages, Firebase):
  ```bash
  npm run build
  ```
  Los archivos listos para producción se generarán dentro de la carpeta `dist/`.

- **Probar la Versión de Producción Localmente:**
  Sirve los archivos generados en `dist/` para verificar su funcionamiento exacto:
  ```bash
  npm run preview
  ```

- **Verificar Calidad y Sintaxis de Código:**
  Ejecuta el linter de ESLint para asegurar que no existan errores de código:
  ```bash
  npm run lint
  ```

---

## 🎯 Reglas Básicas de Juego

1. **Objetivo:** Localizar y matar al Wumpus disparándole una de tus flechas doradas en la caverna correcta.
2. **Navegación:** Solo puedes moverte a cavernas que tengan un túnel directo conectado con la sala en la que te encuentras actualmente.
3. **Pistas:**
   - Si estás adyacente al Wumpus, percibirás un **Hedor repugnante**.
   - Si estás adyacente a un pozo, sentirás una **Brisa fría**.
   - Si estás adyacente a murciélagos gigantes, escucharás un **Aleteo**.
4. **Disparo:** Elige una caverna conectada adyacente y presiona **Lanzar Flecha**. Si el Wumpus está allí, ganas inmediatamente. Si no está allí, la flecha se perderá y podrías despertar a la bestia.
5. **Derrota:** Pierdes si entras a la caverna del Wumpus sin disparar, si caes en un pozo sin fondo o si agotas todas tus flechas sin abatir al monstruo.

---

## 📜 Licencia y Créditos
Inspirado en el clásico de dominio público *Hunt the Wumpus* (1973). Código y adaptaciones audiovisuales desarrollados con fines educativos y de entretenimiento.
