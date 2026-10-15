import { type Ref, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import type { LatLng } from '../../lib/geocode';
import { liveMapHtml, type MapMessage } from './liveMapHtml';

export type LiveMapHandle = { flyTo: (p: LatLng) => void };

/** A live, draggable OpenStreetMap (Leaflet in a WebView). Reports the centre when it settles. */
export function LiveMap({
  ref,
  initial,
  onMessage,
}: {
  ref?: Ref<LiveMapHandle>;
  initial: LatLng;
  onMessage: (m: MapMessage) => void;
}) {
  const web = useRef<WebView>(null);
  // The page is built once; later moves go through flyTo, not a reload.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => liveMapHtml(initial), []);

  useImperativeHandle(ref, () => ({
    flyTo: (p) => web.current?.injectJavaScript(`window.hooraFlyTo(${p.lat}, ${p.lng}); true;`),
  }));

  return (
    <WebView
      ref={web}
      source={{ html, baseUrl: 'https://hoora.local/' }}
      originWhitelist={['*']}
      style={StyleSheet.absoluteFill}
      onMessage={(e) => {
        try {
          onMessage(JSON.parse(e.nativeEvent.data) as MapMessage);
        } catch {
          // ignore anything that isn't ours
        }
      }}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      setSupportMultipleWindows={false}
      javaScriptEnabled
    />
  );
}
