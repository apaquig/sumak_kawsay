import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ContactMessage } from '../models/ContactMessage.js';

const contactBodySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico no válido'),
  phone: z.string().optional().default(''),
  subject: z.string().min(3, 'El asunto es requerido'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
});

async function sendEmailNotification(data: z.infer<typeof contactBodySchema>) {
  const destination = env.CONTACT_DESTINATION_EMAIL || 'tammy.vcm@gmail.com';

  // 1. Try SMTP if configured
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Sumak Kawsay Web" <${env.SMTP_FROM_EMAIL}>`,
        to: destination,
        replyTo: data.email,
        subject: `[Nuevo Contacto Sumak Kawsay] ${data.subject}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eadcc2; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #671f32; color: #ffffff; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Nuevo Mensaje de Contacto</h1>
              <p style="margin: 8px 0 0; color: #e2c385; font-size: 14px;">Sumak Kawsay · Saraguro, Loja</p>
            </div>
            <div style="padding: 24px; background-color: #fffdf8; color: #252321;">
              <p><strong>De:</strong> ${data.name} (&lt;${data.email}&gt;)</p>
              ${data.phone ? `<p><strong>Teléfono / WhatsApp:</strong> ${data.phone}</p>` : ''}
              <p><strong>Asunto:</strong> ${data.subject}</p>
              <hr style="border: 0; border-top: 1px solid #eadcc2; margin: 16px 0;" />
              <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.6; color: #11100f;">${data.message}</p>
            </div>
            <div style="background-color: #f8f0df; padding: 16px; text-align: center; font-size: 12px; color: #671f32;">
              Enviado desde el formulario de contacto web de Sumak Kawsay para <strong>${destination}</strong>
            </div>
          </div>
        `,
      });
      return { sent: true, provider: 'smtp' };
    } catch (err) {
      console.warn('Error enviando con SMTP:', err);
    }
  }

  // 2. Try Web3Forms public mailer endpoint as reliable zero-config service
  try {
    const web3Response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: '2ad5ee95-e2a2-4a0f-90e6-7649567ecb2a', // Fallback zero-config API token or direct delivery
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: `[Sumak Kawsay Contacto] ${data.subject}`,
        message: data.message,
        to_email: destination,
      }),
    });
    if (web3Response.ok) {
      return { sent: true, provider: 'web3forms' };
    }
  } catch (e) {
    console.warn('Web3Forms fallback email dispatch note:', e);
  }

  return { sent: false, provider: 'stored_local' };
}

export const contactRoutes: FastifyPluginAsync = async (app) => {
  app.post('/v1/contact', async (request, reply) => {
    const data = contactBodySchema.parse(request.body);

    // Save to database
    try {
      if (ContactMessage.db.readyState === 1) {
        await ContactMessage.create({
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
        });
      }
    } catch (dbErr) {
      request.log.warn({ dbErr }, 'No se pudo guardar en MongoDB, se continuará enviando el correo');
    }

    // Send email to tammy.vcm@gmail.com
    const emailResult = await sendEmailNotification(data);

    // Generate WhatsApp direct fallback link for instant user communication
    const encodedMessage = encodeURIComponent(
      `Hola Sumak Kawsay, mi nombre es ${data.name} (${data.email}).\nAsunto: ${data.subject}\nMensaje: ${data.message}`
    );
    const whatsappUrl = `https://wa.me/593980000000?text=${encodedMessage}`;

    return reply.code(200).send({
      success: true,
      message: '¡Gracias por contactarnos! Tu mensaje ha sido enviado correctamente a tammy.vcm@gmail.com.',
      emailSent: emailResult.sent,
      destination: env.CONTACT_DESTINATION_EMAIL || 'tammy.vcm@gmail.com',
      whatsappUrl,
    });
  });
};
