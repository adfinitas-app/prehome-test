import configJson from '../src/lib/.prehome-config.json';
import type { PrehomeConfig } from '../src/lib/types';
import { hooks } from './lib/hooks';

/**
 * PREHOME SCRIPT
 * * Ce script gère l'injection d'une iframe "Prehome" sur le site client.
 * Il supporte deux modes :
 * 1. Standard (GTM) : Gère le capping (fréquence d'affichage) en interne.
 * 2. Beyable : Laisse la main à Beyable pour le déclenchement et le nettoyage.
 */

// =============================================================================
// 1. TYPES & CONFIGURATION INITIALE
// =============================================================================

const buildConfig = configJson as PrehomeConfig;

interface ScriptContext {
        host: string;
        platform: 'beyable' | 'standard';
        rawRoute: string;
        routeName: string;
        maxViews: number;
        cappingInDays: number;
        isDev: boolean;
        prehomeId: string;
}

// État global pour gérer les références DOM
const state = {
        iframe: null as HTMLIFrameElement | null,
        overlay: null as HTMLDivElement | null,
        isMounted: false
};

/**
 * Analyse le script tag actuel pour extraire la configuration.
 */
function parseScriptContext(): ScriptContext {
        const script =
                (document.currentScript as HTMLScriptElement) ||
                document.querySelector('script[data-route], script[data-type]');

        const dataset = script?.dataset || {};
        const platform = dataset.platform === 'beyable' ? 'beyable' : 'standard';
        const host = dataset.host || 'localhost:5173';
        const rawRoute = dataset.route || dataset.type || 'default';
        const routeName = rawRoute.split('/').filter(Boolean).join('-');

        const prehomeId = `${buildConfig.clientId}-${routeName}-prehome`;

        return {
                platform,
                rawRoute,
                routeName,
                host,
                maxViews: platform === 'beyable' ? 0 : Number(dataset.maxViews) || 1,
                cappingInDays: platform === 'beyable' ? 0 : Number(dataset.capping) || 1,
                isDev: host.includes('localhost') || host.includes('127.0.0.1'),
                prehomeId
        };
}

const ctx = parseScriptContext();

if (ctx.isDev) {
        console.table(ctx);
}
const STORAGE_KEYS = {
        viewCount: `${ctx.prehomeId}-view-count`,
        firstViewDate: `${ctx.prehomeId}-first-view-date`,
        closedAt: `${ctx.prehomeId}-prehome-closed-at`
};

// =============================================================================
// 2. UTILITAIRES (URL & STORAGE)
// =============================================================================

function buildIframeUrl(): string {
        const urlParams = new URLSearchParams();
        const script =
                (document.currentScript as HTMLScriptElement) ||
                document.querySelector('script[data-route], script[data-type]');
        if (script?.dataset) {
                Object.entries(script.dataset).forEach(([key, value]) => {
                        if (value) urlParams.append(key, value);
                });
        }
        urlParams.append('configClientId', buildConfig.clientId);

        const baseUrl = ctx.isDev
                ? `http://${ctx.host}/${ctx.rawRoute}`
                : `https://${ctx.host}/${ctx.rawRoute}`;

        return `${baseUrl}?${urlParams.toString()}`;
}

const Storage = {
        set(key: string, value: string | number): void {
                const val = String(value);
                try {
                        document.cookie = `${key}=${val}; path=/; SameSite=Lax`;
                } catch {
                        //
                }
                try {
                        localStorage.setItem(key, val);
                } catch {
                        //
                }
        },
        get(key: string): string {
                try {
                        const val = localStorage.getItem(key);
                        if (val !== null) return val;
                } catch {
                        //
                }
                try {
                        const match = document.cookie.split('; ').find((row) => row.startsWith(`${key}=`));
                        if (match) return match.split('=')[1];
                } catch {
                        //
                }
                return '';
        }
};

// =============================================================================
// 3. GESTION DU DOM (MOUNT / UNMOUNT)
// =============================================================================

function unmountPrehome() {
        if (ctx.platform === 'beyable') {
                const beyableIframe = document.querySelector(`#adfinitas-${ctx.prehomeId}-iframe`);
                if (beyableIframe) beyableIframe.remove();
                window.removeEventListener('BY_before_load', unmountPrehome);
        }
        else {
                if (state.iframe) state.iframe.remove();
        }

        if (state.overlay) state.overlay.remove();

        state.iframe = null;
        state.overlay = null;
        state.isMounted = false;
        document.body.style.overflow = '';
        hooks.onUnmount?.(state);
}

function mountPrehome() {
        if (state.isMounted) return;
        if (ctx.platform === 'beyable' && document.querySelector(`#adfinitas-${ctx.prehomeId}-iframe`))
                return;

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                zIndex: hooks.overlayZIndex || '2147483646',
                pointerEvents: 'none'
        });

        const iframe = document.createElement('iframe');
        iframe.src = buildIframeUrl();

        if (ctx.platform === 'beyable') {
                iframe.id = `adfinitas-${ctx.prehomeId}-iframe`;
        }

        Object.assign(iframe.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                border: 'none',
                zIndex: hooks.iframeZIndex || '2147483647'
        });

        const style = document.createElement('style');
        style.textContent = `#type-b.arya>iframe:not(.html2canvas-container) { display: block !important; }`;
        document.head.appendChild(style);

        document.body.style.overflow = 'hidden';
        document.body.appendChild(overlay);
        document.body.appendChild(iframe);

        state.iframe = iframe;
        state.overlay = overlay;
        state.isMounted = true;

        document.addEventListener('keydown', handleKeyDown);

        function handleKeyDown(event: KeyboardEvent) {
                if (event.key === 'Escape') unmountPrehome();
        }

        const onMsg = (event: MessageEvent) => {
                // Hooks client (interception messages custom)
                hooks.onMessage?.(event, ctx, state);

                if (event.data?.type === `close-iframe-prehome-${ctx.routeName}`) {
                        if (ctx.platform !== 'beyable') {
                                Storage.set(STORAGE_KEYS.closedAt, Date.now());
                        }
                        unmountPrehome();
                        window.removeEventListener('message', onMsg);
                }
        };
        window.addEventListener('message', onMsg);

        // Hook après montage complet
        hooks.onMount?.(ctx, state);
}

// =============================================================================
// 4. LOGIQUE D'EXÉCUTION PAR PLATEFORME
// =============================================================================

function runBeyableMode() {
        try {
                mountPrehome();
                window.addEventListener('BY_before_load', unmountPrehome);
        } catch (e) {
                console.error('[Prehome] Beyable Error:', e);
        }
}

function runStandardMode() {
        let viewCount = Number(Storage.get(STORAGE_KEYS.viewCount)) || 0;
        let firstViewDate = Storage.get(STORAGE_KEYS.firstViewDate);
        const now = Date.now();

        let daysSinceFirstView = 0;
        if (firstViewDate) {
                const startDate = new Date(firstViewDate).getTime();
                daysSinceFirstView = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        }

        if (!firstViewDate || daysSinceFirstView >= ctx.cappingInDays) {
                viewCount = 0;
                firstViewDate = new Date().toISOString();
                Storage.set(STORAGE_KEYS.viewCount, '0');
                Storage.set(STORAGE_KEYS.firstViewDate, firstViewDate);
                Storage.set(STORAGE_KEYS.closedAt, '');
        }

        const shouldShow = viewCount < ctx.maxViews;

        if (shouldShow) {
                Storage.set(STORAGE_KEYS.viewCount, viewCount + 1);
                mountPrehome();
        } else {
                if (ctx.isDev) console.log(`[Prehome] Capping atteint (${viewCount}/${ctx.maxViews} vues).`);
        }
}

// =============================================================================
// 5. POINT D'ENTRÉE
// =============================================================================

(function init() {
        if (ctx.platform === 'beyable') {
                runBeyableMode();
        } else {
                runStandardMode();
        }
})();
