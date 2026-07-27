import React, { useState, useEffect } from 'react';
import type { Language } from '../lib/i18n';

interface Props {
  usPhone?: string;
  ecPhone?: string;
  lang?: Language;
}

export default function WhatsAppWidget({
  usPhone = '18623471601',
  ecPhone = '593994063650',
  lang = 'es',
}: Props) {
  const [selectedRegion, setSelectedRegion] = useState<'ec' | 'us'>('us');
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const isEs = lang === 'es';

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes('Guayaquil') || tz.includes('Galapagos')) {
        setSelectedRegion('ec');
        return;
      }
    } catch (_e) {
      // ignore
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);

    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timer);
        if (data && data.country_code === 'EC') {
          setSelectedRegion('ec');
        } else {
          setSelectedRegion('us');
        }
      })
      .catch(() => {
        clearTimeout(timer);
        setSelectedRegion(lang === 'es' ? 'ec' : 'us');
      });
  }, [lang]);

  // Auto-open bubble after 4 seconds (only once, unless dismissed)
  useEffect(() => {
    if (hasAutoOpened || dismissed) return;
    const t = setTimeout(() => {
      setBubbleOpen(true);
      setHasAutoOpened(true);
    }, 4000);
    return () => clearTimeout(t);
  }, [hasAutoOpened, dismissed]);

  const currentPhone = selectedRegion === 'ec' ? ecPhone : usPhone;
  const cleanPhone = currentPhone.replace(/[^0-9]/g, '');

  const defaultMessage = isEs
    ? 'Hola Sumak Kawsay, me gustaría recibir información sobre sus artesanías.'
    : 'Hello Sumak Kawsay, I would like to get information about your crafts.';

  const getWhatsappUrl = (msg?: string) =>
    `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg || defaultMessage)}`;

  const greeting = isEs
    ? '¡Hola! ¿Cómo te puedo ayudar hoy?'
    : 'Hello! How can I help you today?';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Bubble */}
      {bubbleOpen && (
        <div
          className="relative w-[280px] sm:w-[320px] rounded-2xl bg-ivory-50 shadow-2xl border border-charcoal-950/10 overflow-hidden"
          style={{
            animation: 'wa-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
        >
          {/* Header bar — clickable to restore when minimized */}
          <div
            className={`flex items-center gap-3 bg-[#25D366] px-4 py-3 ${minimized ? 'cursor-pointer hover:bg-[#20ba5a] transition-colors' : ''}`}
            onClick={minimized ? () => setMinimized(false) : undefined}
            role={minimized ? 'button' : undefined}
            tabIndex={minimized ? 0 : undefined}
            onKeyDown={minimized ? (e) => { if (e.key === 'Enter') setMinimized(false); } : undefined}
          >
            <img
              src="/images/artesana.png"
              alt="Sumak Kawsay"
              className="size-11 rounded-full border-2 border-white/80 object-cover shadow-md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-white uppercase tracking-wide leading-tight truncate">
                Sumak Kawsay
              </p>
              <p className="text-[0.65rem] text-white/80 font-medium">
                {minimized
                  ? (isEs ? 'Clic para expandir' : 'Click to expand')
                  : (isEs ? 'Responde en minutos' : 'Replies in minutes')}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              {/* Minimize / Restore */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMinimized((prev) => !prev); }}
                className="grid size-8 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                aria-label={minimized ? (isEs ? 'Expandir' : 'Expand') : (isEs ? 'Minimizar' : 'Minimize')}
                title={minimized ? (isEs ? 'Expandir' : 'Expand') : (isEs ? 'Minimizar' : 'Minimize')}
              >
                {minimized ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 11 12 6 7 11" />
                    <polyline points="17 18 12 13 7 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>
              {/* Close (fully hides, won't auto-open again) */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setBubbleOpen(false); setMinimized(false); setDismissed(true); }}
                className="grid size-8 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                aria-label={isEs ? 'Cerrar' : 'Close'}
                title={isEs ? 'Cerrar' : 'Close'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Collapsible body — hidden when minimized */}
          {!minimized && (
            <>
              {/* Message body */}
              <div className="px-4 py-4 bg-[#ECE5DD]">
                <div className="relative max-w-[85%] rounded-xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm text-charcoal-950 leading-relaxed">{greeting}</p>
                  <p className="mt-1.5 text-right text-[0.6rem] text-charcoal-800/50">
                    {new Date().toLocaleTimeString(isEs ? 'es' : 'en', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {/* Message tail */}
                  <div className="absolute -left-1.5 top-0 size-3 overflow-hidden">
                    <div className="absolute size-3 rotate-45 bg-white -translate-x-1/2" />
                  </div>
                </div>
              </div>

              {/* Region selector */}
              <div className="flex items-center gap-1.5 bg-[#ECE5DD] px-4 pb-3 text-[0.7rem]">
                <span className="text-charcoal-800/60 font-medium">
                  {isEs ? 'Línea:' : 'Line:'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRegion('ec')}
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-extrabold transition cursor-pointer ${
                    selectedRegion === 'ec'
                      ? 'bg-[#25D366] text-white shadow-xs'
                      : 'bg-white/80 text-charcoal-800 hover:bg-white'
                  }`}
                  title="WhatsApp Ecuador"
                >
                  <span>🇪🇨</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRegion('us')}
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-extrabold transition cursor-pointer ${
                    selectedRegion === 'us'
                      ? 'bg-[#25D366] text-white shadow-xs'
                      : 'bg-white/80 text-charcoal-800 hover:bg-white'
                  }`}
                  title="WhatsApp USA"
                >
                  <span>🇺🇸</span>
                </button>
              </div>

              {/* Message input */}
              <div className="flex items-end gap-2 bg-ivory-50 border-t border-charcoal-950/10 px-3 py-3">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      window.open(getWhatsappUrl(userMessage.trim() || undefined), '_blank');
                    }
                  }}
                  placeholder={isEs ? 'Escribe tu mensaje...' : 'Type your message...'}
                  className="flex-1 rounded-full border border-charcoal-950/15 bg-white px-4 py-2.5 text-sm text-charcoal-950 placeholder:text-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366]"
                />
                <a
                  href={getWhatsappUrl(userMessage.trim() || undefined)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-md transition hover:bg-[#20ba5a] hover:scale-105"
                  aria-label={isEs ? 'Enviar mensaje' : 'Send message'}
                  title={isEs ? 'Enviar por WhatsApp' : 'Send via WhatsApp'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </a>
              </div>
            </>
          )}

          {/* Bubble tail pointing down — only when expanded */}
          {!minimized && (
            <div className="absolute -bottom-2 right-7 size-4 rotate-45 bg-ivory-50 border-r border-b border-charcoal-950/10" />
          )}
        </div>
      )}

      {/* Floating WhatsApp Button — only visible when bubble is closed */}
      {!bubbleOpen && (
      <button
        type="button"
        onClick={() => { setBubbleOpen(true); setMinimized(false); }}
        className="group relative flex size-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#20ba5a] hover:shadow-emerald-500/40 focus:outline-none focus:ring-4 focus:ring-emerald-400/50 cursor-pointer"
        aria-label={isEs ? 'Abrir chat de WhatsApp' : 'Open WhatsApp chat'}
        title={`Chat de WhatsApp — Sumak Kawsay`}
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-[wa-pulse_2s_ease-in-out_infinite]" />
        {/* WhatsApp icon */}
        <svg viewBox="0 0 24 24" className="relative z-10 size-7 fill-white" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.852 0-3.665-.494-5.263-1.433l-.377-.223-3.914 1.026 1.045-3.815-.247-.393c-1.03-1.64-1.576-3.543-1.576-5.49 0-5.617 4.57-10.187 10.187-10.187 2.72 0 5.277 1.058 7.199 2.981 1.921 1.922 2.979 4.48 2.978 7.201 0 5.618-4.57 10.187-10.187 10.187m0-18.397c-4.526 0-8.209 3.682-8.209 8.21 0 1.785.576 3.476 1.666 4.872l.25.321-.655 2.392 2.454-.643.31.184c1.348.802 2.89 1.226 4.466 1.226 4.527 0 8.21-3.683 8.21-8.21.001-4.527-3.682-8.209-8.209-8.209" />
        </svg>
      </button>
      )}

      {/* Inline keyframes for animations */}
      <style>{`
        @keyframes wa-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes wa-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
