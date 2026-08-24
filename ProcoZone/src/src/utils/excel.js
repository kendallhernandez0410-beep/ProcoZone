/* ============================================
   ProcoZone — Exportación a Excel (.xlsx)
   Genera un paquete Open XML válido (ZIP con
   método STORE) sin dependencias externas.
   API: descargarXlsx(hoja, columnas, filas, nombreBase)
   ============================================ */

/* Tabla CRC32 precalculada */
const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) crc = TABLA_CRC[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/** Fecha/hora en formato MS-DOS para las cabeceras ZIP */
function fechaDos(fecha = new Date()) {
  const tiempo = {
    hora: fecha.getHours(),
    minuto: fecha.getMinutes(),
    dia: fecha.getDate(),
    mes: fecha.getMonth() + 1,
    anio: Math.max(fecha.getFullYear() - 1980, 0)
  };
  return {
    tiempo: (tiempo.hora << 11) | (tiempo.minuto << 5),
    fecha: (tiempo.anio << 9) | (tiempo.mes << 5) | tiempo.dia
  };
}

/** Empaqueta archivos en un ZIP sin compresión (STORE) */
function crearZip(archivos) {
  const { tiempo, fecha } = fechaDos();
  const locales = [];
  const centrales = [];
  let offset = 0;

  for (const archivo of archivos) {
    const nombre = new TextEncoder().encode(archivo.nombre);
    const datos = archivo.datos;
    const suma = crc32(datos);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);      // firma
    local.setUint16(4, 20, true);              // versión necesaria
    local.setUint16(6, 0x0800, true);          // bandera UTF-8
    local.setUint16(8, 0, true);               // método STORE
    local.setUint16(10, tiempo, true);
    local.setUint16(12, fecha, true);
    local.setUint32(14, suma, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nombre.length, true);
    local.setUint16(28, 0, true);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);    // firma
    central.setUint16(4, 20, true);            // versión creada por
    central.setUint16(6, 20, true);            // versión necesaria
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, tiempo, true);
    central.setUint16(14, fecha, true);
    central.setUint32(16, suma, true);
    central.setUint32(20, datos.length, true);
    central.setUint32(24, datos.length, true);
    central.setUint16(28, nombre.length, true);
    central.setUint32(42, offset, true);       // offset del registro local

    locales.push({ cabecera: new Uint8Array(local.buffer), nombre, datos });
    centrales.push({ cabecera: new Uint8Array(central.buffer), nombre });
    offset += 30 + nombre.length + datos.length;
  }

  const tamañoDirectorio = centrales.reduce((suma, entrada) => suma + 46 + entrada.nombre.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);          // firma EOCD
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamañoDirectorio, true);
  fin.setUint32(16, offset, true);

  const partes = [];
  for (const entrada of locales) { partes.push(entrada.cabecera, entrada.nombre, entrada.datos); }
  for (const entrada of centrales) { partes.push(entrada.cabecera, entrada.nombre); }
  partes.push(new Uint8Array(fin.buffer));

  return new Blob(partes, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

const escaparXml = (valor) => String(valor ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Convierte un índice (1-based) a letras de columna: A, B, … AA */
function letraColumna(indice) {
  let letras = '';
  while (indice > 0) {
    const resto = (indice - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    indice = Math.floor((indice - 1) / 26);
  }
  return letras;
}

function celdaXml(fila, columna, valor) {
  const referencia = `${letraColumna(columna)}${fila}`;
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return `<c r="${referencia}"><v>${valor}</v></c>`;
  }
  const texto = escaparXml(valor ?? '');
  return `<c r="${referencia}" t="inlineStr" xml:space="preserve"><is><t>${texto}</t></is></c>`;
}

/**
 * Descarga un .xlsx con una hoja de cálculo.
 * columnas: [string] · filas: [[string|number]] · nombreBase: sin extensión
 */
export function descargarXlsx(nombreHoja, columnas, filas, nombreBase) {
  const ancho = columnas.length;
  const filasXml = [
    `<row>${columnas.map((columna, i) => celdaXml(1, i + 1, columna)).join('')}</row>`,
    ...filas.map((fila, f) => `<row>${fila.slice(0, ancho).map((valor, c) => celdaXml(f + 2, c + 1, valor)).join('')}</row>`)
  ].join('');

  const declaracion = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const archivos = [
    {
      nombre: '[Content_Types].xml',
      datos: new TextEncoder().encode(`${declaracion}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`)
    },
    {
      nombre: '_rels/.rels',
      datos: new TextEncoder().encode(`${declaracion}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)
    },
    {
      nombre: 'xl/workbook.xml',
      datos: new TextEncoder().encode(`${declaracion}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escaparXml(nombreHoja)}" sheetId="1" r:id="rId1"/></sheets></workbook>`)
    },
    {
      nombre: 'xl/_rels/workbook.xml.rels',
      datos: new TextEncoder().encode(`${declaracion}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`)
    },
    {
      nombre: 'xl/worksheets/sheet1.xml',
      datos: new TextEncoder().encode(`${declaracion}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${columnas.map((_, i) => `<col min="${i + 1}" max="${i + 1}" width="22" customWidth="1"/>`).join('')}</cols><sheetData>${filasXml}</sheetData></worksheet>`)
    }
  ];

  const blob = crearZip(archivos);
  const url = URL.createObjectURL(blob);
  const enlace = Object.assign(document.createElement('a'), {
    href: url,
    download: `${nombreBase}-${new Date().toISOString().slice(0, 10)}.xlsx`
  });
  enlace.click();
  URL.revokeObjectURL(url);
}
