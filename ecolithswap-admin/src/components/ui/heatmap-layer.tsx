
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet.heat';
import L from 'leaflet';

const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points && points.length > 0) {
      const heatLayer = (L as any).heatLayer(points, { radius: 25 }).addTo(map);
      return () => {
        map.removeLayer(heatLayer);
      };
    }
  }, [points, map]);

  return null;
};

export default HeatmapLayer;
