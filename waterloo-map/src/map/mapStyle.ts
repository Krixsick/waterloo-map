import mapboxgl from "mapbox-gl";

export function hideDefaultLabels(map: mapboxgl.Map) {
  const layers = map.getStyle().layers;

  layers?.forEach((layer) => {
    if (
      layer.type === "symbol" &&
      !layer.id.includes("road-label")
    ) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  });
}
