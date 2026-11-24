// Aviso de versión nueva (un cartel arriba, sin tapar el juego):
//   - APP (Android): le pregunta a GOOGLE PLAY si hay una versión más nueva ya publicada (plugin
//     @capawesome/capacitor-app-update). "Actualizar" la baja dentro de la app si Google lo permite; si no,
//     abre Play Store. Se pregunta a Play y no a la página porque Play tarda en aprobar cada versión:
//     así nunca se avisa de una versión que todavía no se puede bajar.
//   - PÁGINA (trakio.pro): cada archivo lleva "?v=<versión>" (scripts/copiar-web.mjs). Cada CADA_MS se mira
//     el index.html publicado; si su versión es otra, subieron una nueva: "Recargar".
// "Después" lo esconde hasta la próxima vez que se abra el juego (en la página, hasta otra versión nueva).

const CADA_MS = 10 * 60 * 1000;
const ACTUALIZACION_DISPONIBLE = 2; // (AppUpdateAvailability.UPDATE_AVAILABLE)

const nativo = () => !!globalThis.Capacitor?.isNativePlatform?.();
// la versión de este juego (la marca del import de este archivo); sin marca (desarrollo): no se revisa
const MIA = new URL(import.meta.url).searchParams.get('v');

let cartel = null;
function avisar(texto, boton, accion) {
    if (cartel) return;
    cartel = document.createElement('div');
    cartel.className = 'aviso-version';
    cartel.setAttribute('role', 'status');
    cartel.innerHTML = `<span class="aviso-version-icono" aria-hidden="true">🆕</span><span class="aviso-version-texto"></span>
        <button type="button" class="aviso-version-si"></button><button type="button" class="aviso-version-no" aria-label="Después">✕</button>`;
    cartel.querySelector('.aviso-version-texto').textContent = texto;
    cartel.querySelector('.aviso-version-si').textContent = boton;
    cartel.querySelector('.aviso-version-si').addEventListener('click', accion);
    cartel.querySelector('.aviso-version-no').addEventListener('click', () => { cartel.remove(); cartel = null; });
    cartel.addEventListener('keydown', e => e.stopPropagation());
    (document.getElementById('game') || document.body).append(cartel);
}

async function revisarApp() {
    const AppUpdate = globalThis.Capacitor?.Plugins?.AppUpdate;
    if (!AppUpdate) return;
    try {
        const info = await AppUpdate.getAppUpdateInfo();
        if (info.updateAvailability !== ACTUALIZACION_DISPONIBLE) return;
        avisar('¡Hay una versión nueva del juego!', 'Actualizar', async () => {
            try {
                if (info.immediateUpdateAllowed) await AppUpdate.performImmediateUpdate();
                else await AppUpdate.openAppStore();
            } catch (_e) {
                try { await AppUpdate.openAppStore(); } catch (_e2) { /* sin Play Store */ }
            }
        });
    } catch (_e) { /* sin Google Play (o instalada fuera de la tienda: el APK) */ }
}

let vistaWeb = null; // la versión nueva que ya se avisó (para no repetir el mismo aviso)
async function revisarWeb() {
    if (!MIA || document.hidden) return;
    try {
        const r = await fetch(`index.html?t=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) return;
        const otra = (await r.text()).match(/game\.js\?v=([\w-]+)/)?.[1];
        if (!otra || otra === MIA || otra === vistaWeb) return;
        vistaWeb = otra;
        avisar('Hay una versión nueva del juego', 'Recargar', () => location.reload());
    } catch (_e) { /* sin conexión */ }
}

export function iniciarAvisoVersion() {
    if (nativo()) {
        setTimeout(revisarApp, 2500); // (después de cargar: no se mezcla con la pantalla de carga)
        return;
    }
    if (!MIA) return;
    setInterval(revisarWeb, CADA_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) revisarWeb(); });
}
