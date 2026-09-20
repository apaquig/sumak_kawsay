import { exec } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

interface BuildState {
  isBuilding: boolean;
  lastBuildTime: string | null;
  lastBuildSuccess: boolean | null;
  lastError: string | null;
  durationMs: number | null;
}

const state: BuildState = {
  isBuilding: false,
  lastBuildTime: null,
  lastBuildSuccess: null,
  lastError: null,
  durationMs: null,
};

let debounceTimer: NodeJS.Timeout | null = null;
let queuedBuildRequested = false;

const here = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(here, '../../../');

/**
 * Ejecuta la compilación estática del storefront de forma asíncrona.
 */
async function executeBuild(): Promise<void> {
  if (state.isBuilding) {
    queuedBuildRequested = true;
    return;
  }

  state.isBuilding = true;
  state.lastError = null;
  const startTime = Date.now();
  console.log('🔨 [Build Service] Iniciando compilación de storefront estático...');

  const apiUrl = `http://127.0.0.1:${env.PORT}`;

  exec(
    'npm run build -w @sumak/storefront',
    {
      cwd: monorepoRoot,
      env: {
        ...process.env,
        API_URL: apiUrl,
        PUBLIC_SITE_URL: env.STOREFRONT_ORIGIN,
      },
    },
    (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      state.isBuilding = false;
      state.durationMs = duration;
      state.lastBuildTime = new Date().toISOString();

      if (error) {
        state.lastBuildSuccess = false;
        state.lastError = error.message;
        console.error(`❌ [Build Service] Error al compilar storefront (${duration}ms):`, error.message);
        if (stderr) console.error(stderr);
      } else {
        state.lastBuildSuccess = true;
        console.log(`✅ [Build Service] Storefront estático recompilado exitosamente en ${duration}ms.`);
      }

      // Si entraron cambios mientras se compilaba, ejecutar una compilación adicional
      if (queuedBuildRequested) {
        queuedBuildRequested = false;
        console.log('🔄 [Build Service] Ejecutando compilación en cola por cambios pendientes...');
        executeBuild().catch((e) => console.error('Build queue error:', e));
      }
    }
  );
}

/**
 * Agenda una recompilación del storefront con debounce de 3 segundos
 * para permitir agrupar guardados sucesivos.
 */
export function triggerStorefrontBuild(immediate = false): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (immediate) {
    executeBuild().catch((err) => console.error('Immediate build error:', err));
    return;
  }

  console.log('⏳ [Build Service] Cambio detectado en base de datos. Compilación agendada en 3s...');
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    executeBuild().catch((err) => console.error('Scheduled build error:', err));
  }, 3000);
}

/**
 * Devuelve el estado actual de compilación del storefront.
 */
export function getBuildStatus(): BuildState {
  return { ...state };
}
