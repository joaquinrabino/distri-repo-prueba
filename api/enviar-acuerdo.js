/* ==========================================================
   Envío del acuerdo comercial por email (Vercel + Resend)

   Variables de entorno (Vercel → Settings → Environment Variables):
     RESEND_API_KEY   la API key de Resend (obligatoria, NUNCA en el código)
     RESEND_FROM      remitente, ej: "Distrishop <acuerdos@tudominio.com.uy>"
                      (sin dominio verificado: "Distrishop <onboarding@resend.dev>",
                       que solo puede enviar al email de la cuenta de Resend)
     RESEND_REPLY_TO  opcional: a dónde llegan las respuestas del cliente

   Por seguridad el texto del email se arma acá (no lo manda la página)
   y solo se adjuntan PDFs guardados en el Firebase Storage de la app.
========================================================== */

var BUCKET_PREFIX =
  "https://firebasestorage.googleapis.com/v0/b/distrishop-acuerdo.firebasestorage.app/o/clientes%2F";


function esc(s) {

  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {

    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];

  });

}


function limpio(s, max) {

  return String(s == null ? "" : s).replace(/[\r\n]+/g, " ").trim().slice(0, max);

}


/* 2026-01-01 → 1/1/2026 */
function fecha(iso) {

  var p = String(iso || "").split("-").map(Number);

  return p.length === 3 && !p.some(isNaN)
    ? p[2] + "/" + p[1] + "/" + p[0]
    : "-";

}


module.exports = async function (req, res) {

  if (req.method !== "POST") {

    res.setHeader("Allow", "POST");

    return res.status(405).json({ ok: false, error: "Método no permitido" });

  }


  var apiKey = process.env.RESEND_API_KEY;

  var from = process.env.RESEND_FROM || "Distrishop <onboarding@resend.dev>";

  var replyTo = process.env.RESEND_REPLY_TO || "";


  if (!apiKey) {

    return res.status(500).json({
      ok: false,
      error: "Falta configurar RESEND_API_KEY en Vercel."
    });

  }


  var b = req.body || {};


  if (typeof b === "string") {

    try {

      b = JSON.parse(b);

    } catch (e) {

      b = {};

    }

  }


  var to = limpio(b.to, 120);

  var cliente = limpio(b.cliente, 120);

  var razonSocial = limpio(b.razonSocial, 120) || "Distribuidora Midecor S.A.";

  var remitente = limpio(b.remitente, 60);

  var pdfUrl = String(b.pdfUrl || "");

  var archivo = limpio(b.archivo, 120).replace(/[^\w.\-]/g, "") || "acuerdo-comercial.pdf";


  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {

    return res.status(400).json({ ok: false, error: "Email del cliente inválido." });

  }


  if (!cliente) {

    return res.status(400).json({ ok: false, error: "Falta el nombre del cliente." });

  }


  if (pdfUrl.indexOf(BUCKET_PREFIX) !== 0) {

    return res.status(400).json({ ok: false, error: "El PDF no es de la app." });

  }


  var vigencia =
    fecha(b.desde) + " al " + fecha(b.hasta);


  var host =
    req.headers["x-forwarded-host"] || req.headers.host || "";


  var logo =
    host ? "https://" + host + "/logo-distrishop.png" : "";


  var asunto =
    "Acuerdo comercial " + cliente + " - " +
    razonSocial.replace(/^Distribuidora\s+/i, "") +
    " (vigencia " + vigencia + ")";


  var texto =
    "Hola,\n\n" +
    "Te enviamos adjunto el Acuerdo Comercial entre " + cliente + " y " + razonSocial +
    " (Distrishop), con vigencia del " + vigencia + ".\n\n" +
    "Por favor imprimilo, firmalo y envianos una foto o escaneo del acuerdo firmado respondiendo este email.\n\n" +
    "También podés descargarlo desde este enlace:\n" + pdfUrl + "\n\n" +
    "¡Muchas gracias!\n" +
    (remitente ? remitente + "\n" : "") +
    "Distrishop · Distribución - Logística";


  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2b2840;max-width:560px;margin:0 auto;">' +
      (logo ? '<img src="' + esc(logo) + '" alt="Distrishop" width="180" style="display:block;margin:0 0 18px;">' : "") +
      '<p>Hola,</p>' +
      '<p>Te enviamos adjunto el <strong>Acuerdo Comercial</strong> entre <strong>' + esc(cliente) + '</strong> y ' +
        esc(razonSocial) + ' (Distrishop), con vigencia del <strong>' + esc(vigencia) + '</strong>.</p>' +
      '<p>Por favor imprimilo, firmalo y envianos una foto o escaneo del acuerdo firmado <strong>respondiendo este email</strong>.</p>' +
      '<p style="margin:22px 0;">' +
        '<a href="' + esc(pdfUrl) + '" style="background:#6f5bd3;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold;">Descargar el acuerdo</a>' +
      '</p>' +
      '<p>¡Muchas gracias!<br>' +
        (remitente ? esc(remitente) + '<br>' : "") +
        '<span style="color:#8f8ca3;">Distrishop · Distribución - Logística</span>' +
      '</p>' +
    '</div>';


  var payload = {
    from: from,
    to: [to],
    subject: asunto,
    html: html,
    text: texto,
    attachments: [
      { filename: archivo, path: pdfUrl }
    ]
  };


  if (replyTo) {

    payload.reply_to = replyTo;

  }


  try {

    var r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });


    var data = await r.json().catch(function () {

      return {};

    });


    if (!r.ok) {

      return res.status(502).json({
        ok: false,
        error: (data && data.message) || ("Resend respondió " + r.status)
      });

    }


    return res.status(200).json({ ok: true, id: data.id || null });

  } catch (err) {

    return res.status(502).json({
      ok: false,
      error: "No se pudo conectar con Resend."
    });

  }

};
