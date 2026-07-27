import React, { useState } from 'react';
import { Mail, User, Phone, Tag, MessageSquare, Send, CheckCircle2, AlertCircle, RefreshCw, MessageCircle } from 'lucide-react';
import type { Language } from '../lib/i18n';

interface ContactFormProps {
  lang: Language;
}

export default function ContactForm({ lang }: ContactFormProps) {
  const isEs = lang === 'es';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: isEs ? 'Consulta General de Joyería' : 'General Jewelry Inquiry',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');

  const subjects = isEs ? [
    'Consulta General de Joyería',
    'Pedido Especial de Artesanía',
    'Ventas al por mayor / Ferias',
    'Información de envíos y pagos',
    'Otro asunto',
  ] : [
    'General Jewelry Inquiry',
    'Custom Artisan Order',
    'Wholesale / Fair Inquiry',
    'Shipping & Payment Details',
    'Other Subject',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setResponseMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setResponseMsg(
          data.message || (isEs 
            ? '¡Tu mensaje ha sido enviado exitosamente a tammy.vcm@gmail.com! Te responderemos muy pronto.'
            : 'Your message has been sent successfully to tammy.vcm@gmail.com! We will get back to you shortly.')
        );
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: subjects[0],
          message: '',
        });
      } else {
        setStatus('error');
        setResponseMsg(data.error || (isEs ? 'Hubo un inconveniente al enviar tu mensaje.' : 'An error occurred while sending your message.'));
      }
    } catch (err) {
      setStatus('error');
      setResponseMsg(isEs ? 'Error de conexión. Inténtalo de nuevo.' : 'Connection error. Please try again.');
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-10 border border-charcoal-950/10 shadow-xl relative overflow-hidden">
      {/* Top Banner Notice */}
      <div className="mb-8 p-4 rounded-2xl bg-ivory-100/80 border border-gold-400/30 flex items-center gap-3 text-xs sm:text-sm text-charcoal-800">
        <div className="size-8 rounded-xl bg-wine-700 text-gold-300 grid place-items-center shrink-0 shadow-sm">
          <Mail className="size-4" />
        </div>
        <div>
          <strong className="block text-charcoal-950 font-bold">
            {isEs ? 'Contacto Directo con la Artesana' : 'Direct Artisan Contact'}
          </strong>
          <span className="text-charcoal-800/80">
            {isEs 
              ? 'Tus mensajes llegan directamente a tammy.vcm@gmail.com' 
              : 'Messages go directly to tammy.vcm@gmail.com'}
          </span>
        </div>
      </div>

      {status === 'success' ? (
        <div className="py-8 text-center animate-reveal">
          <div className="mx-auto size-16 rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center mb-4 shadow-sm">
            <CheckCircle2 className="size-9" />
          </div>
          <h3 className="font-display text-2xl sm:text-3xl text-charcoal-950 font-medium">
            {isEs ? '¡Mensaje Enviado!' : 'Message Sent!'}
          </h3>
          <p className="mt-3 text-sm sm:text-base text-charcoal-800/85 max-w-md mx-auto leading-relaxed">
            {responseMsg}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-charcoal-950 hover:bg-charcoal-900 text-white font-bold text-sm shadow-md transition-all hover:-translate-y-0.5"
            >
              <RefreshCw className="size-4" />
              <span>{isEs ? 'Enviar otro mensaje' : 'Send another message'}</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-reveal">
              <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{responseMsg}</span>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-extrabold uppercase tracking-wider text-charcoal-800 mb-2">
                {isEs ? 'Tu nombre completo' : 'Full Name'} <span className="text-terracotta-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-800/40">
                  <User className="size-4" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={isEs ? 'Ej. María Saraguro' : 'e.g. Maria Saraguro'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-ivory-50 border border-charcoal-950/15 text-charcoal-950 text-sm placeholder:text-charcoal-800/35 focus:outline-none focus:ring-2 focus:ring-wine-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-extrabold uppercase tracking-wider text-charcoal-800 mb-2">
                {isEs ? 'Correo electrónico' : 'Email Address'} <span className="text-terracotta-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-800/40">
                  <Mail className="size-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-ivory-50 border border-charcoal-950/15 text-charcoal-950 text-sm placeholder:text-charcoal-800/35 focus:outline-none focus:ring-2 focus:ring-wine-700 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-extrabold uppercase tracking-wider text-charcoal-800 mb-2">
                {isEs ? 'Teléfono' : 'Phone'} <small className="font-normal text-charcoal-600">({isEs ? 'opcional' : 'optional'})</small>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-800/40">
                  <Phone className="size-4" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+593 99 000 0000"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-ivory-50 border border-charcoal-950/15 text-charcoal-950 text-sm placeholder:text-charcoal-800/35 focus:outline-none focus:ring-2 focus:ring-wine-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-xs font-extrabold uppercase tracking-wider text-charcoal-800 mb-2">
                {isEs ? 'Asunto / Motivo' : 'Subject'} <span className="text-terracotta-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-800/40">
                  <Tag className="size-4" />
                </div>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-ivory-50 border border-charcoal-950/15 text-charcoal-950 text-sm focus:outline-none focus:ring-2 focus:ring-wine-700 focus:bg-white transition-all"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-xs font-extrabold uppercase tracking-wider text-charcoal-800 mb-2">
              {isEs ? 'Tu mensaje o consulta' : 'Your Message'} <span className="text-terracotta-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3.5 left-3.5 pointer-events-none text-charcoal-800/40">
                <MessageSquare className="size-4" />
              </div>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder={
                  isEs
                    ? 'Escribe los detalles de tu consulta, producto de interés o diseño personalizado...'
                    : 'Write the details of your inquiry, product of interest, or custom design request...'
                }
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-ivory-50 border border-charcoal-950/15 text-charcoal-950 text-sm placeholder:text-charcoal-800/35 focus:outline-none focus:ring-2 focus:ring-wine-700 focus:bg-white transition-all resize-y"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full min-h-12 rounded-xl bg-wine-700 hover:bg-wine-800 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
          >
            {status === 'loading' ? (
              <>
                <RefreshCw className="size-5 animate-spin text-gold-300" />
                <span>{isEs ? 'Enviando a tammy.vcm@gmail.com...' : 'Sending to tammy.vcm@gmail.com...'}</span>
              </>
            ) : (
              <>
                <span>{isEs ? 'Enviar Mensaje a la Artesana' : 'Send Message to Artisan'}</span>
                <Send className="size-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
