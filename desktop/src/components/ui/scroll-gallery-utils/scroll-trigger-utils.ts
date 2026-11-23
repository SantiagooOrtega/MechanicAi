/** Utilidades de ScrollTrigger para la galería con scroll */

export function isWindowScroller(scroller: Element | Window): scroller is Window {
  return typeof window !== 'undefined' && scroller === window;
}

/** Espera a que el contenedor con scroll tenga tamaño real (montado y con layout) */
export function waitForScrollerReady(scroller: Element | Window, timeoutMs = 2000): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      const ready = isWindowScroller(scroller)
        ? document.readyState !== 'loading'
        : scroller.isConnected && (scroller as HTMLElement).clientHeight > 0;
      if (ready || performance.now() - start > timeoutMs) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}

/** Llama a `onResize` (con debounce) cuando cambia el tamaño de la ventana */
export function observeWindowResize(onResize: () => void, delay = 150): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const handler = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onResize, delay);
  };
  window.addEventListener('resize', handler);
  window.addEventListener('orientationchange', handler);
  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener('resize', handler);
    window.removeEventListener('orientationchange', handler);
  };
}
