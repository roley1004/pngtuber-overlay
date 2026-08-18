# Proyecto PNGTuber Interactivo (OBS + Twitch)

Aplicación web ligera para streamers que funciona como un avatar reactivo a la voz y al chat de Twitch, diseñado para ejecutarse nativamente en la Fuente de Navegador (Browser Source) de OBS con latencia y consumo de recursos mínimos.

## 🛠️ Tecnologías Clave
* **React + Vite:** Motor principal de la interfaz y la lógica.
* **obs-websocket-js:** Conexión local en tiempo real con OBS (puerto 4455).
* **tmi.js:** Conexión al chat de Twitch en tiempo real (sin autenticación requerida).

## 🧩 Arquitectura de Componentes (`src/components/`)
* `App.jsx`: Maneja el estado global, el LocalStorage y decide qué modo mostrar.
* `Avatar.jsx`: Renderiza la imagen actual (idle, talk, blink) y la física del salto al hablar.
* `TwitchChat.jsx`: Conexión aislada a tmi.js; dibuja las burbujas flotantes temporales.
* `SettingsPanel.jsx`: Interfaz de usuario, autodescubrimiento de micrófonos, sensibilidad y generador de URL.

## ⚙️ Sistema de Modos (Detección por URL)
La aplicación lee los parámetros de la URL (`window.location.search`) para cambiar su comportamiento:
1. **Modo Configuración:** Entrar a la URL principal sin parámetros te permite ajustar micrófonos, imágenes y generar tu enlace personalizado.
2. **Modo Overlay (OBS):** Agregar `?canal=tu_usuario` a la URL oculta toda la interfaz para usarse directamente como Fuente de Navegador en OBS.