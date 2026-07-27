import type { APIRoute } from 'astro';
import { getPublicSettings } from '../../lib/catalog';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Por favor completa los campos obligatorios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const settings = await getPublicSettings();
    const destination = settings.destinationEmail;
    const resendKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;

    let sent = false;

    // 1. Try Resend if key exists
    if (resendKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: [destination],
            reply_to: email,
            subject: `[Contacto Web Sumak Kawsay] ${subject}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eadcc2; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #671f32; color: #ffffff; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">Nuevo Mensaje de Cliente</h1>
                  <p style="margin: 8px 0 0; color: #e2c385; font-size: 14px;">Sumak Kawsay · Saraguro, Loja</p>
                </div>
                <div style="padding: 24px; background-color: #fffdf8; color: #252321;">
                  <p><strong>Nombre del cliente:</strong> ${name}</p>
                  <p><strong>Correo electrónico:</strong> <a href="mailto:${email}">${email}</a></p>
                  ${phone ? `<p><strong>Teléfono / WhatsApp:</strong> ${phone}</p>` : ''}
                  <p><strong>Asunto:</strong> ${subject}</p>
                  <hr style="border: 0; border-top: 1px solid #eadcc2; margin: 16px 0;" />
                  <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.6; color: #11100f;">${message}</p>
                </div>
                <div style="background-color: #f8f0df; padding: 16px; text-align: center; font-size: 12px; color: #671f32;">
                  Notificación enviada automáticamente a <strong>${destination}</strong>
                </div>
              </div>
            `,
          }),
        });
        if (resendRes.ok) sent = true;
      } catch (err) {
        console.warn('Resend error:', err);
      }
    }

    // 2. Direct Web3Forms submission to tammy.vcm@gmail.com
    if (!sent) {
      try {
        const w3Res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: '2ad5ee95-e2a2-4a0f-90e6-7649567ecb2a',
            name,
            email,
            phone: phone || 'No especificado',
            subject: `[Sumak Kawsay] ${subject}`,
            message,
            to_email: destination,
          }),
        });
        if (w3Res.ok) sent = true;
      } catch (err) {
        console.warn('Web3Forms error:', err);
      }
    }

    // 3. Optional forward to API server backend if running
    try {
      const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
    } catch (_) {
      // Backend api forward is optional
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `¡Tu mensaje ha sido enviado correctamente a ${destination}!`,
        destination,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Ocurrió un error inesperado. Inténtalo de nuevo.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
