import mapboxgl from "mapbox-gl";

type BuildingProperties = {
  name?: string;
  abbreviation?: string;
  description?: string;
};

const HOVER_LAYERS = [
  "campus-building-circles",
  "residence-building-squares",
];

export function addBuildingHoverPopup(map: mapboxgl.Map) {
  const hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 14,
  });

  HOVER_LAYERS.forEach((layerId) => {
    map.on("mouseenter", layerId, (e) => {
      map.getCanvas().style.cursor = "pointer";

      const feature = e.features?.[0];
      if (!feature) return;

      const geometry = feature.geometry as GeoJSON.Point;
      const coordinates = geometry.coordinates.slice() as [
        number,
        number
      ];

      const properties = feature.properties as BuildingProperties;

      hoverPopup
        .setLngLat(coordinates)
        .setHTML(`
          <div style="min-width: 160px;">
            <strong>${properties.name ?? ""}</strong>
            <div style="font-size: 12px; opacity: 0.7;">
              ${properties.abbreviation ?? ""}
            </div>
            ${
              properties.description
                ? `<div style="margin-top: 4px; font-size: 12px;">
                    ${properties.description}
                  </div>`
                : ""
            }
          </div>
        `)
        .addTo(map);
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
      hoverPopup.remove();
    });
  });
}
