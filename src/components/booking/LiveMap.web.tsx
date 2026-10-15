import { type Ref, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

import type { LatLng } from '../../lib/geocode';
import { liveMapHtml, type MapMessage } from './liveMapHtml';

export type LiveMapHandle = { flyTo: (p: LatLng) => void };

/** Web preview of the live map: the same Leaflet page in an iframe. */
export function LiveMap({
  ref,
  initial,
  onMessage,
}: {
  ref?: Ref<LiveMapHandle>;
  initial: LatLng;
  onMessage: (m: MapMessage) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => liveMapHtml(initial), []);
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const listen = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        handler.current(JSON.parse(e.data) as MapMessage);
      } catch {
        // ignore anything that isn't ours
      }
    };
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, []);

  useImperativeHandle(ref, () => ({
    flyTo: (p) => frame.current?.contentWindow?.postMessage(JSON.stringify({ type: 'fly', ...p }), '*'),
  }));

  return (
    <iframe
      ref={frame}
      srcDoc={html}
      title="Map"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
    />
  );
}
