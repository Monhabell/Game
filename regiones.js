// Ambiente de cada región: cada nivel tiene su propia atmósfera, y los efectos fuertes
// (apagones, niebla densa) son MOMENTOS guionizados en un punto del nivel, no algo que
// se repite al azar todo el tiempo.
//
//   oscuridad:  qué tan oscuro está lejos del personaje (0 = nada, 1 = negro)
//   particulas: 'luciernagas' | 'brasas' | 'ceniza' | 'polvo' | 'lluvia'
//   niebla:     'suave' (fija y baja) | 'humo' (fija y algo más densa) | 'variable' (va y viene, nunca densa)
//   relampagos: [mínimo, máximo] ms entre relámpagos, o null
//   eventos:    momentos fuertes: { tipo: 'apagon' | 'niebla', en: fracción del nivel, dura: ms, texto }
//
// Reglas (ver ambiente.js): un evento por punto y por intento, al menos PAUSA_ENTRE_EVENTOS
// entre dos, nunca durante la pelea con el jefe ni en su antesala, y el apagón nunca es total.

export const PAUSA_ENTRE_EVENTOS = 40000; // ms
export const OSCURIDAD_MAXIMA = 0.9;      // ni en un apagón se deja de ver lo que hay cerca
export const LIBRE_ANTES_DEL_JEFE = 1700; // px antes de la meta sin eventos (arena + antesala)

export const REGIONES = [
    { nombre: 'Bosque', oscuridad: 0.55, particulas: 'luciernagas', niebla: 'suave', relampagos: null, eventos: [] },
    {
        nombre: 'Cueva de lava', oscuridad: 0.65, particulas: 'brasas', niebla: 'humo', relampagos: null,
        eventos: [{ tipo: 'niebla', en: 0.55, dura: 7000, texto: 'El humo de la lava lo cubre todo...' }],
    },
    { nombre: 'Puentes', oscuridad: 0.6, particulas: 'ceniza', niebla: 'variable', relampagos: [16000, 28000], eventos: [] },
    {
        nombre: 'Fortaleza', oscuridad: 0.72, particulas: 'polvo', niebla: 'suave', relampagos: null,
        eventos: [{ tipo: 'apagon', en: 0.45, dura: 8000, texto: 'Las antorchas se apagan...' }],
    },
    {
        nombre: 'Volcán', oscuridad: 0.7, particulas: 'brasas', niebla: 'humo', relampagos: null,
        eventos: [
            { tipo: 'niebla', en: 0.3, dura: 7000, texto: 'Una nube de ceniza...' },
            { tipo: 'niebla', en: 0.7, dura: 7000, texto: 'El volcán vuelve a rugir...' },
        ],
    },
    {
        nombre: 'Nubes', oscuridad: 0.7, particulas: 'lluvia', niebla: 'variable', relampagos: [9000, 16000],
        eventos: [{ tipo: 'apagon', en: 0.5, dura: 8000, texto: 'La tormenta tapa la luna...' }],
    },
    // (sin apagones: la penumbra la pone la caverna del nivel, ver abismo.js)
    { nombre: 'Ruinas del Abismo', oscuridad: 0.66, particulas: 'brasas', niebla: 'variable', relampagos: [14000, 24000], eventos: [] },
];

export function regionDe(indice) {
    return REGIONES[Math.min(indice, REGIONES.length - 1)];
}

// posición (x) de cada evento de la región en un nivel con esa meta
export function eventosDeRegion(region, meta) {
    return region.eventos.map(e => ({ ...e, x: Math.round(e.en * meta) }));
}
