// Variables globales
let currentMessage = null;          // Referencia al mensaje actualmente visible
let isJumping = false;              // Estado para evitar saltos simultáneos
let currentMessageIndex = 0;        // Índice del mensaje a mostrar
let messages = [];                  // Array con los mensajes cargados desde JSON

// Elementos del DOM
const jumpBtn = document.getElementById('jumpBtn');   // Botón que dispara el salto
const personaje = document.getElementById('personaje'); // Contenedor del sprite del personaje
const block = document.getElementById('block');       // Bloque con interrogación a golpear

// Cargar propuestas desde JSON
async function loadMessages() {
    try {
        const response = await fetch('assets/data/propuestas.json'); // Solicita el JSON con las propuestas
        if (!response.ok) {
            throw new Error('Error al cargar las propuestas');        // Lanza error si el HTTP no es 200-299
        }
        messages = await response.json();                             // Parsea el JSON recibido
    } catch (error) {
        console.error('Error cargando propuestas:', error);
        // Mensaje de fallback en caso de error de carga o parseo
        messages = [{
            title: "Error",
            content: ["No se pudieron cargar las propuestas. Por favor, recarga la página."]
        }];
    }
}

// Obtener siguiente mensaje
function getNextMessage() {
    if (messages.length === 0) {
        return null;                                // No hay mensajes para mostrar
    }
    const message = messages[currentMessageIndex];  // Obtiene el mensaje actual
    currentMessageIndex = (currentMessageIndex + 1) % messages.length; // Avanza circularmente
    return message;
}

// Crear y reproducir sonido de salto
function createJumpSound() {
    try {
        const audio = new Audio('sounds/coin.mp3');                 // Crea un objeto de audio (ruta puede configurarse)
        audio.volume = 0.5;                        // Volumen moderado
        audio.play().catch(error => {              // Intenta reproducir (puede fallar en navegadores por políticas)
            console.log('Error al reproducir sonido de salto:', error);
        });
    } catch (e) {
        console.log('Audio no disponible:', e);
    }
}

// Crear y reproducir sonido de moneda
function createHitSound() {
    try {
        const audio = new Audio('sounds/pikachu.mp3'); // Sonido de impacto/moneda
        audio.volume = 0.5;
        audio.play().catch(error => {                // Maneja posibles bloqueos de reproducción
            console.log('Error al reproducir sonido de moneda:', error);
        });
    } catch (e) {
        console.log('Audio no disponible:', e);
    }
}

// Manejar el salto del personaje
function handleJump() {
    if (isJumping || messages.length === 0) return; // Evita reentradas o saltar sin mensajes
    
    if (!personaje) return;                         // Seguridad: si no existe el nodo, no hace nada

    isJumping = true;                                // Marca estado de salto
    personaje.classList.add('jumping');              // Activa sprite de salto (CSS)
    
    createJumpSound();                               // Reproduce sonido de salto

    setTimeout(() => {                               // Simula tiempo hasta golpear el bloque
        hitBlock();
    }, 400);

    setTimeout(() => {                               // Vuelta al estado de reposo
        personaje.classList.remove('jumping');
        isJumping = false;
    }, 800);
}

// Efecto de golpe al bloque
function hitBlock() {
    block.classList.add('hit');          // Anima el bloque como si fuera golpeado
    createHitSound();                    // Reproduce sonido de impacto
    
    const nextMessage = getNextMessage();
    if (nextMessage) {
        showMessage(nextMessage);        // Muestra mensaje emergente
    }

    setTimeout(() => {
        block.classList.remove('hit');   // Restituye el estado del bloque
    }, 500);
}

// Mostrar mensaje emergente
function showMessage(messageData) {
    if (currentMessage) {
        currentMessage.remove();                        // Cierra el mensaje anterior si existe
    }
    
    const messageDiv = document.createElement('div');   // Crea el contenedor del mensaje
    messageDiv.className = 'message';                   // Aplica estilos de tarjeta
    
    let contentHTML = '<h3>' + escapeHtml(messageData.title) + '</h3><ul>'; // Título
    messageData.content.forEach(item => {               // Lista de puntos
        contentHTML += '<li>' + escapeHtml(item) + '</li>';
    });
    contentHTML += '</ul>';
    contentHTML += '<button class="close-btn" onclick="closeMessage()">✕</button>'; // Botón cerrar
    
    messageDiv.innerHTML = contentHTML;                 // Inyecta HTML seguro
    document.getElementById('gameContainer').appendChild(messageDiv); // Agrega al DOM
    currentMessage = messageDiv;                        // Guarda referencia al actual
}

// Cerrar mensaje
window.closeMessage = function() {
    if (currentMessage) {
        currentMessage.remove();     // Quita el mensaje actual
        currentMessage = null;       // Limpia referencia
    }
};

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    // Mapea caracteres especiales a entidades HTML para prevenir XSS
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Inicializar aplicación
async function init() {
    await loadMessages();                                   // Primero carga los datos
    
    // Event listener para el botón de salto
    if (jumpBtn) {
        jumpBtn.addEventListener('click', handleJump);      // Click/tap dispara el salto
    }

    // Soporte para barra espaciadora
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !isJumping) {             // Evita spam de espacio
            e.preventDefault();
            handleJump();
        }
    });

    // Prevenir zoom en móviles al hacer doble tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {                    // Si fue un doble tap reciente
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Inicializar cuando el DOM esté listo
// Arranque de la app cuando el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);    // Espera a que cargue el DOM
} else {
    init();                                                 // Si ya cargó, inicia de inmediato
}

