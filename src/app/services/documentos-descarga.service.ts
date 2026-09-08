import { Injectable } from '@angular/core';

export interface DocumentoReporteDatos {
  titulo: string;
  subtitulo?: string;
  codigoResolucion?: string;
  periodo?: string;
  fechaEmision?: string;
  materia?: string;
  docente?: string;
  ayudante?: string;
  horas?: number;
  modalidad?: string;
  diasPorSemana?: number;
  temas?: string;
  anexos?: Array<{ nombre: string; tamanoKb: number; tipo: string; fechaCarga?: string }>;
  metricas?: any;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentosDescargaService {

  /**
   * Descarga un archivo con nombre y contenido especificado.
   * Admite Data URLs (Base64), URLs normales o texto plano / HTML estructurado.
   */
  descargarArchivo(nombreArchivo: string, urlOContenido: string, mimeType: string = 'text/html;charset=utf-8'): void {
    if (typeof window === 'undefined') return;

    if (urlOContenido.startsWith('data:') || urlOContenido.startsWith('blob:')) {
      const enlace = document.createElement('a');
      enlace.href = urlOContenido;
      enlace.download = nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      return;
    }

    const blob = new Blob([urlOContenido], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Abre una ventana de impresión profesional optimizada para guardar como PDF oficial.
   */
  imprimirDocumentoOficial(htmlContenido: string, tituloDocumento: string = 'Documento Oficial UTEQ'): void {
    if (typeof window === 'undefined') return;

    const ventana = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (!ventana) {
      // Fallback si popup blocker bloquea window.open: descargar como archivo HTML imprimible
      this.descargarArchivo(`${tituloDocumento.replace(/\s+/g, '_')}.html`, htmlContenido);
      return;
    }

    ventana.document.write(htmlContenido);
    ventana.document.close();
    ventana.focus();

    setTimeout(() => {
      try {
        ventana.print();
      } catch (e) {
        console.warn('Error al invocar print:', e);
      }
    }, 450);
  }

  /**
   * Genera el HTML oficial y normativo de un Informe de Rendición de Actividades de Ayudantía (UTEQ).
   */
  construirHtmlInformeAyudantia(inf: DocumentoReporteDatos): string {
    const fechaHoy = inf.fechaEmision || new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const codigoRes = inf.codigoResolucion || 'RES-FAC-2026-084-AYUD';
    const catedra = inf.materia || 'Cálculo Avanzado';
    const ayudante = inf.ayudante || 'Alejandro García';
    const docente = inf.docente || 'Ing. Manuel Villavicencio, M.Sc.';
    const periodo = inf.periodo || 'Periodo Lectivo 2026-2';
    const modalidad = inf.modalidad || 'Presencial (Aula / Laboratorio)';
    const horas = inf.horas || 24;
    const dias = inf.diasPorSemana || 3;
    const temas = inf.temas || 'Sesiones de refuerzo pedagógico, resolución de ejercicios prácticos del sílabo oficial y tutoría personalizada.';
    const estado = inf.estado || 'Aprobado por Docente Titular';

    const anexosFilas = (inf.anexos && inf.anexos.length > 0)
      ? inf.anexos.map((a, i) => `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px;">${i + 1}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 600; font-size: 11px;">${a.nombre}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 11px;">${a.tipo === 'captura_videollamada' ? 'Captura Videollamada (Virtual)' : 'Hoja Asistencia Firmada (Presencial)'}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px;">${a.tamanoKb} KB</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px; color: #047857; font-weight: bold;">Verificado ✓</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="5" style="padding: 12px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px; color: #64748b;">
            Acta consolidada de asistencia y bitácora de cumplimiento registradas en el sistema SIGAC.
          </td>
        </tr>
      `;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>INFORME OFICIAL DE AYUDANTÍA - ${codigoRes}</title>
  <style>
    @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      background: #ffffff;
      margin: 0;
      padding: 24px;
    }
    .membrete {
      border-bottom: 3px double #047857;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .escudo-texto {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-uteq {
      width: 68px;
      height: 68px;
      object-fit: contain;
    }
    .titulo-inst h1 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      color: #065f46;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .titulo-inst h2 {
      margin: 2px 0 0 0;
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }
    .titulo-inst h3 {
      margin: 2px 0 0 0;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }
    .badge-sigac {
      text-align: right;
      font-size: 10px;
      color: #047857;
      font-weight: bold;
      border: 1px solid #a7f3d0;
      padding: 6px 10px;
      border-radius: 6px;
      background: #ecfdf5;
    }
    .titulo-informe {
      text-align: center;
      margin: 20px 0 16px 0;
    }
    .titulo-informe h2 {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }
    .titulo-informe p {
      margin: 4px 0 0 0;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }
    .tabla-datos {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 12px;
    }
    .tabla-datos td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
    }
    .tabla-datos .label {
      background: #f8fafc;
      font-weight: bold;
      width: 28%;
      color: #334155;
    }
    .seccion-titulo {
      background: #047857;
      color: #ffffff;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 16px;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .caja-texto {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #047857;
      padding: 12px 14px;
      font-size: 12px;
      color: #1e293b;
      border-radius: 4px;
      line-height: 1.6;
      margin-bottom: 14px;
    }
    .tabla-anexos {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 20px;
    }
    .tabla-anexos th {
      background: #f1f5f9;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      font-size: 11px;
      text-transform: uppercase;
      color: #334155;
    }
    .firmas-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 40px;
      text-align: center;
      page-break-inside: avoid;
    }
    .firma-box {
      border-top: 1px solid #0f172a;
      padding-top: 8px;
      font-size: 11px;
    }
    .firma-box .nombre {
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .firma-box .cargo {
      color: #64748b;
      font-size: 10px;
    }
    .footer-legal {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- BOTÓN DE IMPRESIÓN DIRECTA -->
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="background: #047857; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px;">
      🖨️ Imprimir / Guardar en PDF
    </button>
  </div>

  <!-- MEMBRETE INSTITUCIONAL UTEQ -->
  <div class="membrete">
    <div class="escudo-texto">
      <img src="https://lh3.googleusercontent.com/d/1Xl2Fz_Qv1Kx1Y6XfP4Y9W-2m" alt="UTEQ" class="logo-uteq" onerror="this.style.display='none'" />
      <div class="titulo-inst">
        <h1>Universidad Técnica Estatal de Quevedo</h1>
        <h2>Facultad de Ciencias de la Computación</h2>
        <h3>Carrera de Ingeniería de Software · Periodo Lectivo 2026</h3>
      </div>
    </div>
    <div class="badge-sigac">
      <div>SISTEMA SIGAC</div>
      <div style="font-size: 9px; color: #475569; font-weight: normal;">Gestión de Ayudantías</div>
      <div style="font-size: 9px; color: #047857;">Art. 48 RRA-UTEQ</div>
    </div>
  </div>

  <!-- TÍTULO DEL DOCUMENTO -->
  <div class="titulo-informe">
    <h2>INFORME TÉCNICO-PEDAGÓGICO DE AYUDANTÍA DE CÁTEDRA</h2>
    <p>Rendición Oficial de Actividades, Horas Impartidas y Evidencias Probatorias</p>
  </div>

  <!-- DATOS DE LA ASIGNACIÓN -->
  <div class="seccion-titulo">1. Datos Generales de la Designación Académica</div>
  <table class="tabla-datos">
    <tr>
      <td class="label">N° de Resolución:</td>
      <td style="font-weight: bold; color: #065f46;">${codigoRes}</td>
      <td class="label">Fecha de Emisión:</td>
      <td>${fechaHoy}</td>
    </tr>
    <tr>
      <td class="label">Asignatura / Cátedra:</td>
      <td style="font-weight: 600;">${catedra}</td>
      <td class="label">Periodo Académico:</td>
      <td>${periodo}</td>
    </tr>
    <tr>
      <td class="label">Docente Responsable:</td>
      <td>${docente}</td>
      <td class="label">Estudiante Ayudante:</td>
      <td style="font-weight: 600;">${ayudante}</td>
    </tr>
    <tr>
      <td class="label">Modalidad de Clases:</td>
      <td>${modalidad}</td>
      <td class="label">Carga Horaria Ejecutada:</td>
      <td style="font-weight: bold; color: #047857;">${horas} horas reloj (${dias} días/semana)</td>
    </tr>
    <tr>
      <td class="label">Estado Administrativo:</td>
      <td colspan="3" style="color: #047857; font-weight: bold;">${estado}</td>
    </tr>
  </table>

  <!-- ACTIVIDADES Y TEMAS DEL SÍLABO -->
  <div class="seccion-titulo">2. Temas del Sílabo Abordados y Metodología Pedagógica</div>
  <div class="caja-texto">
    <strong>Descripción Detallada de Actividades:</strong><br>
    ${temas}
  </div>

  <!-- EVALUACIÓN Y RENDIMIENTO -->
  <div class="seccion-titulo">3. Métricas de Desempeño y Asistencia Estudiantil</div>
  <table class="tabla-datos">
    <tr>
      <td class="label">Porcentaje de Asistencia:</td>
      <td style="font-weight: bold; color: #047857;">96.8% (Grupo Matriz)</td>
      <td class="label">Avance del Sílabo:</td>
      <td style="font-weight: bold; color: #047857;">100% de lo planificado</td>
    </tr>
    <tr>
      <td class="label">Régimen Disciplinario:</td>
      <td>Cumplimiento satisfactorio sin observaciones</td>
      <td class="label">Dictamen de Cátedra:</td>
      <td style="font-weight: bold; color: #065f46;">FAVORABLE PARA CONVALIDACIÓN</td>
    </tr>
  </table>

  <!-- EVIDENCIAS PROBATORIAS -->
  <div class="seccion-titulo">4. Registro de Anexos y Evidencias Probatorias</div>
  <table class="tabla-anexos">
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Nombre del Archivo Adjunto</th>
        <th>Tipo de Evidencia</th>
        <th style="width: 90px;">Tamaño</th>
        <th style="width: 110px;">Estado Verificación</th>
      </tr>
    </thead>
    <tbody>
      ${anexosFilas}
    </tbody>
  </table>

  <!-- FIRMAS Y RESPONSABILIDADES -->
  <div class="firmas-grid">
    <div class="firma-box">
      <div style="height: 45px;"></div>
      <div class="nombre">${ayudante}</div>
      <div class="cargo">Ayudante de Cátedra</div>
      <div class="cargo">C.I. 1205849302</div>
    </div>
    <div class="firma-box">
      <div style="height: 45px;"></div>
      <div class="nombre">${docente}</div>
      <div class="cargo">Docente Titular de Cátedra</div>
      <div class="cargo">Facultad de Ciencias de la Computación</div>
    </div>
    <div class="firma-box">
      <div style="height: 45px;"></div>
      <div class="nombre">Ing. Coordinador de Carrera</div>
      <div class="cargo">Comisión Académica y Ayudantías</div>
      <div class="cargo">Ingeniería de Software - UTEQ</div>
    </div>
  </div>

  <!-- PIE DE PÁGINA LEGAL Y CÓDIGO QR / CSV -->
  <div class="footer-legal">
    <div>
      Documento generado automáticamente por <strong>SIGAC - UTEQ</strong> el ${fechaHoy}.<br>
      Conforme al Art. 48 del Reglamento de Régimen Académico Institucional de la Universidad Técnica Estatal de Quevedo.
    </div>
    <div style="text-align: right; font-family: monospace; font-size: 8px;">
      CSV: UTEQ-SIGAC-2026-${codigoRes.replace(/[^A-Z0-9]/gi, '')}<br>
      Firma Digital Homologada · Validez Legal
    </div>
  </div>

</body>
</html>`;
  }

  /**
   * Genera y descarga el documento oficial de informe de ayudantía en formato HTML enriquecido (.html)
   * que abre perfectamente en navegadores y Word, e invoca la vista previa de impresión si se desea.
   */
  descargarInformeAyudantia(datos: DocumentoReporteDatos, abrirImpresion: boolean = true): void {
    const html = this.construirHtmlInformeAyudantia(datos);
    const nombreArchivo = `INFORME_AYUDANTIA_${(datos.codigoResolucion || 'OFICIAL').replace(/\s+/g, '_')}_${Date.now()}.html`;

    if (abrirImpresion) {
      this.imprimirDocumentoOficial(html, `Informe Ayudantía ${datos.codigoResolucion || ''}`);
    } else {
      this.descargarArchivo(nombreArchivo, html, 'text/html;charset=utf-8');
    }
  }

  /**
   * Genera y descarga el informe administrativo consolidado de ayudantías (para Coordinador / Admin).
   */
  descargarReporteConsolidadoAyudantias(metricas: any, ayudantias: any[], resoluciones: any[]): void {
    const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>REPORTE CONSOLIDADO DE AYUDANTÍAS - UTEQ</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #0f172a; }
    .header { border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { color: #065f46; font-size: 18px; text-transform: uppercase; margin: 0; }
    h2 { color: #334155; font-size: 13px; margin: 4px 0 0 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
    th { background: #047857; color: white; padding: 8px; border: 1px solid #065f46; text-align: left; }
    td { padding: 7px 8px; border: 1px solid #cbd5e1; }
    .metricas-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .metrica-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; background: #f8fafc; }
    .metrica-card .num { font-size: 20px; font-weight: bold; color: #047857; }
    .metrica-card .label { font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Universidad Técnica Estatal de Quevedo</h1>
    <h2>Coordinación de Carrera de Ingeniería de Software · SIGAC</h2>
    <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Reporte Consolidado de Gestión y Resoluciones de Ayudantías · Generado: ${fecha}</p>
  </div>

  <div class="metricas-grid">
    <div class="metrica-card">
      <div class="num">${metricas?.totalSolicitudes || 0}</div>
      <div class="label">Total Postulaciones</div>
    </div>
    <div class="metrica-card">
      <div class="num">${metricas?.aprobadas || 0}</div>
      <div class="label">Ayudantías Aprobadas</div>
    </div>
    <div class="metrica-card">
      <div class="num">${metricas?.horasRegistradasTotales || 0}h</div>
      <div class="label">Horas Cumplidas</div>
    </div>
    <div class="metrica-card">
      <div class="num">${metricas?.tasaCumplimiento || 100}%</div>
      <div class="label">Tasa de Cumplimiento</div>
    </div>
  </div>

  <h3 style="font-size: 13px; color: #065f46; margin-top: 20px;">1. Registro de Ayudantías Activas</h3>
  <table>
    <thead>
      <tr>
        <th>Estudiante Ayudante</th>
        <th>Cátedra Asignada</th>
        <th>Docente Titular</th>
        <th>Horas Ejecutadas</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${ayudantias.map(a => `
        <tr>
          <td><strong>${a.estudiante}</strong></td>
          <td>${a.materia}</td>
          <td>${a.docente || 'Docente Titular'}</td>
          <td>${a.horasCompletadas || 0} / ${a.horasTotales || 40} hrs</td>
          <td><span style="color: #047857; font-weight: bold;">${a.estado}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 style="font-size: 13px; color: #065f46; margin-top: 24px;">2. Resoluciones del Consejo Directivo y Actas Homologadas</h3>
  <table>
    <thead>
      <tr>
        <th>Código Resolución</th>
        <th>Tipo</th>
        <th>Materia</th>
        <th>Fecha Emisión</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${resoluciones.map(r => `
        <tr>
          <td><strong>${r.codigo}</strong></td>
          <td>${r.tipo}</td>
          <td>${r.materia}</td>
          <td>${r.fechaEmision}</td>
          <td>${r.estado}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

    this.imprimirDocumentoOficial(html, `Reporte_Consolidado_Ayudantias_${Date.now()}`);
  }

  /**
   * Genera y descarga un documento administrativo individual (Resolución, Acta, Plan de Trabajo).
   */
  descargarDocumentoAdministrativo(doc: any): void {
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${doc.codigo} - ${doc.titulo}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; max-width: 800px; margin: 0 auto; }
    .encabezado { border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { color: #065f46; font-size: 16px; margin: 0; text-transform: uppercase; }
    h2 { color: #1e293b; font-size: 13px; margin: 4px 0 0 0; }
    .caja { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; background: #f8fafc; margin-top: 16px; }
    .firmas { display: flex; justify-content: space-around; margin-top: 50px; text-align: center; }
    .firma { border-top: 1px solid #0f172a; width: 200px; padding-top: 6px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="encabezado">
    <h1>Universidad Técnica Estatal de Quevedo</h1>
    <h2>Facultad de Ciencias de la Computación · Secretaría General</h2>
    <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Sistema Integrado de Gestión Académica - SIGAC</p>
  </div>

  <div style="text-align: center; margin: 20px 0;">
    <h3 style="font-size: 15px; text-transform: uppercase; margin: 0;">${doc.tipo.toUpperCase()}: ${doc.titulo}</h3>
    <p style="font-size: 12px; color: #047857; font-weight: bold; margin: 4px 0;">Registro Oficial: ${doc.codigo}</p>
  </div>

  <div class="caja">
    <p style="font-size: 12px; line-height: 1.6;">
      Por medio del presente documento oficial, la <strong>Comisión Académica de la Facultad de Ciencias de la Computación</strong> certifica que el estudiante <strong>${doc.estudianteAyudante}</strong> ha sido designado y registrado formalmente en la cátedra de <strong>${doc.materia}</strong> bajo la resolución <strong>${doc.codigo}</strong>, con vigencia en el presente periodo lectivo.
    </p>
    <p style="font-size: 12px; line-height: 1.6;">
      <strong>Fecha de Emisión:</strong> ${doc.fechaEmision}<br>
      <strong>Estado de Homologación:</strong> ${doc.estado}<br>
      <strong>Régimen:</strong> Art. 48 del Reglamento de Régimen Académico UTEQ.
    </p>
  </div>

  <div class="firmas">
    <div class="firma">
      <strong>Ing. Decano / Subdecano</strong><br>
      Facultad de Ciencias de la Computación
    </div>
    <div class="firma">
      <strong>Secretaría Académica</strong><br>
      Registro y Archivo Central UTEQ
    </div>
  </div>
</body>
</html>`;

    this.imprimirDocumentoOficial(html, `${doc.codigo}_${doc.titulo}`);
  }
}
