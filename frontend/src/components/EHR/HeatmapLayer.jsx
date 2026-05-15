import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ data, options }) {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        if (!map || !data) return;

        // Transform data to expected format: [lat, lng, intensity]
        const points = data.map(p => [p.lat, p.lng, p.intensity || 1]);

        if (layerRef.current) {
            layerRef.current.setLatLngs(points);
            if (options) layerRef.current.setOptions(options);
        } else {
            layerRef.current = L.heatLayer(points, options).addTo(map);
        }

        return () => {
            if (layerRef.current && map) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, data, options]);

    return null;
}
