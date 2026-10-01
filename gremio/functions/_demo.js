// Datos INVENTADOS para el modo demostración (no son productos ni costos reales).
const mk = (cat, g, c, d, costo, e = '') => ({ cat, g, c, d, costo, e });
export const DEMO = {
  minimo: 250000,
  actualizado: '2026-10-01T12:00:00Z',
  perfiles: {
    gremio: { etiqueta: 'Gremio', markup: 0.4 },
    integrador: { etiqueta: 'Integrador', markup: 0.3 },
    distribuidor: { etiqueta: 'Distribuidor / Proyecto', markup: 0.2 },
  },
  usuarios: [
    { email: 'gremio@demo.com', codigo: 'demo', perfil: 'gremio', nombre: 'Cliente Gremio (demo)' },
    { email: 'integrador@demo.com', codigo: 'demo', perfil: 'integrador', nombre: 'Cliente Integrador (demo)' },
    { email: 'distribuidor@demo.com', codigo: 'demo', perfil: 'distribuidor', nombre: 'Cliente Distribuidor (demo)' },
  ],
  items: [
    mk('Cámaras IP', 'Bullet', 'DEMO-B2', 'Cámara IP bullet 2MP | Exterior | IR 30M | PoE | Lente 2.8mm', 50000),
    mk('Cámaras IP', 'Bullet', 'DEMO-B4', 'Cámara IP bullet 4MP | Exterior | IR 30M | PoE | Micrófono', 78000),
    mk('Cámaras IP', 'Domo', 'DEMO-D2', 'Cámara IP domo 2MP | Interior/Exterior | IR 30M | PoE', 52000),
    mk('Cámaras IP', 'Domo', 'DEMO-D4', 'Cámara IP domo 4MP | Exterior | IR 30M | PoE | Detección de personas', 84000),
    mk('Cámaras IP', 'PTZ', 'DEMO-PTZ', 'Cámara PTZ 2MP | Zoom x25 | IR 100M | PoE+', 690000, 'sin_stock'),
    mk('Grabadores', 'NVR', 'DEMO-N4', 'NVR 4 canales | 4K | PoE | 1 disco hasta 8TB', 150000),
    mk('Grabadores', 'NVR', 'DEMO-N8', 'NVR 8 canales | 4K | PoE | 2 discos hasta 8TB c/u', 260000),
    mk('Grabadores', 'DVR', 'DEMO-X4', 'DVR 4 canales | 1080P | 5 en 1 | 1 disco', 65000),
    mk('Control de acceso', 'Terminales', 'DEMO-FACE', 'Terminal facial | Pantalla 7" | Tarjeta y app | Registro de eventos', 380000),
    mk('Control de acceso', 'Lectores', 'DEMO-RFID', 'Lector de tarjeta RFID | Wiegand | Exterior', 22000),
    mk('Control de acceso', 'Cerraduras', 'DEMO-CER', 'Cerradura electromagnética 300 kg | Con soporte', 31000),
    mk('Redes', 'Switches', 'DEMO-SW8', 'Switch PoE 8 puertos | 10/100 | 2 uplink', 72000),
    mk('Redes', 'Switches', 'DEMO-SW16', 'Switch PoE 16 puertos | Gigabit | 2 SFP', 190000),
    mk('Redes', 'Cable', 'DEMO-UTP', 'Bobina UTP Cat5e exterior | 305 m', 120000),
    mk('Accesorios', 'Fuentes', 'DEMO-F12', 'Fuente 12V 5A | Con ficha', 11000),
    mk('Accesorios', 'Racks', 'DEMO-R12', 'Rack mural 12U | Puerta de vidrio | Con llave', 210000),
    mk('Accesorios', 'Baterías', 'DEMO-BAT', 'Batería recargable 12V 7Ah', 14000),
    mk('Liquidaciones', '', 'DEMO-L1', 'Kit 4 cámaras bullet 1080P + DVR 4 canales', 130000),
    mk('Liquidaciones', '', 'DEMO-L2', 'Kit 2 cámaras domo 1080P + DVR 4 canales', 0, 'consultar'),
  ],
};
