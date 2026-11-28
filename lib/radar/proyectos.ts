// PROTOTIPOS — ideas de negocio con electrónica (ESP32, Arduino, sensores, NFC) para
// pensar en qué invertir cuando haya plata. Lógica pura, sin red: el catálogo, el
// puntaje según tu presupuesto y la época del año, la idea de la semana y la validación
// de lo que llega de la IA o del navegador.
//
// Las cifras de inversión son órdenes de magnitud en pesos chilenos (estimadas, sin
// cotizar): sirven para comparar ideas entre sí. El precio real de los componentes se
// consulta en Mercado Libre desde la pestaña (botón «PRECIOS REALES»).

export type Area = 'negocios' | 'hogar' | 'agro' | 'ambiente' | 'nfc' | 'maker' | 'educacion' | 'deco' | 'servicio'
export type Modelo = 'equipo' | 'suscripcion' | 'servicio' | 'curso' | 'digital'
export type Componente = { n: string; q: string; cant?: number }
export type Proyecto = {
  id: string
  nombre: string
  area: Area
  cliente: string // quién lo compra
  problema: string // qué le duele hoy
  venta: string // qué se vende y cómo se cobra
  modelo: Modelo
  recurrente: boolean // cobra todos los meses
  proto: number // $ para el primer prototipo
  piloto: number // $ para unas 5 unidades con las que probar con clientes
  dias: number // días de trabajo hasta tener un prototipo que funcione
  nivel: 1 | 2 | 3 // dificultad técnica (1 = conectar y programar poco)
  valor: 1 | 2 | 3 // cuánto puede costar sin parecer caro
  demanda: 1 | 2 | 3 // cuánta gente lo necesita
  bom: Componente[]
  riesgo: string
  validar: string // cómo comprobar que lo pagan sin invertir
  primerPaso: string
  meses: number[] // meses (1-12) de más demanda; vacío = todo el año
  red220: boolean // se conecta a 220 V: pide certificación eléctrica en Chile
}

export const AREA_LABEL: Record<Area, string> = {
  negocios: 'Negocios', hogar: 'Hogar', agro: 'Agro y huerta', ambiente: 'Ambiente', nfc: 'NFC',
  maker: 'Para makers', educacion: 'Educación', deco: 'Objetos NeoProxy', servicio: 'Servicios',
}
export const MODELO_LABEL: Record<Modelo, string> = {
  equipo: 'Equipo', suscripcion: 'Suscripción', servicio: 'Servicio', curso: 'Curso o taller', digital: 'Digital',
}
export const AREAS = Object.keys(AREA_LABEL) as Area[]
const MODELOS = Object.keys(MODELO_LABEL) as Modelo[]

const c = (n: string, q: string, cant = 1): Componente => ({ n, q, cant })
const ESP = c('ESP32 DevKit', 'esp32 devkit v1')

export const PROYECTOS: Proyecto[] = [
  // ---- Negocios: aparatos que ahorran un problema caro ----
  {
    id: 'temp-frio', nombre: 'Monitor de temperatura con alerta para cámaras de frío', area: 'negocios',
    cliente: 'Restaurantes, botillerías, pastelerías, farmacias y dueños de refrigeradores comerciales',
    problema: 'Si el frío falla un fin de semana se pierde la mercadería y nadie se entera hasta el lunes.',
    venta: 'Equipo con caja impresa y, aparte, una mensualidad baja por el aviso al celular (Telegram o WhatsApp).',
    modelo: 'suscripcion', recurrente: true, proto: 25000, piloto: 90000, dias: 10, nivel: 2, valor: 3, demanda: 3,
    bom: [ESP, c('Sensor de temperatura DS18B20 sumergible', 'sensor temperatura ds18b20 sumergible'), c('Resistencia 4,7 kΩ', 'resistencia 4.7k'), c('Cargador USB 5 V', 'cargador usb 5v 1a')],
    riesgo: 'Soporte: el WiFi del local falla. No es un instrumento calibrado: no prometas que sirve para exigencias sanitarias.',
    validar: 'Préstalo gratis un mes a 3 negocios y pregúntales cuánto pagarían por quedárselo.',
    primerPaso: 'Un ESP32 con un DS18B20 que te mande la temperatura a Telegram cada minuto y avise si pasa de 8 °C.',
    meses: [], red220: false,
  },
  {
    id: 'nfc-negocios', nombre: 'Tarjetas y llaveros NFC para negocios', area: 'nfc',
    cliente: 'Peluquerías, cafés, tatuadores, tiendas y emprendedores',
    problema: 'Quieren más reseñas en Google y que el cliente llegue a su menú, WhatsApp o Instagram sin escribir nada.',
    venta: 'Pack: tarjeta o llavero NFC, soporte impreso en 3D y el enlace configurado. Pago único.',
    modelo: 'equipo', recurrente: false, proto: 15000, piloto: 40000, dias: 3, nivel: 1, valor: 2, demanda: 3,
    bom: [c('Tarjetas NFC NTAG215', 'tarjeta nfc ntag215'), c('Llaveros NFC NTAG213', 'llavero nfc ntag213')],
    riesgo: 'Bajo. Algunos celulares antiguos no leen NFC: ofrece también el QR impreso.',
    validar: 'Regala una muestra a 5 negocios y mide cuántos la usan en la primera semana.',
    primerPaso: 'Programar una tarjeta con el enlace de reseñas de Google de un café conocido y probarla con tu celular.',
    meses: [], red220: false,
  },
  {
    id: 'carta-digital', nombre: 'Carta digital con NFC y mantención mensual', area: 'negocios',
    cliente: 'Restaurantes, cafeterías y food trucks',
    problema: 'Cambian precios y platos seguido y la carta de papel queda vieja o se ensucia.',
    venta: 'Página de carta + tarjeta NFC en la mesa. Cobras la instalación y una mensualidad por mantener la carta actualizada.',
    modelo: 'suscripcion', recurrente: true, proto: 5000, piloto: 20000, dias: 5, nivel: 1, valor: 2, demanda: 3,
    bom: [c('Tarjetas NFC NTAG215', 'tarjeta nfc ntag215')],
    riesgo: 'Compites con QR gratis: lo que vendes es el servicio (la carta siempre al día) y el diseño.',
    validar: 'Ofrécela gratis un mes a 2 locales a cambio de una reseña y de poder mostrarla.',
    primerPaso: 'Armar la carta de un local de ejemplo como página móvil y enlazarla desde una tarjeta NFC.',
    meses: [], red220: false,
  },
  {
    id: 'contador-aforo', nombre: 'Contador de personas para locales (sin cámaras)', area: 'negocios',
    cliente: 'Tiendas, ferias, gimnasios, cafés y bibliotecas',
    problema: 'No saben a qué hora entra más gente ni cuántos visitan sin comprar.',
    venta: 'Equipo con sensor en la puerta y un resumen semanal (horas punta, días fuertes). Mensualidad por el reporte.',
    modelo: 'suscripcion', recurrente: true, proto: 40000, piloto: 140000, dias: 14, nivel: 2, valor: 2, demanda: 2,
    bom: [ESP, c('Sensor de distancia VL53L1X', 'sensor distancia vl53l1x'), c('Sensor PIR', 'sensor pir hc-sr501')],
    riesgo: 'Privacidad: cuenta personas sin imágenes ni datos personales, dilo claramente. Precisión no perfecta en entradas anchas.',
    validar: 'Instálalo en un local amigo una semana y compara su cuenta con una cuenta manual de una hora.',
    primerPaso: 'Dos sensores de distancia en un marco de cartón que cuenten entradas y salidas en el monitor serial.',
    meses: [], red220: false,
  },
  {
    id: 'acceso-nfc', nombre: 'Control de acceso con NFC para bodegas, gimnasios y coworks', area: 'negocios',
    cliente: 'Dueños de bodegas, gimnasios pequeños, coworks y edificios con pocas unidades',
    problema: 'Las llaves se pierden y no saben quién entró ni cuándo.',
    venta: 'Lector + cerradura + panel con la lista de tarjetas. Equipo e instalación, y mensualidad por el registro.',
    modelo: 'suscripcion', recurrente: true, proto: 45000, piloto: 150000, dias: 14, nivel: 2, valor: 3, demanda: 2,
    bom: [ESP, c('Lector NFC PN532', 'lector nfc pn532'), c('Cerradura electromagnética 12 V', 'cerradura electromagnetica 12v'), c('Módulo relé', 'modulo rele 5v'), c('Fuente 12 V', 'fuente 12v 2a')],
    riesgo: 'Seguridad física: toda puerta con cerradura eléctrica necesita salida manual; una falla no puede dejar a alguien encerrado.',
    validar: 'Muéstrale una demo a 3 administradores de bodegas o gimnasios y pregunta qué pagarían por instalarlo.',
    primerPaso: 'ESP32 con lector PN532 que prenda un relé solo con las tarjetas autorizadas.',
    meses: [], red220: false,
  },
  {
    id: 'turnos', nombre: 'Llamador de garzón o de turno con botón por mesa', area: 'negocios',
    cliente: 'Restaurantes, ferias gastronómicas y salas de espera',
    problema: 'Los clientes esperan sin poder llamar, o los números de turno se gritan y se pierden.',
    venta: 'Botones en las mesas y una pantalla pequeña. Equipo por local, pago único o por mesa.',
    modelo: 'equipo', recurrente: false, proto: 35000, piloto: 120000, dias: 12, nivel: 2, valor: 2, demanda: 2,
    bom: [ESP, c('Botón pulsador grande', 'boton pulsador arcade'), c('Pantalla OLED 0,96"', 'pantalla oled 0.96 i2c')],
    riesgo: 'La radio de WiFi en locales llenos: prueba con ESP-NOW (sin router) antes de prometerlo.',
    validar: 'Prueba 3 botones durante un fin de semana en un restaurante conocido.',
    primerPaso: 'Dos ESP32: uno con botón, otro con pantalla, comunicados por ESP-NOW.',
    meses: [11, 12, 1, 2], red220: false,
  },
  {
    id: 'panel-avisos', nombre: 'Panel de precios y avisos actualizable por WiFi', area: 'negocios',
    cliente: 'Ferias, verdulerías, cafés y tiendas que cambian precios',
    problema: 'Reescribir carteles cada día es lento y se ve desordenado.',
    venta: 'Panel de matriz LED que se cambia desde el celular. Equipo, pago único.',
    modelo: 'equipo', recurrente: false, proto: 45000, piloto: 150000, dias: 14, nivel: 2, valor: 2, demanda: 2,
    bom: [c('Panel LED matriz HUB75', 'panel led matriz p4 hub75'), c('ESP32 con salida HUB75', 'esp32 hub75 adaptador'), c('Fuente 5 V 4 A', 'fuente 5v 4a')],
    riesgo: 'Mucha corriente a 5 V: fuente de buena calidad y fusible. Visibilidad bajo el sol.',
    validar: 'Muestra el panel funcionando en un video y pregunta a 5 locales cuánto pagarían.',
    primerPaso: 'Un panel HUB75 mostrando un texto que se cambia desde una página web local.',
    meses: [], red220: false,
  },
  {
    id: 'vibracion', nombre: 'Sensor de vibración para avisar cuando un motor se está dañando', area: 'negocios',
    cliente: 'Talleres, lavanderías, panaderías y pequeños fabricantes',
    problema: 'Las máquinas se detienen sin aviso y la reparación de urgencia sale cara.',
    venta: 'Sensor por máquina más una mensualidad por el panel y las alertas.',
    modelo: 'suscripcion', recurrente: true, proto: 40000, piloto: 140000, dias: 20, nivel: 3, valor: 3, demanda: 1,
    bom: [ESP, c('Acelerómetro ADXL345', 'acelerometro adxl345'), c('Imán de montaje', 'iman neodimio disco 20mm')],
    riesgo: 'Venta B2B lenta y técnica: hay que explicar qué significa cada alerta. Empieza con un cliente.',
    validar: 'Mide la vibración de una lavadora o un compresor conocido y muéstrale el gráfico al dueño.',
    primerPaso: 'ADXL345 pegado a un motor pequeño, registrando la vibración y viendo cuándo cambia.',
    meses: [], red220: false,
  },
  // ---- Hogar ----
  {
    id: 'aire', nombre: 'Medidor de calidad del aire (CO₂ y material particulado)', area: 'ambiente',
    cliente: 'Familias, oficinas, colegios y salas de clases',
    problema: 'Con el humo de invierno y las ventanas cerradas nadie sabe cuándo el aire está malo.',
    venta: 'Equipo con pantalla y caja impresa, listo para usar. Se vende como indicativo, no como instrumento certificado.',
    modelo: 'equipo', recurrente: false, proto: 70000, piloto: 220000, dias: 14, nivel: 2, valor: 2, demanda: 2,
    bom: [ESP, c('Sensor de CO₂ SCD40', 'sensor co2 scd40'), c('Sensor de partículas PMS5003', 'sensor pms5003'), c('Pantalla OLED 0,96"', 'pantalla oled 0.96 i2c')],
    riesgo: 'Los sensores baratos se descalibran: vende «indicativo» y compara con una estación oficial.',
    validar: 'Publica el prototipo en grupos de vecinos y de apoderados y mira cuántos lo piden.',
    primerPaso: 'ESP32 con SCD40 mostrando CO₂ en una pantalla OLED.',
    meses: [5, 6, 7, 8, 9], red220: false,
  },
  {
    id: 'estacion', nombre: 'Mini estación meteorológica de escritorio', area: 'hogar',
    cliente: 'Aficionados, regalos para papás y colegios',
    problema: 'Quieren ver la temperatura y la humedad de su casa o su oficina sin abrir el celular.',
    venta: 'Equipo con caja impresa y pantalla. Pago único; buen regalo.',
    modelo: 'equipo', recurrente: false, proto: 30000, piloto: 100000, dias: 7, nivel: 1, valor: 2, demanda: 2,
    bom: [ESP, c('Sensor BME280', 'sensor bme280'), c('Pantalla TFT 1,8"', 'pantalla tft 1.8 st7735')],
    riesgo: 'Es un producto común: lo que lo diferencia es la caja y la estética.',
    validar: 'Muestra un video en Instagram y pide pedidos con anticipo.',
    primerPaso: 'BME280 y pantalla TFT mostrando temperatura, humedad y presión.',
    meses: [11, 12, 5, 6], red220: false,
  },
  {
    id: 'planta', nombre: 'Sensor de plantas de interior con aviso al celular', area: 'hogar',
    cliente: 'Gente que ama sus plantas y se le olvida regarlas',
    problema: 'Regar de más o de menos mata las plantas.',
    venta: 'Sensor pequeño con batería y caja impresa. Pago único, en pack de varias unidades.',
    modelo: 'equipo', recurrente: false, proto: 20000, piloto: 70000, dias: 7, nivel: 1, valor: 1, demanda: 3,
    bom: [c('ESP32-C3 pequeño', 'esp32 c3 supermini'), c('Sensor de humedad de suelo capacitivo', 'sensor humedad suelo capacitivo'), c('Batería 18650 con porta', 'bateria 18650 porta')],
    riesgo: 'Bajo precio de venta: necesita volumen. El sensor capacitivo en contacto con tierra dura meses, no años.',
    validar: 'Prueba 3 unidades con amigos con plantas durante un mes.',
    primerPaso: 'ESP32-C3 con sensor capacitivo que duerma y avise a Telegram cuando la tierra esté seca.',
    meses: [9, 10, 11, 12], red220: false,
  },
  {
    id: 'agua-filtracion', nombre: 'Sensor de filtración y desborde (cocina, lavadora, bodega)', area: 'hogar',
    cliente: 'Arrendadores, administradores de edificios y dueños de bodegas',
    problema: 'Una filtración que nadie ve avanza semanas y destruye pisos o mercadería.',
    venta: 'Sensor con batería que avisa por celular. Pago único por unidad o pack.',
    modelo: 'equipo', recurrente: false, proto: 18000, piloto: 60000, dias: 8, nivel: 1, valor: 2, demanda: 2,
    bom: [c('ESP32-C3 pequeño', 'esp32 c3 supermini'), c('Sensor de agua', 'sensor nivel agua'), c('Batería 18650 con porta', 'bateria 18650 porta')],
    riesgo: 'Es una alarma: no prometas protección total, di que es un aviso temprano.',
    validar: 'Ofrécelo a 3 administradores de edificios y mide quién lo pone en un piso real.',
    primerPaso: 'Sensor de agua + ESP32-C3 en modo de bajo consumo que avise al detectar humedad.',
    meses: [5, 6, 7, 8], red220: false,
  },
  {
    id: 'mascotas', nombre: 'Dispensador automático de comida para mascotas', area: 'hogar',
    cliente: 'Dueños de gatos y perros que se ausentan',
    problema: 'Salir un fin de semana sin quien dé comida a las mascotas.',
    venta: 'Equipo con tolva impresa y horarios por celular. Pago único.',
    modelo: 'equipo', recurrente: false, proto: 40000, piloto: 130000, dias: 14, nivel: 2, valor: 2, demanda: 3,
    bom: [ESP, c('Servo MG996R', 'servo mg996r'), c('Celda de carga con HX711', 'celda de carga 5kg hx711'), c('Fuente 5 V 3 A', 'fuente 5v 3a')],
    riesgo: 'Bienestar animal: si falla, un animal pasa hambre. Pon batería de respaldo y aviso de error.',
    validar: 'Prueba el prototipo con un gato propio una semana y registra fallas.',
    primerPaso: 'Una tolva impresa, un servo y un horario sencillo en el ESP32.',
    meses: [12, 1, 2, 7], red220: false,
  },
  {
    id: 'pecera', nombre: 'Controlador de pecera (temperatura, luz y alimentación)', area: 'hogar',
    cliente: 'Acuaristas y tiendas de peces',
    problema: 'Un calefactor que falla o una luz olvidada afectan a los peces.',
    venta: 'Equipo con sensor de temperatura y enchufe controlado a baja tensión. Pago único.',
    modelo: 'equipo', recurrente: false, proto: 30000, piloto: 100000, dias: 12, nivel: 2, valor: 2, demanda: 2,
    bom: [ESP, c('Sensor DS18B20 sumergible', 'sensor temperatura ds18b20 sumergible'), c('Cinta LED 12 V', 'tira led 12v'), c('Módulo MOSFET', 'modulo mosfet pwm')],
    riesgo: 'Agua y electricidad: solo baja tensión y piezas selladas. No controles calefactores de 220 V sin certificación.',
    validar: 'Pregunta en grupos de acuarismo qué avisos les faltan y si pagarían por ellos.',
    primerPaso: 'DS18B20 en una pecera y aviso al celular cuando la temperatura salga de rango.',
    meses: [], red220: false,
  },
  {
    id: 'consumo', nombre: 'Medidor de consumo eléctrico con gráfico en el celular', area: 'hogar',
    cliente: 'Familias que quieren bajar la cuenta de luz',
    problema: 'No saben qué artefacto gasta más.',
    venta: 'Pinza amperométrica no invasiva + ESP32 + panel. Pago único.',
    modelo: 'equipo', recurrente: false, proto: 35000, piloto: 120000, dias: 20, nivel: 3, valor: 2, demanda: 3,
    bom: [ESP, c('Pinza amperométrica SCT-013', 'sensor corriente sct-013 30a'), c('Resistencia de carga y condensador', 'kit resistencias condensadores')],
    riesgo: 'Se trabaja cerca del tablero eléctrico: la instalación debe hacerla un instalador autorizado y el producto necesita cumplir normativa SEC.',
    validar: 'No lo vendas aún: pregunta cuántos pagarían y consulta los requisitos de certificación antes de gastar.',
    primerPaso: 'Medir el consumo de un solo artefacto con pinza SCT-013 en una protoboard, sin tocar el tablero.',
    meses: [5, 6, 7, 8], red220: true,
  },
  {
    id: 'piscina', nombre: 'Monitor de temperatura y pH de piscinas', area: 'hogar',
    cliente: 'Dueños de piscinas y administradores de condominios',
    problema: 'El agua se pone verde por falta de control y reponerla sale caro.',
    venta: 'Boya con sensores y aviso al celular. Equipo más mensualidad por temporada.',
    modelo: 'suscripcion', recurrente: true, proto: 50000, piloto: 180000, dias: 25, nivel: 3, valor: 3, demanda: 2,
    bom: [ESP, c('Sensor de temperatura DS18B20 sumergible', 'sensor temperatura ds18b20 sumergible'), c('Sonda de pH con módulo', 'sonda ph arduino modulo'), c('Panel solar 5 V', 'panel solar 5v 1w')],
    riesgo: 'Las sondas de pH necesitan calibración y duran poco: es lo que más soporte te va a pedir.',
    validar: 'Mide una piscina conocida durante dos semanas y compara con un kit de pH tradicional.',
    primerPaso: 'Boya impresa con ESP32 y DS18B20, y después sumar la sonda de pH.',
    meses: [10, 11, 12, 1, 2], red220: false,
  },
  {
    id: 'domotica', nombre: 'Instalación de domótica a medida (ESPHome y Home Assistant)', area: 'servicio',
    cliente: 'Familias y arrendadores que quieren automatizar luces, sensores y avisos',
    problema: 'Los productos comerciales no se hablan entre sí y la configuración les cuesta.',
    venta: 'Cobras por visita y por proyecto; luego una mensualidad opcional de mantención.',
    modelo: 'servicio', recurrente: false, proto: 25000, piloto: 60000, dias: 10, nivel: 2, valor: 3, demanda: 3,
    bom: [ESP, c('Módulo relé de 4 canales', 'modulo rele 4 canales 5v'), c('Mini PC o Raspberry Pi', 'raspberry pi 4 4gb')],
    riesgo: 'Seguridad eléctrica: solo dispositivos enchufables o bajo voltaje. Para 220 V fijo, un instalador autorizado.',
    validar: 'Automatiza gratis la casa de un conocido y pídele un testimonio y 2 referidos.',
    primerPaso: 'Instalar Home Assistant en tu casa con 3 sensores de ESP32 y un panel de avisos.',
    meses: [], red220: false,
  },
  // ---- Agro y huerta ----
  {
    id: 'riego', nombre: 'Riego automático con sensor de humedad para huertas y jardines', area: 'agro',
    cliente: 'Dueños de jardines, huertas urbanas y pequeños invernaderos',
    problema: 'Olvidan regar, o se van de vacaciones y las plantas mueren.',
    venta: 'Kit armado (bomba, sensor y controlador) y versión para instalar. Equipo, pago único.',
    modelo: 'equipo', recurrente: false, proto: 30000, piloto: 100000, dias: 10, nivel: 2, valor: 2, demanda: 3,
    bom: [ESP, c('Sensor de humedad de suelo capacitivo', 'sensor humedad suelo capacitivo'), c('Bomba de agua 5 V', 'bomba agua sumergible 5v'), c('Módulo relé', 'modulo rele 5v')],
    riesgo: 'Agua y electrónica: caja sellada, baja tensión y válvula de seguridad contra desbordes.',
    validar: 'Instala 2 kits a vecinos con huerta durante la primavera.',
    primerPaso: 'Una bomba pequeña que riegue una maceta cuando el sensor marque seco.',
    meses: [9, 10, 11, 12, 1, 2, 3], red220: false,
  },
  {
    id: 'invernadero', nombre: 'Monitor de invernadero (temperatura, humedad y luz)', area: 'agro',
    cliente: 'Pequeños productores, floricultores y cultivos indoor',
    problema: 'Una helada o un golpe de calor de noche destruye el cultivo sin que nadie lo vea.',
    venta: 'Equipo con panel solar y mensualidad por las alertas y el historial.',
    modelo: 'suscripcion', recurrente: true, proto: 35000, piloto: 120000, dias: 12, nivel: 2, valor: 3, demanda: 2,
    bom: [ESP, c('Sensor SHT31', 'sensor sht31'), c('Sensor de luz BH1750', 'sensor luz bh1750'), c('Panel solar 5 V', 'panel solar 5v 1w')],
    riesgo: 'Humedad dañina: caja sellada y sensores de calidad. Cobertura WiFi en el predio.',
    validar: 'Instala uno gratis en un invernadero conocido y pide cuánto pagarían por quedárselo.',
    primerPaso: 'SHT31 y BH1750 enviando datos a un panel cada 5 minutos.',
    meses: [5, 6, 7, 8, 9], red220: false,
  },
  {
    id: 'heladas', nombre: 'Alerta de helada para agricultores y viñas', area: 'agro',
    cliente: 'Pequeños agricultores y viñateros',
    problema: 'Una helada de primavera destruye la cosecha y hay que llegar antes para proteger.',
    venta: 'Sensor con panel solar y alerta SMS o Telegram. Equipo más mensualidad.',
    modelo: 'suscripcion', recurrente: true, proto: 80000, piloto: 300000, dias: 30, nivel: 3, valor: 3, demanda: 2,
    bom: [c('ESP32 con LoRa', 'esp32 lora sx1276'), c('Sensor DS18B20 sumergible', 'sensor temperatura ds18b20 sumergible'), c('Panel solar 6 V', 'panel solar 6v 3w'), c('Batería 18650', 'bateria 18650')],
    riesgo: 'Sin WiFi en el campo: necesita LoRa o red celular. Intemperie, polvo y animales.',
    validar: 'Habla con 3 agricultores antes de construir nada: pregunta cuánto pierden en una helada.',
    primerPaso: 'Dos ESP32 con LoRa que se comuniquen a más de 500 m con un sensor de temperatura.',
    meses: [7, 8, 9, 10], red220: false,
  },
  {
    id: 'gallinero', nombre: 'Puerta automática de gallinero con horario y sensor de luz', area: 'agro',
    cliente: 'Familias con gallinas y pequeños predios',
    problema: 'Hay que abrir y cerrar la puerta cada mañana y noche; si se olvida, entran zorros.',
    venta: 'Kit con motor, controlador y estructura impresa. Equipo, pago único.',
    modelo: 'equipo', recurrente: false, proto: 40000, piloto: 130000, dias: 14, nivel: 2, valor: 2, demanda: 2,
    bom: [ESP, c('Motor DC con reductor 12 V', 'motor dc reductor 12v'), c('Sensor de luz LDR', 'sensor luz ldr'), c('Finales de carrera', 'micro switch final de carrera'), c('Fuente 12 V', 'fuente 12v 2a')],
    riesgo: 'Debe fallar en modo seguro (puerta cerrada) y no dañar a los animales: motor limitado en fuerza.',
    validar: 'Instala uno en un gallinero conocido durante el invierno y mira su opinión.',
    primerPaso: 'Un motor que abra y cierre una compuerta de prueba según el horario y la luz.',
    meses: [], red220: false,
  },
  {
    id: 'colmenas', nombre: 'Monitor de colmenas (peso, temperatura y humedad)', area: 'agro',
    cliente: 'Apicultores',
    problema: 'Abrir las colmenas las estresa y no saben cuánta miel hay ni si están sanas.',
    venta: 'Balanza con sensores y panel solar. Equipo más mensualidad por el historial.',
    modelo: 'suscripcion', recurrente: true, proto: 60000, piloto: 200000, dias: 25, nivel: 3, valor: 2, demanda: 1,
    bom: [ESP, c('Celda de carga 50 kg con HX711', 'celda de carga 50kg hx711'), c('Sensor SHT31', 'sensor sht31'), c('Panel solar 5 V', 'panel solar 5v 1w')],
    riesgo: 'Nicho pequeño y exigente: sigue mejor la compra de uno o dos clientes conocidos.',
    validar: 'Consulta con una asociación de apicultores qué dato les ahorraría más viajes.',
    primerPaso: 'Una balanza con celda de carga y HX711 que registre el peso cada hora.',
    meses: [9, 10, 11, 12], red220: false,
  },
  // ---- Objetos NeoProxy ----
  {
    id: 'lampara', nombre: 'Lámpara ciberpunk reactiva al sonido o a la hora', area: 'deco',
    cliente: 'Gamers, streamers y gente que decora su escritorio',
    problema: 'Quieren una pieza diferente, con estética propia, no la luz de plástico de siempre.',
    venta: 'Lámpara con difusor impreso en resina o PLA y LEDs programables. Pago único; edición limitada.',
    modelo: 'equipo', recurrente: false, proto: 25000, piloto: 80000, dias: 7, nivel: 1, valor: 2, demanda: 2,
    bom: [ESP, c('Tira LED WS2812B', 'tira led ws2812b 1m'), c('Micrófono MAX4466', 'microfono max4466'), c('Fuente USB 5 V', 'cargador usb 5v 2a')],
    riesgo: 'Bajo si es USB de 5 V. El difusor y los acabados son el 80 % del valor percibido.',
    validar: 'Publica el video de la lámpara funcionando y recibe pedidos con 50 % de anticipo.',
    primerPaso: 'Una tira WS2812B que reaccione al sonido con un micrófono MAX4466.',
    meses: [11, 12, 2, 5, 6], red220: false,
  },
  {
    id: 'figuras-nfc', nombre: 'Figuras de los agentes del Proxyverse con chip NFC que abre su perfil', area: 'deco',
    cliente: 'Quienes ya siguen NeoProxy y coleccionistas de arte generativo',
    problema: 'Las figuras de resina son lindas pero mudas: no cuentan la historia.',
    venta: 'Figura impresa en resina con un NFC escondido en la base que abre el perfil y el lore del agente. Edición numerada.',
    modelo: 'equipo', recurrente: false, proto: 15000, piloto: 50000, dias: 10, nivel: 1, valor: 2, demanda: 2,
    bom: [c('Pegatinas NFC NTAG213', 'nfc ntag213 pegatina'), c('Resina 405 nm 1 kg', 'resina 405nm 1kg')],
    riesgo: 'Es tuyo (arte y lore propios): sin problema de derechos. La demanda depende de tu audiencia.',
    validar: 'Sortea 3 figuras en Instagram y mide cuántos las piden en preventa.',
    primerPaso: 'Imprimir un agente en resina, esconder la pegatina NFC en la base y enlazar su perfil.',
    meses: [11, 12, 2, 5, 6], red220: false,
  },
  {
    id: 'placa-mascota', nombre: 'Placa NFC para mascotas con ficha de contacto', area: 'nfc',
    cliente: 'Dueños de perros y gatos',
    problema: 'Si la mascota se pierde, una placa con número se desgasta; una con ficha en línea siempre está al día.',
    venta: 'Placa impresa en PLA o resina con NFC que abre una ficha editable. Pago único.',
    modelo: 'equipo', recurrente: false, proto: 8000, piloto: 30000, dias: 3, nivel: 1, valor: 1, demanda: 3,
    bom: [c('Pegatinas NFC NTAG213', 'nfc ntag213 pegatina')],
    riesgo: 'Bajo precio: necesita volumen. Cuida los datos del dueño (solo lo que él quiera mostrar).',
    validar: 'Ofrécelas en una feria de mascotas o a un veterinario con descuento por lote.',
    primerPaso: 'Una placa impresa que abra una ficha simple con el nombre y el teléfono.',
    meses: [], red220: false,
  },
  // ---- Para makers ----
  {
    id: 'secador-filamento', nombre: 'Caja secadora de filamento con control de humedad', area: 'maker',
    cliente: 'Dueños de impresoras 3D',
    problema: 'El filamento húmedo hace burbujas y pierde resistencia; con la humedad del invierno es peor.',
    venta: 'Caja con calefactor de baja tensión y sensor, lista para usar. Equipo, pago único.',
    modelo: 'equipo', recurrente: false, proto: 30000, piloto: 90000, dias: 10, nivel: 2, valor: 2, demanda: 3,
    bom: [ESP, c('Sensor SHT31', 'sensor sht31'), c('Calefactor PTC 12 V', 'calefactor ptc 12v'), c('Ventilador 5 V', 'ventilador 5v 40mm'), c('Fuente 12 V', 'fuente 12v 5a')],
    riesgo: 'Calor y plástico: piezas calientes en PETG o ABS, límite de temperatura por software y por fusible.',
    validar: 'Ofrécelo en grupos de Facebook de impresión 3D en Chile con foto y precio.',
    primerPaso: 'Una caja con sensor y calefactor que mantenga 45 °C medidos con el SHT31.',
    meses: [5, 6, 7, 8, 9], red220: false,
  },
  {
    id: 'monitor-impresora', nombre: 'Monitor de impresora 3D con cámara y aviso de falla', area: 'maker',
    cliente: 'Makers y pequeñas granjas de impresión',
    problema: 'Una impresión de 20 horas que falla de noche gasta material y tiempo.',
    venta: 'Cámara ESP32-CAM con soporte impreso y aviso al celular. Equipo, pago único.',
    modelo: 'equipo', recurrente: false, proto: 30000, piloto: 100000, dias: 20, nivel: 3, valor: 2, demanda: 2,
    bom: [c('ESP32-CAM', 'esp32-cam'), c('Sensor de temperatura', 'sensor temperatura ds18b20'), c('Módulo relé', 'modulo rele 5v')],
    riesgo: 'Nicho que ya cubren Bambu Lab y OctoPrint: ofrece algo más simple y más barato.',
    validar: 'Pregunta en grupos de impresión 3D cuánto pagarían por algo que avise cuando falle.',
    primerPaso: 'Una ESP32-CAM transmitiendo video local con un soporte para tu impresora.',
    meses: [], red220: false,
  },
  // ---- Educación ----
  {
    id: 'kits-colegios', nombre: 'Kits de electrónica para colegios (ESP32, sensores y guía)', area: 'educacion',
    cliente: 'Profesores, colegios y academias de tecnología',
    problema: 'Faltan kits ordenados con guía en castellano y proyectos listos para hacer en clase.',
    venta: 'Kit con componentes y guía (basada en SUSTRATO), vendido por curso. Pago único.',
    modelo: 'equipo', recurrente: false, proto: 40000, piloto: 150000, dias: 20, nivel: 2, valor: 2, demanda: 2,
    bom: [ESP, c('Kit de sensores', 'kit sensores arduino 37 en 1'), c('Protoboard y cables', 'protoboard cables dupont')],
    riesgo: 'Venta por licitación o convenio puede ser lenta. Empieza con 1 colegio o taller.',
    validar: 'Ofrece una clase demo gratuita en un colegio o academia y pide una compra piloto.',
    primerPaso: 'Armar una guía de 3 proyectos de 45 minutos con ESP32 y sensores.',
    meses: [3, 4, 8, 9], red220: false,
  },
  {
    id: 'talleres', nombre: 'Talleres de electrónica y ESP32 (presencial u online)', area: 'educacion',
    cliente: 'Adolescentes, adultos que quieren aprender y vacaciones de niños',
    problema: 'Quieren aprender haciendo, con alguien que explique en castellano.',
    venta: 'Cupos por taller, con material incluido. Pago por cupo.',
    modelo: 'curso', recurrente: false, proto: 0, piloto: 30000, dias: 14, nivel: 1, valor: 2, demanda: 2,
    bom: [ESP, c('Kit de sensores', 'kit sensores arduino 37 en 1')],
    riesgo: 'Tu tiempo es el costo: calcula por hora. Necesitas un lugar o una plataforma.',
    validar: 'Abre 6 cupos por Instagram a precio bajo y mide cuántos se llenan.',
    primerPaso: 'Un taller de 2 horas: «tu primer sensor con alerta al celular».',
    meses: [1, 2, 7, 3, 4], red220: false,
  },
  {
    id: 'curso-online', nombre: 'Curso grabado de ESP32 y sensores en castellano', area: 'educacion',
    cliente: 'Aficionados y estudiantes de toda Latinoamérica',
    problema: 'Muchos tutoriales están en inglés, desordenados o desactualizados.',
    venta: 'Curso grabado con proyectos y soporte por chat, vendido muchas veces sin costo extra.',
    modelo: 'digital', recurrente: false, proto: 20000, piloto: 40000, dias: 45, nivel: 1, valor: 2, demanda: 2,
    bom: [c('Micrófono USB', 'microfono usb condensador')],
    riesgo: 'Cuesta mucho tiempo y el mercado tiene competidores. La ventaja es tu estilo y tus proyectos.',
    validar: 'Publica la primera lección gratis y pide correos para un aviso de lanzamiento.',
    primerPaso: 'Grabar y publicar una lección de 10 minutos sobre tu primer ESP32.',
    meses: [], red220: false,
  },
  {
    id: 'iot-medida', nombre: 'Prototipos IoT a pedido para emprendedores', area: 'servicio',
    cliente: 'Emprendedores y pymes con una idea que no saben construir',
    problema: 'Tienen la idea pero no a quién pedírsela, y las agencias cobran mucho.',
    venta: 'Cobras por hora o por prototipo cerrado; luego fabricación en serie si resulta.',
    modelo: 'servicio', recurrente: false, proto: 15000, piloto: 40000, dias: 7, nivel: 2, valor: 3, demanda: 2,
    bom: [ESP, c('Kit de sensores', 'kit sensores arduino 37 en 1')],
    riesgo: 'Alcance abierto: cobra un anticipo y define por escrito qué incluye el prototipo.',
    validar: 'Publica 3 casos de ejemplo y pregunta en grupos de emprendedores qué necesitan.',
    primerPaso: 'Hacer una ficha de servicio con precio por hora y 3 ejemplos de lo que puedes construir.',
    meses: [], red220: false,
  },
  {
    id: 'aire-barrio', nombre: 'Estación de aire para colegios y juntas de vecinos con panel público', area: 'ambiente',
    cliente: 'Colegios, juntas de vecinos y municipios pequeños',
    problema: 'Quieren datos de su barrio, no los de la estación oficial más cercana, lejos y a veces apagada.',
    venta: 'Estación instalada más una mensualidad por el panel público y el mantenimiento.',
    modelo: 'suscripcion', recurrente: true, proto: 90000, piloto: 320000, dias: 30, nivel: 3, valor: 2, demanda: 1,
    bom: [ESP, c('Sensor de partículas PMS5003', 'sensor pms5003'), c('Sensor BME280', 'sensor bme280'), c('Panel solar 5 V', 'panel solar 5v 1w')],
    riesgo: 'Datos sensibles políticamente: aclara siempre que es indicativo. Ventas con el sector público son lentas.',
    validar: 'Instala una estación en un colegio conocido y pide que la usen en una clase.',
    primerPaso: 'PMS5003 con ESP32 enviando datos a una página pública simple.',
    meses: [5, 6, 7, 8, 9], red220: false,
  },
]

// ---------------------------------------------------------------------------------
// Puntaje: qué conviene mirar primero hoy, con tu plata y en esta época del año.

export type Puntaje = { total: number; razones: string[]; alcanza: boolean | null; enTemporada: boolean }
const dentro = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function puntajeProyecto(p: Proyecto, presupuesto: number, hoy = new Date()): Puntaje {
  const mes = hoy.getMonth() + 1
  const enTemporada = p.meses.includes(mes)
  const faltan = p.meses.length ? Math.min(...p.meses.map((m) => (m - mes + 12) % 12)) : 99
  const razones: string[] = []
  let t = 10
  t += (p.valor - 1) * 10 + (p.demanda - 1) * 8 + (3 - p.nivel) * 8
  t += p.dias <= 7 ? 8 : p.dias <= 14 ? 5 : p.dias <= 30 ? 2 : 0
  if (p.recurrente) { t += 14; razones.push('ingreso mensual') }
  if (enTemporada) { t += 10; razones.push('en temporada ahora') }
  else if (p.meses.length && faltan >= 1 && faltan <= 2) { t += 6; razones.push(`su temporada empieza en ${faltan === 1 ? 'un mes' : 'dos meses'}`) }
  else if (!p.meses.length) t += 4
  let alcanza: boolean | null = null
  if (presupuesto > 0) {
    alcanza = p.proto <= presupuesto
    if (alcanza) { t += 12; razones.push('el prototipo cabe en tu presupuesto') }
    else { t -= 12; razones.push('el prototipo supera tu presupuesto') }
    if (alcanza && p.piloto <= presupuesto) { t += 4; razones.push('alcanza hasta para unidades piloto') }
  } else {
    t += p.proto <= 20000 ? 6 : p.proto <= 50000 ? 3 : 0
  }
  if (p.red220) { t -= 12; razones.push('220 V: pide certificación') }
  if (p.nivel === 1) razones.push('técnicamente simple')
  return { total: dentro(Math.round(t), 0, 100), razones, alcanza, enTemporada }
}

// Semana del año (lunes a domingo, ISO): rota la «idea de la semana» sin servidor.
export function semanaISO(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dia = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dia)
  const ini = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - ini.getTime()) / 86400000 + 1) / 7)
}
export function ideaDeLaSemana(lista: Proyecto[], presupuesto: number, hoy = new Date()) {
  const top = [...lista].sort((a, b) => puntajeProyecto(b, presupuesto, hoy).total - puntajeProyecto(a, presupuesto, hoy).total || a.id.localeCompare(b.id)).slice(0, 8)
  return top.length ? top[semanaISO(hoy) % top.length] : undefined
}

// ---------------------------------------------------------------------------------
// Banco: las ideas que guardas, con su estado, tus notas y el último re-análisis.

export type EstadoB = 'nueva' | 'estudio' | 'validando' | 'prototipo' | 'descartada'
export const ESTADOS_B: { k: EstadoB; label: string }[] = [
  { k: 'nueva', label: 'NUEVA' }, { k: 'estudio', label: 'EN ESTUDIO' }, { k: 'validando', label: 'VALIDANDO' },
  { k: 'prototipo', label: 'A PROTOTIPO' }, { k: 'descartada', label: 'DESCARTADA' },
]
export type Veredicto = 'invertir-ya' | 'validar' | 'esperar' | 'descartar'
export const VEREDICTO_LABEL: Record<Veredicto, string> = { 'invertir-ya': 'INVERTIR YA', validar: 'VALIDAR PRIMERO', esperar: 'ESPERAR LA TEMPORADA', descartar: 'DESCARTAR' }
const VEREDICTOS = Object.keys(VEREDICTO_LABEL) as Veredicto[]
export type Analisis = { fecha: number; puntaje: number; veredicto: Veredicto; razon: string; paso: string }
export type Entrada = { p: Proyecto; fuente: 'catalogo' | 'ia'; estado: EstadoB; notas: string; agregado: number; analisis?: Analisis }

export const DIAS_REANALISIS = 30

// ---------------------------------------------------------------------------------
// Validación de lo que llega de fuera (IA o localStorage): nada se confía tal cual.

const slug = (q: string) => q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const txt = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const entero = (v: unknown, a: number, b: number, def: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(dentro(v, a, b)) : def)
const nivel3 = (v: unknown, def: 1 | 2 | 3): 1 | 2 | 3 => (v === 1 || v === 2 || v === 3 ? v : def)

export function limpiarProyecto(raw: unknown, prefijo = ''): Proyecto | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const nombre = txt(r.nombre, 120), cliente = txt(r.cliente, 240), problema = txt(r.problema, 400), venta = txt(r.venta, 400)
  if (!nombre || !cliente || !problema || !venta) return null
  const area = AREAS.includes(r.area as Area) ? (r.area as Area) : 'negocios'
  const modelo = MODELOS.includes(r.modelo as Modelo) ? (r.modelo as Modelo) : 'equipo'
  const proto = entero(r.proto, 0, 5_000_000, 30000)
  const bom = (Array.isArray(r.bom) ? r.bom : []).slice(0, 8).map((b): Componente | null => {
    const o = (b ?? {}) as Record<string, unknown>
    const n = txt(o.n, 80), q = txt(o.q, 80)
    return n && q.length >= 2 ? { n, q, cant: entero(o.cant, 1, 50, 1) } : null
  }).filter((b): b is Componente => !!b)
  const meses = [...new Set((Array.isArray(r.meses) ? r.meses : []).filter((m): m is number => typeof m === 'number' && m >= 1 && m <= 12).map(Math.round))].sort((a, b) => a - b)
  const id = typeof r.id === 'string' && /^[a-z0-9-]{1,60}$/i.test(r.id) ? r.id : `${prefijo}${slug(nombre).slice(0, 50)}`
  return {
    id, nombre, area, cliente, problema, venta, modelo,
    recurrente: r.recurrente === true,
    proto, piloto: Math.max(proto, entero(r.piloto, 0, 20_000_000, proto * 3)),
    dias: entero(r.dias, 1, 365, 14), nivel: nivel3(r.nivel, 2), valor: nivel3(r.valor, 2), demanda: nivel3(r.demanda, 2),
    bom, riesgo: txt(r.riesgo, 400), validar: txt(r.validar, 400), primerPaso: txt(r.primerPaso, 300), meses, red220: r.red220 === true,
  }
}

export function limpiarAnalisis(raw: unknown): Analisis | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const veredicto = VEREDICTOS.includes(r.veredicto as Veredicto) ? (r.veredicto as Veredicto) : null
  if (!veredicto) return undefined
  return { fecha: entero(r.fecha, 0, 8.64e15, 0), puntaje: entero(r.puntaje, 0, 100, 50), veredicto, razon: txt(r.razon, 400), paso: txt(r.paso, 300) }
}

export function limpiarEntrada(raw: unknown): Entrada | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const p = limpiarProyecto(r.p)
  if (!p) return null
  const estado = ESTADOS_B.some((e) => e.k === r.estado) ? (r.estado as EstadoB) : 'nueva'
  return { p, fuente: r.fuente === 'ia' ? 'ia' : 'catalogo', estado, notas: typeof r.notas === 'string' ? r.notas.slice(0, 2000) : '', agregado: entero(r.agregado, 0, 8.64e15, 0), analisis: limpiarAnalisis(r.analisis) }
}

export const sinAnalizar = (e: Entrada, ahora = Date.now()) => e.estado !== 'descartada' && (!e.analisis || ahora - e.analisis.fecha > DIAS_REANALISIS * 86400000)
