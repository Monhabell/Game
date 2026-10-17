// Poderes especiales: 65 poderes que se ganan o se compran y cualquier héroe puede equipar.
//
// - Cada héroe lleva hasta 2 poderes equipados: teclas V y B (en el celular, dos botones redondos
//   sobre los de ataque). Los poderes son de la cuenta (se ganan una vez), pero cada héroe elige los suyos.
// - Se consiguen: comprándolos en la Tienda (pestaña Poderes) o como premio al terminar un nivel
//   (la primera vez que se termina un nivel el premio es seguro; al rejugarlo, a veces).
// - Rareza: común, raro, épico y legendario (más daño, efectos más grandes, más caros y más raros de ganar).
// - Niveles (1 a 5): un poder ganado se puede subir de nivel con monedas en la tienda (ver conNivel):
//   cada nivel baja la recarga y alarga efectos y alcance; nivel 3 = +1 de daño y un golpe más;
//   nivel 5 = otro +1 de daño y otro golpe más.
// - Ventajas: cada poder muestra en la tienda qué le da al jugador (daño, congela, atraviesa...): ventajas().
// - Efectos visuales: CraftPix "Free Flame / Water / Slash Effects" (assets/poderes, hojas reducidas
//   con el script de conversión; las "_b" son versiones blancas que el juego tiñe del color del poder).
//   Íconos: CraftPix "Free RPG Splash Game 512x512 Icons" (assets/poderes/iconos, reducidos a 96 px).
//   Hay 50 íconos: los poderes 51-65 reusan uno con otro tono (matiz: grados de hue-rotate, ver filtroIcono).
// - MEMORIA: solo se cargan los efectos de los poderes equipados (al entrar al nivel); los de los
//   demás jugadores en línea se cargan la primera vez que los usan.
//
// Contra el jefe un poder hace como mucho 2 de daño por golpe (la pelea se gana aprendiendo sus
// patrones, no con un solo poder).
//
// En la CARRERA los poderes de los rivales también te alcanzan: cada pantalla dibuja los poderes
// de los demás desde su fantasma y revisa si te tocaron (alcanzarme). El efecto lo decide
// carrera.js (empujón, aturdir, congelar, atraer: nunca quita vidas).
//
// api (la da game.js): { dañar(scene, e, daño, congela), golpearJefe(scene, zona, daño), congelar(scene, e, ms),
//   habilidadBase(scene, h), recuperarEscudo(scene), curarVida(scene), animarPoder(scene), mensaje(scene, texto),
//   golpeCarrera(scene, p, de, ox) }
// En la ARENA el golpe a un rival lleva el poder (api.dañar(..., p)): además del daño, le hace su
// efecto (congelar, explotar, ralentizar...: efectos.js), igual que en la carrera.

import { enLinea, enviarEvento } from "./red.js"

const CLAVE = 'troll-night-poderes';
const RUTA = 'assets/poderes';

// tamaño de cada hoja de efecto: [ancho del cuadro, alto, cuadros] (los genera el script de conversión)
const EFECTOS = {
    fuego1: [170, 167, 12], fuego2: [150, 136, 10], fuego3: [91, 110, 10], fuego4: [109, 130, 10], fuego5: [150, 101, 10],
    fuego7a: [140, 139, 8], fuego7b: [110, 72, 8], fuego7c: [100, 71, 8], fuego8: [119, 140, 10], fuego9: [170, 65, 10],
    fuego10: [110, 48, 8], agua1: [140, 64, 10], agua2: [140, 121, 10], agua3: [120, 108, 10], agua4: [160, 107, 10],
    agua5: [130, 117, 10], agua6: [160, 143, 8], agua7: [90, 60, 8], agua8: [100, 52, 8], agua9: [138, 160, 12],
    agua10: [120, 89, 8], corte1: [110, 108, 8], corte2: [66, 90, 8], corte3: [90, 70, 8], corte4: [140, 134, 8],
    corte5: [100, 110, 8], corte6: [120, 54, 8], corte7: [100, 77, 6], corte8: [62, 110, 8], corte9: [150, 41, 8],
    corte10: [110, 77, 8],
};
// cuadros que se repiten mientras el efecto dura (proyectiles, auras, trampas); sin dato: todos
const BUCLE = { fuego10: [0, 5], corte7: [0, 3], agua1: [2, 7], agua9: [4, 9], fuego5: [2, 9] };

export const RAREZAS = {
    comun: { nombre: 'Común', color: '#a7b0c4', precio: 50, peso: 60 },
    raro: { nombre: 'Raro', color: '#5aa9ff', precio: 100, peso: 28 },
    epico: { nombre: 'Épico', color: '#b77bff', precio: 180, peso: 10 },
    legendario: { nombre: 'Legendario', color: '#ffb347', precio: 300, peso: 2 },
};

const C = { fuego: 0xff7a3a, hielo: 0x9fe8ff, rayo: 0xfff06a, cian: 0x6fe8ff, verde: 0x7fe06a, arcano: 0xc77dff,
    rosa: 0xff7ad9, luz: 0xffe08a, tierra: 0xd09a5a, sombra: 0x8a5cff, sangre: 0xff4a4a, oro: 0xffc94a };

// icono: número de ícono · efecto: hoja (con tinte se usa la versión blanca teñida)
// tipos: proyectil, rafaga, meteoro, lluvia, explosion, frente, tajo, ola, trampa, aura, iman, escudo,
//        cura, impulso, salto, cadena, tormenta, tiempo, rayo
export const PODERES = [
    // ---------- comunes ----------
    { id: 'bola_fuego', icono: 14, nombre: 'Bola de fuego', rareza: 'comun', tipo: 'proyectil', efecto: 'fuego10', impacto: 'corte2', vel: 430, vida: 1200, daño: 2, enfriamiento: 2600, sonido: 'fuego', descripcion: 'Lanza una bola de fuego que estalla al tocar.' },
    { id: 'bola_agua', icono: 30, nombre: 'Bala de agua', rareza: 'comun', tipo: 'proyectil', efecto: 'agua8', impacto: 'agua10', vel: 480, vida: 1100, daño: 1, empuje: 260, enfriamiento: 2000, sonido: 'disparo', descripcion: 'Un chorro rápido que empuja a los enemigos.' },
    { id: 'garras_fuego', icono: 5, nombre: 'Garras de fuego', rareza: 'comun', tipo: 'tajo', efecto: 'corte4', alcance: 80, alto: 70, daño: 2, enfriamiento: 2400, sonido: 'espada', descripcion: 'Un zarpazo ardiente frente a ti.' },
    { id: 'explosion', icono: 3, nombre: 'Explosión', rareza: 'comun', tipo: 'explosion', efecto: 'fuego2', radio: 75, daño: 2, enfriamiento: 4000, sonido: 'romper', descripcion: 'Estalla a tu alrededor y golpea a todos cerca.' },
    { id: 'flecha_jade', icono: 27, nombre: 'Flecha de jade', rareza: 'comun', tipo: 'proyectil', efecto: 'fuego7b', tinte: C.verde, impacto: 'corte3', vel: 640, vida: 1000, daño: 1, perfora: true, enfriamiento: 2200, sonido: 'arco', descripcion: 'Una flecha mágica que atraviesa a todos.' },
    { id: 'cascada', icono: 42, nombre: 'Cascada', rareza: 'comun', tipo: 'frente', efecto: 'agua6', distancia: 90, ancho: 70, alto: 110, daño: 2, enfriamiento: 3200, sonido: 'aparece', descripcion: 'Un géiser brota del suelo delante de ti.' },
    { id: 'fogata', icono: 47, nombre: 'Muro de fuego', rareza: 'comun', tipo: 'trampa', efecto: 'fuego4', distancia: 50, ancho: 60, alto: 90, daño: 1, duracion: 3500, enfriamiento: 6000, sonido: 'fuego', descripcion: 'Deja una fogata que quema a quien la cruce.' },
    { id: 'paso_fantasma', icono: 11, nombre: 'Paso fantasma', rareza: 'comun', tipo: 'impulso', efecto: 'corte9', tinte: C.cian, duracion: 220, vel: 560, daño: 1, enfriamiento: 3000, sonido: 'salto', descripcion: 'Un dash veloz: atraviesas y golpeas a los enemigos.' },
    { id: 'garras_hielo', icono: 26, nombre: 'Garras de hielo', rareza: 'comun', tipo: 'tajo', efecto: 'corte4', tinte: C.hielo, alcance: 80, alto: 70, daño: 1, congela: 1500, enfriamiento: 2600, sonido: 'espada', descripcion: 'Un zarpazo helado que congela un momento.' },
    { id: 'charco_acido', icono: 31, nombre: 'Charco ácido', rareza: 'comun', tipo: 'trampa', efecto: 'fuego5', tinte: C.verde, distancia: 70, ancho: 110, alto: 50, daño: 1, duracion: 4000, enfriamiento: 6500, sonido: 'aparece', descripcion: 'Un charco venenoso que daña a quien lo pisa.' },
    { id: 'alas_luz', icono: 12, nombre: 'Alas de luz', rareza: 'comun', tipo: 'salto', efecto: 'agua4', tinte: C.rosa, fuerza: 560, radio: 60, daño: 1, enfriamiento: 3500, sonido: 'salto', descripcion: 'Un supersalto que golpea a quien esté a tus pies.' },
    { id: 'serpiente', icono: 7, nombre: 'Serpiente dorada', rareza: 'comun', tipo: 'proyectil', efecto: 'fuego10', tinte: C.oro, impacto: 'corte3', vel: 380, vida: 1500, onda: 26, daño: 2, enfriamiento: 2800, sonido: 'magia', descripcion: 'Avanza serpenteando: difícil de esquivar.' },
    { id: 'chispa', icono: 2, nombre: 'Chispa eléctrica', rareza: 'comun', tipo: 'cadena', efecto: 'fuego7a', tinte: C.cian, alcance: 230, saltos: 2, daño: 1, enfriamiento: 3000, sonido: 'rayo', descripcion: 'Un rayo que salta al enemigo cercano y a uno más.' },
    { id: 'latigo', icono: 40, nombre: 'Látigo de espinas', rareza: 'comun', tipo: 'tajo', efecto: 'corte6', tinte: C.verde, alcance: 130, alto: 50, daño: 1, enfriamiento: 2200, sonido: 'latigo', descripcion: 'Un latigazo largo: alcanza más lejos que tu arma.' },
    // ---------- raros ----------
    { id: 'llama_esmeralda', icono: 4, nombre: 'Llama esmeralda', rareza: 'raro', tipo: 'proyectil', efecto: 'fuego10', tinte: C.verde, impacto: 'fuego8', vel: 420, vida: 1300, daño: 3, enfriamiento: 3000, sonido: 'fuego', descripcion: 'Fuego verde que pega más fuerte que el normal.' },
    { id: 'cometa_arcano', icono: 1, nombre: 'Cometa arcano', rareza: 'raro', tipo: 'proyectil', efecto: 'corte7', tinte: C.rosa, impacto: 'fuego7a', escala: 1.2, vel: 560, vida: 1100, daño: 2, perfora: true, enfriamiento: 3000, sonido: 'magia', descripcion: 'Un cometa rosa que atraviesa la fila entera.' },
    { id: 'lanzas_hielo', icono: 17, nombre: 'Lanzas de hielo', rareza: 'raro', tipo: 'rafaga', efecto: 'fuego7b', tinte: C.hielo, impacto: 'corte3', cantidad: 3, vel: 560, vida: 900, daño: 1, congela: 1800, enfriamiento: 3600, sonido: 'arco', descripcion: 'Tres lanzas de hielo en abanico que congelan.' },
    { id: 'tajo_carmesi', icono: 23, nombre: 'Tajo carmesí', rareza: 'raro', tipo: 'tajo', efecto: 'corte1', escala: 1.4, alcance: 110, alto: 90, daño: 3, enfriamiento: 3000, sonido: 'espada', descripcion: 'Una media luna roja enorme frente a ti.' },
    { id: 'arco_voltaico', icono: 35, nombre: 'Arco voltaico', rareza: 'raro', tipo: 'tajo', efecto: 'corte5', tinte: C.cian, escala: 1.3, alcance: 100, alto: 90, daño: 2, aturde: 900, enfriamiento: 2800, sonido: 'rayo', descripcion: 'Un corte eléctrico que deja aturdidos a los enemigos.' },
    { id: 'doble_tajo', icono: 36, nombre: 'Doble tajo ígneo', rareza: 'raro', tipo: 'tajo', efecto: 'corte4', escala: 1.2, golpes: 2, alcance: 95, alto: 80, daño: 2, enfriamiento: 3400, sonido: 'espada', descripcion: 'Dos zarpazos de fuego seguidos.' },
    { id: 'golpe_sismico', icono: 39, nombre: 'Golpe sísmico', rareza: 'raro', tipo: 'frente', efecto: 'fuego9', tinte: C.tierra, distancia: 80, ancho: 150, alto: 50, daño: 2, aturde: 1200, temblor: true, enfriamiento: 4000, sonido: 'romper', descripcion: 'Golpeas el suelo: la onda aturde a todos delante.' },
    { id: 'rayo_celestial', icono: 6, nombre: 'Rayo celestial', rareza: 'raro', tipo: 'frente', efecto: 'fuego7a', tinte: C.cian, objetivo: true, distancia: 120, ancho: 60, alto: 140, daño: 3, enfriamiento: 3800, sonido: 'rayo', descripcion: 'Un rayo cae del cielo sobre el enemigo más cercano.' },
    { id: 'esfera_tormenta', icono: 13, nombre: 'Esfera de tormenta', rareza: 'raro', tipo: 'trampa', efecto: 'fuego8', tinte: C.cian, distancia: 60, ancho: 110, alto: 110, daño: 1, aturde: 500, duracion: 4000, enfriamiento: 7000, sonido: 'rayo', descripcion: 'Una esfera eléctrica que electrocuta todo a su alrededor.' },
    { id: 'muro_helado', icono: 15, nombre: 'Muro helado', rareza: 'raro', tipo: 'trampa', efecto: 'fuego4', tinte: C.hielo, distancia: 50, ancho: 60, alto: 100, daño: 1, congela: 2000, duracion: 4000, enfriamiento: 7000, sonido: 'magia', descripcion: 'Llamas heladas que congelan a quien las toque.' },
    { id: 'maremoto', icono: 32, nombre: 'Maremoto', rareza: 'raro', tipo: 'ola', efecto: 'agua2', vel: 300, vida: 1500, daño: 2, empuje: 300, enfriamiento: 4500, sonido: 'aparece', descripcion: 'Una ola que avanza por el suelo arrastrando enemigos.' },
    { id: 'grieta_lava', icono: 33, nombre: 'Grieta de lava', rareza: 'raro', tipo: 'ola', efecto: 'fuego5', vel: 260, vida: 1500, daño: 2, enfriamiento: 4500, sonido: 'fuego', descripcion: 'Fuego que corre por el suelo quemando todo.' },
    { id: 'burbuja', icono: 19, nombre: 'Burbuja protectora', rareza: 'raro', tipo: 'escudo', efecto: 'agua1', duracion: 3000, enfriamiento: 9000, sonido: 'magia', descripcion: 'Una burbuja de agua que para el próximo golpe (3 s).' },
    { id: 'viento_veloz', icono: 50, nombre: 'Viento veloz', rareza: 'raro', tipo: 'impulso', efecto: 'corte9', tinte: C.verde, duracion: 320, vel: 600, daño: 2, enfriamiento: 3500, sonido: 'salto', descripcion: 'Un dash largo de viento que corta a su paso.' },
    { id: 'estallido_igneo', icono: 41, nombre: 'Estallido ígneo', rareza: 'raro', tipo: 'explosion', efecto: 'corte10', escala: 1.5, radio: 90, daño: 2, enfriamiento: 4200, sonido: 'romper', descripcion: 'Una lluvia de chispas cortantes a tu alrededor.' },
    { id: 'tornado', icono: 46, nombre: 'Tornado', rareza: 'raro', tipo: 'ola', efecto: 'agua9', vel: 160, vida: 2400, daño: 1, alto: 120, empuje: 160, enfriamiento: 5000, sonido: 'aparece', descripcion: 'Un tornado lento que golpea varias veces.' },
    // ---------- épicos ----------
    { id: 'nova_arcana', icono: 8, nombre: 'Nova arcana', rareza: 'epico', tipo: 'explosion', efecto: 'fuego7a', tinte: C.arcano, escala: 1.4, radio: 120, daño: 3, enfriamiento: 6000, sonido: 'magia', descripcion: 'Una estrella de energía estalla alrededor tuyo.' },
    { id: 'fuego_azul', icono: 9, nombre: 'Fuego azul', rareza: 'epico', tipo: 'aura', efecto: 'fuego3', tinte: C.cian, radio: 70, daño: 1, duracion: 5000, enfriamiento: 10000, sonido: 'fuego', descripcion: 'Te envuelven llamas azules: quemas todo lo que se acerca (5 s).' },
    { id: 'torbellino_hojas', icono: 16, nombre: 'Torbellino de hojas', rareza: 'epico', tipo: 'aura', efecto: 'agua9', tinte: C.verde, radio: 80, daño: 1, empuje: 200, duracion: 4500, enfriamiento: 9000, sonido: 'aparece', descripcion: 'Un remolino que empuja y corta a los que se acercan.' },
    { id: 'vortice', icono: 18, nombre: 'Vórtice', rareza: 'epico', tipo: 'iman', efecto: 'agua1', tinte: C.rosa, distancia: 140, radio: 170, daño: 2, duracion: 1800, enfriamiento: 8000, sonido: 'magia', descripcion: 'Un remolino atrae a los enemigos y los aplasta.' },
    { id: 'rayo_vida', icono: 24, nombre: 'Rayo de vida', rareza: 'epico', tipo: 'rayo', efecto: 'fuego7c', tinte: C.verde, alcance: 360, daño: 3, enfriamiento: 5000, sonido: 'rayo', descripcion: 'Un rayo verde que atraviesa toda la pantalla.' },
    { id: 'lluvia_meteoros', icono: 25, nombre: 'Lluvia de meteoros', rareza: 'epico', tipo: 'lluvia', efecto: 'fuego10', impacto: 'fuego2', cantidad: 5, ancho: 320, daño: 2, enfriamiento: 9000, sonido: 'fuego', descripcion: 'Caen cinco meteoros delante de ti.' },
    { id: 'pilares_luz', icono: 37, nombre: 'Pilares de luz', rareza: 'epico', tipo: 'lluvia', efecto: 'fuego4', tinte: C.luz, enSuelo: true, cantidad: 4, ancho: 300, daño: 3, enfriamiento: 8000, sonido: 'magia', descripcion: 'Cuatro columnas de luz sagrada brotan del suelo.' },
    { id: 'meteoro', icono: 29, nombre: 'Meteoro', rareza: 'epico', tipo: 'meteoro', efecto: 'fuego10', impacto: 'fuego1', escala: 1.6, radio: 100, daño: 4, enfriamiento: 7000, sonido: 'fuego', descripcion: 'Un meteoro gigante cae y estalla delante de ti.' },
    { id: 'escarcha', icono: 34, nombre: 'Estallido de escarcha', rareza: 'epico', tipo: 'explosion', efecto: 'fuego7a', tinte: C.hielo, escala: 1.4, radio: 140, daño: 1, congela: 3000, enfriamiento: 8000, sonido: 'magia', descripcion: 'Congela a todos los enemigos cercanos 3 s.' },
    { id: 'terremoto', icono: 38, nombre: 'Terremoto', rareza: 'epico', tipo: 'frente', efecto: 'corte9', tinte: C.tierra, escala: 2.2, distancia: 0, ancho: 520, alto: 60, daño: 2, aturde: 1500, temblor: true, enfriamiento: 9000, sonido: 'romper', descripcion: 'La tierra tiembla: golpea a todos los que pisan el suelo.' },
    { id: 'escudo_arcano', icono: 43, nombre: 'Escudo arcano', rareza: 'epico', tipo: 'escudo', efecto: 'fuego8', tinte: C.cian, duracion: 5000, enfriamiento: 11000, sonido: 'magia', descripcion: 'Un escudo de energía que para el próximo golpe (5 s).' },
    { id: 'bendicion', icono: 44, nombre: 'Bendición del bosque', rareza: 'epico', tipo: 'cura', efecto: 'agua4', tinte: C.verde, enfriamiento: 25000, sonido: 'punto_control', descripcion: 'Recupera tu escudo al instante.' },
    { id: 'niebla_venenosa', icono: 21, nombre: 'Niebla venenosa', rareza: 'epico', tipo: 'trampa', efecto: 'agua9', tinte: C.sombra, distancia: 80, ancho: 140, alto: 130, daño: 1, duracion: 5000, enfriamiento: 9000, sonido: 'aparece', descripcion: 'Una nube morada que envenena a todos dentro.' },
    { id: 'llamarada', icono: 10, nombre: 'Llamarada solar', rareza: 'epico', tipo: 'explosion', efecto: 'fuego1', tinte: C.oro, escala: 1.2, radio: 130, daño: 3, enfriamiento: 7500, sonido: 'romper', descripcion: 'Una explosión de sol alrededor tuyo.' },
    // ---------- legendarios ----------
    { id: 'supernova', icono: 22, nombre: 'Supernova', rareza: 'legendario', tipo: 'explosion', efecto: 'fuego2', escala: 2.4, radio: 220, daño: 5, temblor: true, enfriamiento: 14000, sonido: 'romper', descripcion: 'Una explosión gigantesca: arrasa con casi todo en pantalla.' },
    { id: 'agujero_negro', icono: 28, nombre: 'Agujero negro', rareza: 'legendario', tipo: 'iman', efecto: 'agua1', tinte: C.sombra, escala: 1.6, distancia: 170, radio: 280, daño: 4, duracion: 2600, enfriamiento: 15000, sonido: 'magia', descripcion: 'Traga a los enemigos de media pantalla y los destruye.' },
    { id: 'tormenta', icono: 48, nombre: 'Tormenta', rareza: 'legendario', tipo: 'tormenta', efecto: 'fuego7a', tinte: C.rayo, cantidad: 6, alcance: 420, daño: 3, enfriamiento: 13000, sonido: 'rayo', descripcion: 'Rayos caen sobre hasta 6 enemigos a la vez.' },
    { id: 'detener_tiempo', icono: 49, nombre: 'Detener el tiempo', rareza: 'legendario', tipo: 'tiempo', efecto: 'fuego7a', tinte: C.rosa, escala: 2, alcance: 520, duracion: 4500, enfriamiento: 18000, sonido: 'magia', descripcion: 'Todos los enemigos en pantalla se congelan 4,5 s.' },
    { id: 'galaxia', icono: 45, nombre: 'Galaxia', rareza: 'legendario', tipo: 'aura', efecto: 'agua1', tinte: C.arcano, escala: 1.5, radio: 110, daño: 2, duracion: 6000, enfriamiento: 15000, sonido: 'magia', descripcion: 'Una galaxia gira a tu alrededor y destroza a quien se acerque (6 s).' },
    // ---------- nuevos (51-65): íconos de siempre con otro tono (matiz) ----------
    { id: 'piedra_runica', icono: 39, matiz: 160, nombre: 'Piedra rúnica', rareza: 'comun', tipo: 'proyectil', efecto: 'corte8', tinte: C.tierra, impacto: 'corte3', vel: 420, vida: 1100, daño: 2, aturde: 600, enfriamiento: 2700, sonido: 'romper', descripcion: 'Lanza una runa de piedra que aturde al tocar.' },
    { id: 'burbujas', icono: 30, matiz: 120, nombre: 'Lluvia de burbujas', rareza: 'comun', tipo: 'rafaga', efecto: 'agua7', impacto: 'agua10', cantidad: 3, vel: 400, vida: 900, daño: 1, empuje: 180, enfriamiento: 2800, sonido: 'disparo', descripcion: 'Tres burbujas en abanico que empujan.' },
    { id: 'copo_helado', icono: 26, matiz: 200, nombre: 'Copo helado', rareza: 'comun', tipo: 'proyectil', efecto: 'fuego7b', tinte: C.hielo, impacto: 'corte3', vel: 520, vida: 1000, daño: 1, congela: 1200, enfriamiento: 2600, sonido: 'arco', descripcion: 'Un copo de nieve veloz que congela.' },
    { id: 'telarana', icono: 40, matiz: 250, nombre: 'Telaraña', rareza: 'comun', tipo: 'trampa', efecto: 'corte8', tinte: 0xdddddd, distancia: 60, ancho: 90, alto: 60, daño: 1, duracion: 4000, enfriamiento: 6500, sonido: 'aparece', descripcion: 'Una red pegajosa: quien la pisa queda lento.' },
    { id: 'zarpazo_sombra', icono: 5, matiz: 230, nombre: 'Zarpazo de sombra', rareza: 'comun', tipo: 'tajo', efecto: 'corte4', tinte: C.sombra, alcance: 85, alto: 70, daño: 2, enfriamiento: 2500, sonido: 'espada', descripcion: 'Un zarpazo oscuro que confunde.' },
    { id: 'geiser_hirviente', icono: 42, matiz: 300, nombre: 'Géiser hirviente', rareza: 'raro', tipo: 'frente', efecto: 'agua3', distancia: 100, ancho: 70, alto: 130, daño: 2, empuje: 260, enfriamiento: 3600, sonido: 'aparece', descripcion: 'Un chorro hirviente que lanza por los aires.' },
    { id: 'bomba_humo', icono: 21, matiz: 90, nombre: 'Bomba de humo', rareza: 'raro', tipo: 'explosion', efecto: 'agua5', tinte: C.sombra, radio: 90, daño: 1, aturde: 700, enfriamiento: 5000, sonido: 'aparece', descripcion: 'Una nube de humo: los de cerca se confunden.' },
    { id: 'cadena_hielo', icono: 17, matiz: 140, nombre: 'Cadena de hielo', rareza: 'raro', tipo: 'cadena', efecto: 'fuego7a', tinte: C.hielo, alcance: 230, saltos: 2, daño: 1, congela: 1500, enfriamiento: 3800, sonido: 'rayo', descripcion: 'Un rayo helado que salta de uno a otro y congela.' },
    { id: 'sello_runico', icono: 8, matiz: 60, nombre: 'Sello rúnico', rareza: 'raro', tipo: 'trampa', efecto: 'fuego8', tinte: C.arcano, distancia: 60, ancho: 100, alto: 100, daño: 1, duracion: 4000, enfriamiento: 7000, sonido: 'magia', descripcion: 'Un sello mágico: bloquea los poderes de quien lo toque.' },
    { id: 'bumeran', icono: 36, matiz: 45, nombre: 'Bumerán dorado', rareza: 'raro', tipo: 'proyectil', efecto: 'corte7', tinte: C.oro, impacto: 'corte3', vel: 500, vida: 1200, daño: 2, perfora: true, aturde: 500, enfriamiento: 3000, sonido: 'latigo', descripcion: 'Una hoja dorada que atraviesa a todos y aturde.' },
    { id: 'avalancha', icono: 34, matiz: 180, nombre: 'Avalancha', rareza: 'epico', tipo: 'ola', efecto: 'agua2', tinte: C.hielo, vel: 280, vida: 1700, daño: 2, congela: 1500, empuje: 200, enfriamiento: 7000, sonido: 'aparece', descripcion: 'Una ola de nieve que congela todo a su paso.' },
    { id: 'columnas_fuego', icono: 47, matiz: 330, nombre: 'Columnas de fuego', rareza: 'epico', tipo: 'lluvia', efecto: 'fuego4', tinte: C.fuego, enSuelo: true, cantidad: 4, ancho: 300, daño: 3, enfriamiento: 8000, sonido: 'fuego', descripcion: 'Cuatro columnas de fuego brotan del suelo.' },
    { id: 'pantano', icono: 31, matiz: 60, nombre: 'Pantano', rareza: 'epico', tipo: 'trampa', efecto: 'agua9', tinte: 0x6a8a3a, distancia: 90, ancho: 160, alto: 90, daño: 1, duracion: 5500, enfriamiento: 9000, sonido: 'aparece', descripcion: 'Un pantano que atrapa y ralentiza a quien entra.' },
    { id: 'aliento_dragon', icono: 4, matiz: 300, nombre: 'Aliento de dragón', rareza: 'legendario', tipo: 'proyectil', efecto: 'fuego10', tinte: 0xff3a2a, impacto: 'fuego1', escala: 1.8, vel: 380, vida: 1600, daño: 5, perfora: true, enfriamiento: 13000, sonido: 'fuego', descripcion: 'El aliento de un dragón: arrasa una fila entera.' },
    { id: 'eclipse', icono: 22, matiz: 220, nombre: 'Eclipse', rareza: 'legendario', tipo: 'explosion', efecto: 'fuego7a', tinte: C.sombra, escala: 2.2, radio: 200, daño: 3, aturde: 2000, temblor: true, enfriamiento: 15000, sonido: 'magia', descripcion: 'La luna tapa el sol: aturde y apaga la magia de todos cerca.' },
    { id: 'renacer', icono: 20, nombre: 'Renacer del Alba', rareza: 'legendario', tipo: 'cura', vida: true, efecto: 'fuego1', tinte: C.luz, enfriamiento: 60000, sonido: 'punto_control', descripcion: 'Recupera un corazón y tu escudo (una vez por minuto).' },
];

export const poderPorId = id => PODERES.find(p => p.id === id);
export const urlIcono = p => `${RUTA}/iconos/${p.icono}.jpg`;
// los poderes 51-65 reusan un ícono con otro tono (CSS filter); '' en los demás
export const filtroIcono = p => (p?.matiz ? `hue-rotate(${p.matiz}deg) saturate(1.25)` : '');
const hexDe = n => '#' + n.toString(16).padStart(6, '0');
export const colorDe = p => p.tinte ? hexDe(p.tinte) : RAREZAS[p.rareza].color;

// ---------- guardado: poderes ganados y los equipados por cada héroe ----------
const INICIALES = ['bola_fuego', 'bola_agua']; // con estos se empieza (para que se entienda el sistema)
export const NIVEL_MAX = 5; // niveles de cada poder
function leer() {
    const e = { tiene: [...INICIALES], equipo: {}, niveles: {} };
    try {
        const g = JSON.parse(localStorage.getItem(CLAVE));
        if (Array.isArray(g?.tiene)) g.tiene.forEach(id => { if (poderPorId(id) && !e.tiene.includes(id)) e.tiene.push(id); });
        Object.entries(g?.equipo || {}).forEach(([pj, lista]) => {
            if (Array.isArray(lista)) e.equipo[pj] = [0, 1].map(i => (e.tiene.includes(lista[i]) ? lista[i] : null));
        });
        Object.entries(g?.niveles || {}).forEach(([id, n]) => {
            if (e.tiene.includes(id) && Number.isInteger(n) && n > 1) e.niveles[id] = Math.min(NIVEL_MAX, n);
        });
    } catch (_e) { /* guardado dañado: se empieza de nuevo */ }
    return e;
}
const estado = leer();
function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (_e) { /* sin almacenamiento */ }
}

export const tienePoder = id => estado.tiene.includes(id);
export const cuantosPoderes = () => estado.tiene.length;
// los 2 poderes equipados del héroe (por defecto, los iniciales)
export const equipados = pjId => estado.equipo[pjId] || [...INICIALES];

// ---------- niveles de los poderes ----------
export const nivelPoder = id => estado.niveles[id] || 1;
// monedas para subir al siguiente nivel (null si ya está al máximo)
export const costoSubir = p => {
    const n = nivelPoder(p.id);
    return n >= NIVEL_MAX ? null : Math.round(RAREZAS[p.rareza].precio * [0, 0.8, 1.5, 2.2, 3][n]);
};
// por nivel (1 a 5): recarga, duración de los efectos y alcance (multiplicadores)
const RECARGA = [1, 1, 0.85, 0.7, 0.62, 0.55];
const DURACION = [1, 1, 1.25, 1.5, 1.7, 1.9];
const ALCANCE = [1, 1, 1.1, 1.2, 1.27, 1.35];
export const queGana = n => ({
    2: '−15 % recarga, efectos +25 % más largos, +10 % de alcance',
    3: '+1 de daño, −30 % recarga, efectos +50 %, +20 % de alcance y un golpe más',
    4: '−38 % recarga, efectos +70 %, +27 % de alcance',
    5: '+2 de daño en total, −45 % recarga, efectos +90 %, +35 % de alcance y dos golpes más',
})[n] || '';
// (la tienda cobra las monedas y luego llama a esto)
export function subirPoder(id) {
    if (!tienePoder(id) || nivelPoder(id) >= NIVEL_MAX) return false;
    estado.niveles[id] = nivelPoder(id) + 1;
    guardar();
    return true;
}

// copia del poder con los valores de su nivel (el original de PODERES no se toca)
export function conNivel(p, n = nivelPoder(p.id)) {
    if (!p || n <= 1) return p;
    const q = { ...p, nivel: n };
    q.enfriamiento = Math.round(p.enfriamiento * RECARGA[n]);
    ['congela', 'aturde', 'duracion'].forEach(k => {
        if (p[k] && p.tipo !== 'impulso') q[k] = Math.round(p[k] * DURACION[n]); // (el dash no se alarga)
    });
    ['radio', 'alcance', 'ancho'].forEach(k => { if (p[k]) q[k] = Math.round(p[k] * ALCANCE[n]); });
    // +1 en el nivel 3 y otro +1 en el 5
    const extra = n >= 5 ? 2 : n >= 3 ? 1 : 0;
    if (extra) {
        if (p.daño) q.daño = p.daño + extra;
        if (p.cantidad) q.cantidad = p.cantidad + extra;
        if (p.saltos) q.saltos = p.saltos + extra;
        if (p.golpes) q.golpes = p.golpes + extra;
    }
    return q;
}

// ---------- en la carrera: qué le hace cada poder a un rival (carrera.js lo aplica) ----------
// Efectos (nunca quitan vidas; duran más cuanto más raro es el poder, ver carrera.js):
//   aturdir    estrellas sobre la cabeza: no se mueve, no salta ni ataca
//   congelar   encerrado en un bloque de hielo: no se mueve
//   ralentizar corre a la mitad y salta menos
//   explotar   ¡BOOM!: sale volando hacia atrás y queda aturdido un momento
//   empujar    lo arrastra hacia atrás (la ola, el viento)
//   confundir  izquierda y derecha invertidas
//   bloquear   no puede usar ataques ni poderes (sí correr y saltar)
//   atraer     el vórtice lo jala hacia su centro
export const EFECTOS_CARRERA = {
    aturdir: { icono: '💫', nombre: 'Aturde', texto: 'TE ATURDIÓ' },
    congelar: { icono: '❄', nombre: 'Congela', texto: 'TE CONGELÓ' },
    ralentizar: { icono: '🐌', nombre: 'Ralentiza', texto: 'TE PUSO LENTO' },
    explotar: { icono: '💥', nombre: 'Explota', texto: 'TE HIZO VOLAR' },
    empujar: { icono: '🌊', nombre: 'Empuja', texto: 'TE EMPUJÓ' },
    confundir: { icono: '🌀', nombre: 'Confunde', texto: 'TE CONFUNDIÓ' },
    bloquear: { icono: '🚫', nombre: 'Bloquea poderes', texto: 'TE BLOQUEÓ' },
    atraer: { icono: '🧲', nombre: 'Atrae', texto: 'TE ATRAPÓ' },
};
const EFECTO_DE = {
    bola_fuego: 'explotar', bola_agua: 'empujar', garras_fuego: 'explotar', explosion: 'explotar', flecha_jade: 'ralentizar',
    cascada: 'explotar', fogata: 'explotar', paso_fantasma: 'empujar', garras_hielo: 'congelar', charco_acido: 'ralentizar',
    alas_luz: 'aturdir', serpiente: 'confundir', chispa: 'aturdir', latigo: 'ralentizar',
    llama_esmeralda: 'explotar', cometa_arcano: 'confundir', lanzas_hielo: 'congelar', tajo_carmesi: 'bloquear',
    arco_voltaico: 'aturdir', doble_tajo: 'explotar', golpe_sismico: 'aturdir', rayo_celestial: 'aturdir',
    esfera_tormenta: 'aturdir', muro_helado: 'congelar', maremoto: 'empujar', grieta_lava: 'explotar',
    viento_veloz: 'empujar', estallido_igneo: 'explotar', tornado: 'empujar',
    nova_arcana: 'bloquear', fuego_azul: 'explotar', torbellino_hojas: 'empujar', vortice: 'atraer', rayo_vida: 'ralentizar',
    lluvia_meteoros: 'explotar', pilares_luz: 'aturdir', meteoro: 'explotar', escarcha: 'congelar', terremoto: 'aturdir',
    niebla_venenosa: 'confundir', llamarada: 'explotar',
    supernova: 'explotar', agujero_negro: 'atraer', tormenta: 'aturdir', detener_tiempo: 'congelar', galaxia: 'confundir',
    piedra_runica: 'aturdir', burbujas: 'empujar', copo_helado: 'congelar', telarana: 'ralentizar', zarpazo_sombra: 'confundir',
    geiser_hirviente: 'explotar', bomba_humo: 'confundir', cadena_hielo: 'congelar', sello_runico: 'bloquear', bumeran: 'aturdir',
    avalancha: 'congelar', columnas_fuego: 'explotar', pantano: 'ralentizar', aliento_dragon: 'explotar', eclipse: 'bloquear',
};
// (los poderes nuevos sin entrada: según lo que hacen)
export function efectoEnCarrera(p) {
    if (!p || p.tipo === 'escudo' || p.tipo === 'cura') return null;
    return EFECTO_DE[p.id] || (p.congela || p.tipo === 'tiempo' ? 'congelar' : p.aturde ? 'aturdir' : p.tipo === 'iman' ? 'atraer'
        : p.empuje ? 'empujar' : p.tipo === 'explosion' || p.tipo === 'meteoro' ? 'explotar' : 'aturdir');
}

// ventajas que da el poder (para la tienda): [ícono, texto]
const seg = ms => `${(ms / 1000).toLocaleString('es', { maximumFractionDigits: 1 })} s`;
export function ventajas(p) {
    const v = [];
    const golpes = p.golpes || (p.tipo === 'lluvia' || p.tipo === 'rafaga' ? p.cantidad : 0);
    if (p.daño) v.push(['⚔', `Daño ${p.daño}${golpes ? ` × ${golpes}` : ''}`]);
    if (p.congela) v.push(['❄', `Congela ${seg(p.congela)}`]);
    if (p.aturde) v.push(['✦', `Aturde ${seg(p.aturde)}`]);
    if (p.tipo === 'tiempo') v.push(['⏸', `Congela a todos ${seg(p.duracion)}`]);
    if (p.perfora || p.tipo === 'ola' || p.tipo === 'rayo') v.push(['⇶', 'Atraviesa']);
    if (p.empuje) v.push(['⇢', 'Empuja']);
    if (p.tipo === 'iman') v.push(['🌀', 'Atrae enemigos']);
    if (p.tipo === 'cadena') v.push(['ϟ', `Salta a ${p.saltos + 1} enemigos`]);
    if (p.tipo === 'tormenta') v.push(['ϟ', `Hasta ${p.cantidad} enemigos`]);
    if (p.objetivo) v.push(['◎', 'Apunta solo']);
    if (p.radio && p.tipo !== 'salto') v.push(['◯', `Área ${p.radio}`]);
    if (p.tipo === 'trampa' || p.tipo === 'aura') v.push(['⏱', `Dura ${seg(p.duracion)}`]);
    if (p.tipo === 'escudo') v.push(['🛡', `Para un golpe (${seg(p.duracion)})`]);
    if (p.tipo === 'cura') v.push(['❤', p.vida ? '+1 corazón y escudo' : 'Recupera el escudo']);
    if (p.tipo === 'impulso') v.push(['➜', 'Dash: esquiva golpes']);
    if (p.tipo === 'salto') v.push(['⤒', 'Supersalto']);
    if (p.temblor) v.push(['≋', 'Sacude la pantalla']);
    const enCarrera = EFECTOS_CARRERA[efectoEnCarrera(p)];
    if (enCarrera) v.push([enCarrera.icono, `Carrera: ${enCarrera.nombre.toLowerCase()} al rival`]);
    v.push(['⟳', `Recarga ${seg(p.enfriamiento)}`]);
    return v;
}

export function darPoder(id) {
    if (!poderPorId(id) || tienePoder(id)) return false;
    estado.tiene.push(id);
    guardar();
    return true;
}

// equipar en la ranura 0 (V) o 1 (B) del héroe; si ya estaba en la otra, se cambian de lugar
export function equiparPoder(pjId, id, ranura) {
    if (!tienePoder(id)) return;
    const lista = [...equipados(pjId)];
    const otra = 1 - ranura;
    if (lista[otra] === id) lista[otra] = lista[ranura];
    lista[ranura] = lista[ranura] === id ? null : id;
    estado.equipo[pjId] = lista;
    guardar();
}

// premio al terminar un nivel: seguro la primera vez; al rejugar, 35 % de las veces
export function premioDeNivel(primeraVez) {
    const faltan = PODERES.filter(p => !tienePoder(p.id));
    if (!faltan.length || (!primeraVez && Math.random() > 0.35)) return null;
    const total = faltan.reduce((s, p) => s + RAREZAS[p.rareza].peso, 0);
    let r = Math.random() * total;
    const p = faltan.find(q => (r -= RAREZAS[q.rareza].peso) < 0) || faltan[0];
    darPoder(p.id);
    return p;
}

// ---------- carga (solo lo que se usa) ----------
const claveEfecto = p => `pd_${p.efecto}${p.tinte ? '_b' : ''}`;
const claveImpacto = p => p.impacto ? `pd_${p.impacto}${p.tinte && p.impacto !== 'corte2' && p.impacto !== 'agua10' && p.impacto !== 'fuego1' && p.impacto !== 'fuego2' ? '_b' : ''}` : null;

function encolar(scene, clave) {
    if (!clave || scene.textures.exists(clave)) return false;
    const nombre = clave.slice(3).replace(/_b$/, '');
    const [w, h] = EFECTOS[nombre];
    scene.load.spritesheet(clave, `${RUTA}/${clave.slice(3)}.png`, { frameWidth: w, frameHeight: h });
    return true;
}

export function cargarPoderes(scene, ids) {
    ids.map(poderPorId).filter(Boolean).forEach(p => {
        encolar(scene, claveEfecto(p));
        encolar(scene, claveImpacto(p));
        if (!scene.textures.exists(`pdi_${p.icono}`)) scene.load.image(`pdi_${p.icono}`, urlIcono(p));
    });
    encolar(scene, 'pd_corte3_b'); // chispa de golpe por defecto
}

// carga en medio del nivel (poder de otro jugador): avisa cuando está listo
function asegurar(scene, p, listo) {
    const nuevas = [encolar(scene, claveEfecto(p)), encolar(scene, claveImpacto(p))].some(Boolean);
    if (!nuevas) { listo(); return; }
    scene.load.once('complete', () => { crearAnimaciones(scene); listo(); });
    scene.load.start();
}

function crearAnimaciones(scene) {
    Object.keys(EFECTOS).forEach(nombre => ['', '_b'].forEach(sufijo => {
        const clave = `pd_${nombre}${sufijo}`;
        if (!scene.textures.exists(clave) || scene.anims.exists(`${clave}-a`)) return;
        const n = EFECTOS[nombre][2];
        scene.anims.create({ key: `${clave}-a`, frames: scene.anims.generateFrameNumbers(clave, { start: 0, end: n - 1 }), frameRate: 18, repeat: 0 });
        const [a, b] = BUCLE[nombre] || [0, n - 1];
        scene.anims.create({ key: `${clave}-l`, frames: scene.anims.generateFrameNumbers(clave, { start: a, end: b }), frameRate: 14, repeat: -1 });
    }));
}

// ---------- en el nivel ----------
let api = null;
export function iniciarPoderes(ganchos) { api = ganchos; }

export function crearPoderes(scene) {
    crearAnimaciones(scene);
    scene.poderes = equipados(scene.pj.id).map(id => (id && scene.textures.exists(claveEfecto(poderPorId(id))) ? conNivel(poderPorId(id)) : null));
    scene.cdPoderes = [0, 0];
    scene.proyPoderes = [];
    scene.zonasPoderes = [];
    // HUD: los dos poderes debajo de los corazones (con la tecla y la recarga)
    scene.hudPoderes = scene.poderes.map((p, i) => {
        const x = 30 + i * 44, y = 88; // (debajo de la barra de salud del jefe y de la arena)
        const fondo = scene.add.rectangle(x, y, 36, 36, 0x0d1220, 0.75).setStrokeStyle(1.5, p ? Phaser.Display.Color.HexStringToColor(RAREZAS[p.rareza].color).color : 0x444a5c)
            .setScrollFactor(0).setDepth(50);
        const icono = p && scene.textures.exists(`pdi_${p.icono}`) ? scene.add.image(x, y, `pdi_${p.icono}`).setDisplaySize(32, 32).setScrollFactor(0).setDepth(51) : null;
        const sombra = scene.add.rectangle(x - 16, y + 16, 32, 0, 0x000000, 0.65).setOrigin(0, 1).setScrollFactor(0).setDepth(52);
        const letra = scene.add.text(x + 17, y + 17, i ? 'B' : 'V', { fontSize: '10px', fontStyle: '700', color: '#fff', stroke: '#000', strokeThickness: 3 })
            .setOrigin(1, 1).setScrollFactor(0).setDepth(53);
        if (!p) [fondo, letra].forEach(o => o.setAlpha(0.35));
        return { fondo, icono, sombra, letra };
    });
}

// orbe de la arena (arena.js): un poder legendario de un solo uso en la ranura V
export function darOrbe(scene, id) {
    const p = poderPorId(id);
    if (!p || !scene.textures.exists(claveEfecto(p))) return false;
    scene.orbe = conNivel(p, 1);
    const h = scene.hudPoderes?.[0];
    if (h) {
        h.fondo.setStrokeStyle(2.5, 0xffc94a).setAlpha(1);
        if (h.icono) h.icono.setTexture(scene.textures.exists(`pdi_${p.icono}`) ? `pdi_${p.icono}` : h.icono.texture.key);
    }
    return true;
}

// para los botones táctiles: carga 0..1 del poder de la ranura (null = vacía)
export function estadoPoder(scene, ranura) {
    if (ranura === 0 && scene.orbe) return { carga: 1, icono: urlIcono(scene.orbe), nombre: `${scene.orbe.nombre} (orbe)` };
    const p = scene.poderes?.[ranura];
    if (!p) return null;
    const resta = Math.max(0, scene.cdPoderes[ranura] - scene.time.now);
    return { carga: 1 - resta / p.enfriamiento, icono: urlIcono(p), filtro: filtroIcono(p), nombre: p.nombre };
}

export function usarPoder(scene, ranura) {
    const orbe = ranura === 0 ? scene.orbe : null; // (el orbe va primero y no gasta la recarga)
    const p = orbe || scene.poderes?.[ranura];
    const g = scene.mascotaGesi;
    if (!p || g.isDead || scene.nivelTerminado || scene.atacando || (!orbe && scene.time.now < scene.cdPoderes[ranura])) return;
    if (orbe) {
        scene.orbe = null;
        const h = scene.hudPoderes?.[0], normal = scene.poderes[0];
        if (h) {
            h.fondo.setStrokeStyle(1.5, normal ? Phaser.Display.Color.HexStringToColor(RAREZAS[normal.rareza].color).color : 0x444a5c);
            if (h.icono && normal) h.icono.setTexture(`pdi_${normal.icono}`);
        }
    } else scene.cdPoderes[ranura] = scene.time.now + p.enfriamiento;
    api.animarPoder(scene);
    const dir = g.flipX ? -1 : 1;
    if (enLinea()) enviarEvento('poderEsp', { id: p.id, dir, nv: p.nivel || 1 });
    scene.time.delayedCall(140, () => { if (!g.isDead && !scene.nivelTerminado) lanzar(scene, p, dir, false); });
}

// otro jugador usó un poder: se ve el efecto (el daño lo cuenta su pantalla)
export function poderRemoto(scene, sprite, m) {
    const p = conNivel(poderPorId(m.id), Math.min(NIVEL_MAX, Number(m.nv) || 1));
    if (!p || !sprite?.active) return;
    // (remoto: quién lo lanzó, para que en la carrera se sepa quién te alcanzó)
    asegurar(scene, p, () => sprite.active && lanzar(scene, p, m.dir, { de: m.de }, sprite));
}

function sonar(scene, p, remoto) {
    if (p.sonido && scene.cache.audio.exists(p.sonido)) scene.sound.play(p.sonido, { volume: remoto ? 0.25 : 0.55 });
}

// sprite de efecto: se reproduce una vez y desaparece (o en bucle si se pide)
function efecto(scene, clave, x, y, { escala = 1, tinte, flip = false, bucle = false, origenY = 0.5, prof = 34 } = {}) {
    if (!scene.textures.exists(clave)) return null;
    const s = scene.add.sprite(x, y, clave).setScale(escala).setFlipX(flip).setOrigin(0.5, origenY).setDepth(prof);
    if (tinte) s.setTint(tinte);
    s.anims.play(`${clave}-${bucle ? 'l' : 'a'}`);
    if (!bucle) s.once('animationcomplete', () => s.destroy());
    return s;
}

function impacto(scene, p, x, y) {
    const clave = claveImpacto(p) || 'pd_corte3_b';
    efecto(scene, clave, x, y, { escala: 0.7, tinte: clave.endsWith('_b') ? (p.tinte || 0xffe9b0) : null, prof: 36 });
}

// enemigos vivos con cuerpo
// (en la arena también los rivales: scene.rivales, ver arena.js)
const vivos = scene => [
    ...scene.enemies.getChildren().filter(e => !e.isDead && e.body && e.active),
    ...(scene.rivales?.getChildren().filter(e => e.active && e.body?.enable) || []),
];
const centro = e => e.body.center;

function golpear(scene, p, e, remoto, daño = p.daño) {
    if (remoto) return;
    if (e.rivalId != null) {
        // otro jugador en la arena: un solo aviso con el daño, lo que congela y el empujón
        const lado = Math.sign(centro(e).x - scene.mascotaGesi.body.center.x) || 1;
        api.dañar(scene, e, daño || 0, Math.max(p.congela || 0, p.aturde || 0), p.empuje ? lado * p.empuje : 0, p);
        return;
    }
    api.dañar(scene, e, daño || 0, p.congela || 0);
    if (p.aturde && !e.isDead) api.congelar(scene, e, p.aturde);
    if (p.empuje && !e.isDead && e.body && e.def?.tipo !== 'planta') {
        const lado = Math.sign(centro(e).x - scene.mascotaGesi.body.center.x) || 1;
        e.setVelocityX(lado * p.empuje);
    }
}

// jefe: daño máximo al jefe (0 = no lo toca; las zonas que duran le pegan poco y cada tanto)
function golpearZona(scene, p, zona, remoto, daño = p.daño, jefe = 2) {
    if (remoto) { alcanzarme(scene, p, remoto, zona.centerX, b => Phaser.Geom.Intersects.RectangleToRectangle(zona, b)); return; }
    vivos(scene).forEach(e => {
        const re = new Phaser.Geom.Rectangle(e.body.left, e.body.top, e.body.width, e.body.height);
        if (Phaser.Geom.Intersects.RectangleToRectangle(zona, re)) golpear(scene, p, e, false, daño);
    });
    if (daño && jefe) api.golpearJefe(scene, zona, Math.min(jefe, daño));
}

const zonaCirculo = (x, y, r) => new Phaser.Geom.Rectangle(x - r, y - r, r * 2, r * 2);

// carrera: ¿el poder de un rival (remoto = { de }) me alcanzó? toca(rectángulo de mi cuerpo)
// ox: desde dónde viene (para el lado del empujón)
function alcanzarme(scene, p, remoto, ox, toca) {
    const g = scene.mascotaGesi;
    if (!scene.carrera || !remoto?.de || !g?.body || g.isDead) return false;
    const b = g.body;
    if (!toca(new Phaser.Geom.Rectangle(b.left, b.top, b.width, b.height))) return false;
    api.golpeCarrera?.(scene, p, remoto.de, ox);
    return true;
}
const miCentro = scene => scene.mascotaGesi?.body?.center;

function golpearRadio(scene, p, x, y, r, remoto, jefe = 2) {
    if (remoto) { alcanzarme(scene, p, remoto, x, b => Phaser.Math.Distance.Between(x, y, b.centerX, b.centerY) < r + 12); return; }
    vivos(scene).forEach(e => { if (Phaser.Math.Distance.Between(x, y, centro(e).x, centro(e).y) < r) golpear(scene, p, e, false); });
    if (p.daño && jefe) api.golpearJefe(scene, zonaCirculo(x, y, r), Math.min(jefe, p.daño));
}

// proyectil (también ola y meteoro): se mueve en update y revisa los choques
function proyectil(scene, p, x, y, vx, vy, remoto, extra = {}) {
    const s = efecto(scene, claveEfecto(p), x, y, { escala: (p.escala || 1) * (extra.escala || 0.8), tinte: p.tinte, flip: vx < 0, bucle: true, origenY: extra.origenY ?? 0.5 });
    if (!s) return;
    if (vy) s.setRotation(Math.atan2(vy, Math.abs(vx)) * Math.sign(vx || 1));
    scene.proyPoderes.push({ s, p, vx, vy, y0: y, nace: scene.time.now, vida: extra.vida ?? p.vida, remoto, golpeados: new Set(), alLlegar: extra.alLlegar, sueloY: extra.sueloY });
}

function lanzar(scene, p, dir, remoto, sprite = scene.mascotaGesi) {
    const b = sprite.body || { center: { x: sprite.x, y: sprite.y - 30 }, bottom: sprite.y, left: sprite.x - 10, right: sprite.x + 10, top: sprite.y - 60, width: 20, height: 60 };
    const cx = b.center.x, cy = b.center.y, pie = b.bottom;
    sonar(scene, p, remoto);
    const tinte = p.tinte;
    switch (p.tipo) {
        case 'proyectil':
            proyectil(scene, p, cx + dir * 24, cy - 6, dir * p.vel, 0, remoto);
            break;
        case 'rafaga':
            for (let i = 0; i < p.cantidad; i++) {
                const ang = (i - (p.cantidad - 1) / 2) * 0.22;
                proyectil(scene, p, cx + dir * 24, cy - 6, dir * p.vel * Math.cos(ang), p.vel * Math.sin(ang), remoto);
            }
            break;
        case 'ola':
            proyectil(scene, p, cx + dir * 30, pie + 4, dir * p.vel, 0, remoto, { origenY: 1, escala: 0.75 });
            break;
        case 'meteoro': {
            const destinoX = cx + dir * 150;
            proyectil(scene, p, destinoX - dir * 160, pie - 330, dir * 210, 430, remoto, {
                vida: 2000, sueloY: pie, escala: 0.9,
                alLlegar: (x) => explotar(scene, p, x, pie - 30, remoto),
            });
            break;
        }
        case 'lluvia':
            for (let i = 0; i < p.cantidad; i++) {
                const x = cx + dir * (60 + (i + Math.random() * 0.6) * p.ancho / p.cantidad);
                scene.time.delayedCall(i * 230, () => {
                    if (p.enSuelo) {
                        efecto(scene, claveEfecto(p), x, pie + 6, { tinte, origenY: 1, escala: 0.9 });
                        scene.time.delayedCall(150, () => golpearZona(scene, p, new Phaser.Geom.Rectangle(x - 30, pie - 120, 60, 120), remoto));
                    } else {
                        proyectil(scene, p, x - dir * 80, pie - 300, dir * 120, 460, remoto, {
                            vida: 1500, sueloY: pie, escala: 0.6,
                            alLlegar: (lx) => {
                                if (p.impacto) efecto(scene, `pd_${p.impacto}`, lx, pie - 20, { escala: 0.6 });
                                golpearRadio(scene, p, lx, pie - 20, 55, remoto);
                            },
                        });
                    }
                });
            }
            break;
        case 'explosion':
            explotar(scene, p, cx, cy, remoto);
            break;
        case 'frente': {
            let x = cx + dir * p.distancia;
            if (p.objetivo) {
                // el enemigo más cercano delante (o el punto fijo si no hay)
                const blanco = vivos(scene).filter(e => (centro(e).x - cx) * dir > -10 && Math.abs(centro(e).x - cx) < 360)
                    .sort((a, c) => Math.abs(centro(a).x - cx) - Math.abs(centro(c).x - cx))[0];
                if (blanco) x = centro(blanco).x;
                rayoVertical(scene, x, pie, tinte);
            }
            efecto(scene, claveEfecto(p), x, pie + 6, { tinte, origenY: 1, escala: p.escala || 1 });
            if (p.temblor) scene.cameras.main.shake(260, 0.006);
            scene.time.delayedCall(120, () => golpearZona(scene, p, new Phaser.Geom.Rectangle(x - p.ancho / 2, pie - p.alto, p.ancho, p.alto + 4), remoto));
            break;
        }
        case 'tajo': {
            const golpes = p.golpes || 1;
            for (let i = 0; i < golpes; i++) {
                scene.time.delayedCall(i * 220, () => {
                    const x = (sprite.body?.center.x ?? sprite.x) + dir * (p.alcance / 2 + 8);
                    const s = efecto(scene, claveEfecto(p), x, cy - 4, { tinte, flip: dir < 0, escala: (p.escala || 1) * 0.8 });
                    if (s && i % 2) s.setFlipY(true);
                    const x0 = dir > 0 ? (sprite.body?.right ?? sprite.x) : (sprite.body?.left ?? sprite.x) - p.alcance;
                    golpearZona(scene, p, new Phaser.Geom.Rectangle(x0, cy - p.alto / 2, p.alcance, p.alto), remoto);
                });
            }
            break;
        }
        case 'trampa': {
            const x = cx + dir * p.distancia;
            const s = efecto(scene, claveEfecto(p), x, pie + 6, { tinte, origenY: 1, bucle: true, escala: p.escala || 0.9 });
            if (!s) break;
            scene.zonasPoderes.push({ s, p, remoto, hasta: scene.time.now + p.duracion, prox: 0,
                zona: () => new Phaser.Geom.Rectangle(x - p.ancho / 2, pie - p.alto, p.ancho, p.alto + 4) });
            break;
        }
        case 'aura': {
            const s = efecto(scene, claveEfecto(p), cx, cy, { tinte, bucle: true, escala: (p.escala || 1) * 0.9, prof: 33 });
            if (!s) break;
            s.setAlpha(0.85);
            scene.zonasPoderes.push({ s, p, remoto, sigue: sprite, hasta: scene.time.now + p.duracion, prox: 0, radio: p.radio });
            break;
        }
        case 'iman': {
            const x = cx + dir * p.distancia, y = cy - 10;
            const s = efecto(scene, claveEfecto(p), x, y, { tinte, bucle: true, escala: p.escala || 1 });
            if (!s) break;
            scene.tweens.add({ targets: s, angle: 360 * dir, duration: 900, repeat: -1 });
            scene.zonasPoderes.push({ s, p, remoto, hasta: scene.time.now + p.duracion, prox: 0, iman: { x, y },
                alTerminar: () => { golpearRadio(scene, p, x, y, 70, remoto); efecto(scene, 'pd_corte3_b', x, y, { tinte, escala: 1.4 }); } });
            break;
        }
        case 'escudo': {
            if (!remoto) {
                api.habilidadBase(scene, { tipo: 'escudo', duracion: p.duracion });
                const s = efecto(scene, claveEfecto(p), cx, cy, { tinte, bucle: true, escala: 0.9 });
                if (s) { s.setAlpha(0.8); scene.escudoFx?.destroy(); scene.escudoFx = s; }
            } else {
                const s = efecto(scene, claveEfecto(p), cx, cy, { tinte, bucle: true, escala: 0.9 });
                if (s) scene.zonasPoderes.push({ s, p, remoto, sigue: sprite, hasta: scene.time.now + p.duracion, prox: Infinity });
            }
            break;
        }
        case 'cura':
            efecto(scene, claveEfecto(p), cx, pie + 6, { tinte, origenY: 1 });
            if (!remoto) {
                const escudo = api.recuperarEscudo(scene);
                const vida = p.vida && api.curarVida(scene);
                if (!escudo && !vida) api.mensaje(scene, '¡YA ESTABAS ENTERO!');
            }
            break;
        case 'impulso': {
            if (!remoto) {
                api.habilidadBase(scene, { tipo: 'embestida', duracion: p.duracion, vel: p.vel });
                const golpeados = new Set();
                const fin = scene.time.now + p.duracion;
                const tick = scene.time.addEvent({ delay: 40, loop: true, callback: () => {
                    const gb = sprite.body;
                    if (!gb || scene.time.now > fin) { tick.remove(); return; }
                    const zona = new Phaser.Geom.Rectangle(gb.left - 16, gb.top - 6, gb.width + 32, gb.height + 12);
                    vivos(scene).forEach(e => {
                        if (golpeados.has(e)) return;
                        const re = new Phaser.Geom.Rectangle(e.body.left, e.body.top, e.body.width, e.body.height);
                        if (Phaser.Geom.Intersects.RectangleToRectangle(zona, re)) { golpeados.add(e); golpear(scene, p, e, false); impacto(scene, p, centro(e).x, centro(e).y); }
                    });
                    if (!golpeados.has('jefe')) { golpeados.add('jefe'); api.golpearJefe(scene, zona, Math.min(2, p.daño)); }
                } });
            }
            efecto(scene, claveEfecto(p), cx + dir * 40, pie - 6, { tinte, flip: dir < 0, origenY: 1 });
            break;
        }
        case 'salto':
            if (!remoto) sprite.setVelocityY(-p.fuerza);
            efecto(scene, claveEfecto(p), cx, pie + 6, { tinte, origenY: 1, escala: 0.8 });
            golpearRadio(scene, p, cx, pie - 10, p.radio, remoto);
            break;
        case 'cadena': {
            const usados = new Set();
            let desde = { x: cx, y: cy };
            for (let i = 0; i <= p.saltos; i++) {
                const lista = vivos(scene).filter(e => !usados.has(e) && Phaser.Math.Distance.Between(desde.x, desde.y, centro(e).x, centro(e).y) < (i ? 170 : p.alcance));
                const sig = lista.sort((a, c) => Phaser.Math.Distance.Between(desde.x, desde.y, centro(a).x, centro(a).y) - Phaser.Math.Distance.Between(desde.x, desde.y, centro(c).x, centro(c).y))[0];
                if (!sig) {
                    if (!i) rayoEntre(scene, desde, { x: cx + dir * 120, y: cy - 10 }, tinte);
                    break;
                }
                usados.add(sig);
                const hasta = { x: centro(sig).x, y: centro(sig).y };
                const origen = desde;
                scene.time.delayedCall(i * 110, () => {
                    rayoEntre(scene, origen, hasta, tinte);
                    efecto(scene, claveEfecto(p), hasta.x, hasta.y, { tinte, escala: 0.5 });
                    if (sig.active) golpear(scene, p, sig, remoto);
                });
                desde = hasta;
            }
            if (!remoto) api.golpearJefe(scene, new Phaser.Geom.Rectangle(Math.min(cx, cx + dir * p.alcance), cy - 60, p.alcance, 120), Math.min(2, p.daño));
            rayoARival(scene, p, remoto, { x: cx, y: cy }, p.alcance, tinte);
            break;
        }
        case 'tormenta': {
            const blancos = vivos(scene).filter(e => Math.abs(centro(e).x - cx) < p.alcance)
                .sort((a, c) => Math.abs(centro(a).x - cx) - Math.abs(centro(c).x - cx)).slice(0, p.cantidad);
            if (!blancos.length) rayoVertical(scene, cx + dir * 120, pie, tinte);
            blancos.forEach((e, i) => scene.time.delayedCall(i * 140, () => {
                if (!e.active) return;
                rayoVertical(scene, centro(e).x, e.body?.bottom ?? pie, tinte);
                efecto(scene, claveEfecto(p), centro(e).x, centro(e).y, { tinte, escala: 0.6 });
                golpear(scene, p, e, remoto);
            }));
            if (!remoto) api.golpearJefe(scene, new Phaser.Geom.Rectangle(cx - p.alcance, cy - 200, p.alcance * 2, 400), Math.min(2, p.daño));
            rayoARival(scene, p, remoto, { x: cx, y: cy }, p.alcance, tinte, true);
            scene.cameras.main.flash(120, 255, 250, 200);
            break;
        }
        case 'tiempo':
            efecto(scene, claveEfecto(p), cx, cy, { tinte, escala: p.escala || 1 });
            scene.cameras.main.flash(250, 255, 180, 230);
            if (!remoto) vivos(scene).forEach(e => { if (Math.abs(centro(e).x - cx) < p.alcance) api.congelar(scene, e, p.duracion); });
            // carrera: el tiempo también se detiene para el rival que está cerca
            else alcanzarme(scene, p, remoto, cx, b => Math.abs(b.centerX - cx) < p.alcance && Math.abs(b.centerY - cy) < 200);
            break;
        case 'rayo': {
            const x0 = dir > 0 ? cx + 10 : cx - 10 - p.alcance;
            const haz = scene.add.rectangle(x0 + p.alcance / 2, cy - 6, p.alcance, 10, tinte || 0xffffff, 0.9).setDepth(35).setBlendMode('ADD');
            scene.tweens.add({ targets: haz, scaleY: 3, alpha: 0, duration: 420, onComplete: () => haz.destroy() });
            efecto(scene, claveEfecto(p), cx + dir * 40, cy - 6, { tinte, flip: dir < 0 });
            golpearZona(scene, p, new Phaser.Geom.Rectangle(x0, cy - 22, p.alcance, 32), remoto);
            break;
        }
    }
}

function explotar(scene, p, x, y, remoto) {
    // el meteoro estalla con su efecto de impacto; las explosiones, con su propio efecto
    if (p.tipo === 'meteoro') efecto(scene, `pd_${p.impacto}`, x, y, { escala: p.escala || 1 });
    else efecto(scene, claveEfecto(p), x, y, { tinte: p.tinte, escala: p.escala || 1 });
    if (p.temblor || p.tipo === 'meteoro') scene.cameras.main.shake(300, 0.008);
    golpearRadio(scene, p, x, y, p.radio, remoto);
}

// carrera: la chispa y la tormenta de un rival también buscan al jugador de esta pantalla
function rayoARival(scene, p, remoto, desde, alcance, tinte, delCielo = false) {
    const c = miCentro(scene);
    if (!remoto || !scene.carrera || !c || Phaser.Math.Distance.Between(desde.x, desde.y, c.x, c.y) > alcance) return;
    if (delCielo) rayoVertical(scene, c.x, scene.mascotaGesi.body.bottom, tinte);
    else rayoEntre(scene, desde, { x: c.x, y: c.y }, tinte);
    alcanzarme(scene, p, remoto, desde.x, () => true);
}

// rayo dibujado: zigzag entre dos puntos
function rayoEntre(scene, a, b, color = 0xffffff) {
    const g = scene.add.graphics().setDepth(36).setBlendMode('ADD');
    const pasos = 7;
    g.lineStyle(3, color, 1).beginPath().moveTo(a.x, a.y);
    for (let i = 1; i < pasos; i++) {
        const t = i / pasos;
        g.lineTo(a.x + (b.x - a.x) * t + Phaser.Math.Between(-8, 8), a.y + (b.y - a.y) * t + Phaser.Math.Between(-8, 8));
    }
    g.lineTo(b.x, b.y).strokePath();
    scene.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
}
const rayoVertical = (scene, x, pie, color) => rayoEntre(scene, { x: x + Phaser.Math.Between(-20, 20), y: pie - 330 }, { x, y: pie - 10 }, color);

// cada fotograma: proyectiles, trampas, auras, imanes y el HUD de recarga
export function actualizarPoderes(scene, time, delta) {
    if (!scene.proyPoderes) return;
    const dt = delta / 1000;
    scene.proyPoderes = scene.proyPoderes.filter(q => {
        const s = q.s;
        if (!s.active) return false;
        s.x += q.vx * dt;
        s.y = q.vy ? s.y + q.vy * dt : q.p.onda ? q.y0 + Math.sin((time - q.nace) / 110) * q.p.onda : s.y;
        if (q.sueloY !== undefined && s.y >= q.sueloY - 10) {
            q.alLlegar?.(s.x);
            s.destroy();
            return false;
        }
        if (time - q.nace > q.vida) {
            s.destroy();
            return false;
        }
        if (q.alLlegar) return true; // los meteoros solo estallan al llegar al suelo
        // choque: caja chica alrededor del centro del efecto (más alta en las olas)
        const alto = q.p.tipo === 'ola' ? (q.p.alto || 70) : 30;
        const zona = new Phaser.Geom.Rectangle(s.x - 20, (q.p.tipo === 'ola' ? s.y - alto : s.y - 15), 40, alto);
        // carrera: el proyectil de un rival también me puede alcanzar (una vez)
        if (q.remoto && !q.meAlcanzo && alcanzarme(scene, q.p, q.remoto, s.x - Math.sign(q.vx || 1) * 30, b => Phaser.Geom.Intersects.RectangleToRectangle(zona, b))) {
            q.meAlcanzo = true;
            impacto(scene, q.p, s.x, s.y);
            if (!q.p.perfora && q.p.tipo !== 'ola') { s.destroy(); return false; }
        }
        for (const e of vivos(scene)) {
            if (q.golpeados.has(e)) continue;
            const re = new Phaser.Geom.Rectangle(e.body.left, e.body.top, e.body.width, e.body.height);
            if (!Phaser.Geom.Intersects.RectangleToRectangle(zona, re)) continue;
            q.golpeados.add(e);
            golpear(scene, q.p, e, q.remoto);
            impacto(scene, q.p, s.x, s.y);
            if (!q.p.perfora && q.p.tipo !== 'ola') { s.destroy(); return false; }
        }
        if (!q.remoto && !q.golpeoJefe && (scene.jefe || scene.guardianes?.length)) { // (también las raíces del Árbol Anciano)
            const vidas = () => (scene.jefe?.vida ?? 0) + (scene.guardianes || []).reduce((t, ga) => t + (ga.vida || 0), 0);
            const antes = vidas();
            api.golpearJefe(scene, zona, Math.min(2, q.p.daño));
            if (vidas() !== antes) {
                q.golpeoJefe = true;
                impacto(scene, q.p, s.x, s.y);
                if (!q.p.perfora && q.p.tipo !== 'ola') { s.destroy(); return false; }
            }
        }
        return true;
    });
    scene.zonasPoderes = scene.zonasPoderes.filter(z => {
        if (!z.s.active) return false;
        if (z.sigue) {
            const b = z.sigue.body;
            z.s.setPosition(b ? b.center.x : z.sigue.x, b ? b.center.y : z.sigue.y - 30);
        }
        if (time > z.hasta) {
            z.alTerminar?.();
            scene.tweens.add({ targets: z.s, alpha: 0, duration: 250, onComplete: () => z.s.destroy() });
            z.s.active = false;
            return false;
        }
        if (z.iman && z.remoto && scene.carrera) {
            // carrera: el vórtice de un rival también me atrapa: solo me arrastra HACIA ATRÁS (si está
            // delante, me frena; nunca me ayuda a avanzar). Poco a poco: se puede escapar corriendo
            const c = miCentro(scene), g = scene.mascotaGesi;
            if (c && !g.isDead && Math.abs(z.iman.x - c.x) < z.p.radio && Math.abs(z.iman.y - c.y) < 160) {
                g.x -= Math.min(130, Math.max(60, Math.abs(z.iman.x - c.x) * 2)) * (delta / 1000);
            }
        }
        if (z.iman && !z.remoto) {
            vivos(scene).forEach(e => {
                const dx = z.iman.x - centro(e).x;
                if (Math.abs(dx) < z.p.radio && e.def?.tipo !== 'planta' && e.rivalId == null) e.setVelocityX(Math.sign(dx) * Math.min(220, Math.abs(dx) * 3));
            });
        }
        if (time >= z.prox) {
            z.prox = time + (z.iman ? 600 : 450);
            const jefe = time >= (z.proxJefe || 0) ? 1 : 0; // al jefe: 1 de daño cada 1,5 s como mucho
            if (jefe) z.proxJefe = time + 1500;
            if (z.radio) golpearRadio(scene, z.p, z.s.x, z.s.y, z.radio, z.remoto, jefe);
            else if (z.zona) golpearZona(scene, z.p, z.zona(), z.remoto, z.p.daño, jefe);
            else if (z.iman) golpearRadio(scene, z.p, z.iman.x, z.iman.y, 60, z.remoto, jefe);
        }
        return true;
    });
    // HUD: la sombra baja a medida que se recarga
    scene.hudPoderes?.forEach((h, i) => {
        const p = scene.poderes[i];
        if (!p) return;
        const resta = Math.max(0, scene.cdPoderes[i] - time) / p.enfriamiento;
        const alto = Math.round(32 * resta);
        if (h.alto !== alto) { h.sombra.height = alto; h.sombra.setSize(32, alto); h.alto = alto; }
    });
}
