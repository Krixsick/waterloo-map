import mapboxgl from "mapbox-gl";

type BuildingProperties = {
  id?: string;
  name?: string;
  abbreviation?: string;
  description?: string;
  liveHours?: string;
  timeRemaining?: string;
};

const HOVER_LAYERS = [
  "campus-building-circles",
  "residence-building-squares",
];

function addPopupStyles() {
  if (document.getElementById("uw-hover-popup-styles")) return;

  const style = document.createElement("style");
  style.id = "uw-hover-popup-styles";
  style.innerHTML = `
    .uw-hover-popup .mapboxgl-popup-content {
      padding: 0;
      background: transparent;
      box-shadow: none;
      border-radius: 0;
    }

    .uw-hover-popup .mapboxgl-popup-tip {
      border-top-color: rgba(255, 255, 255, 0.78) !important;
    }
  `;

  document.head.appendChild(style);
}

export function addBuildingHoverPopup(
  map: mapboxgl.Map,
  onBuildingClick?: (properties: BuildingProperties) => void
) {
  addPopupStyles();

  const hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 18,
    className: "uw-hover-popup",
  });

  HOVER_LAYERS.forEach((layerId) => {
    map.on("mouseenter", layerId, (e) => {
      map.getCanvas().style.cursor = "pointer";

      const feature = e.features?.[0];
      if (!feature) return;

      const geometry = feature.geometry as GeoJSON.Point;
      const coordinates = geometry.coordinates.slice() as [number, number];
      const properties = feature.properties as BuildingProperties;

      if (layerId === "campus-building-circles") {
        map.setFilter("campus-building-hover", ["==", ["get", "id"], properties.id]);
      }
      if (layerId === "residence-building-squares") {
        map.setFilter("residence-building-hover", ["==", ["get", "id"], properties.id]);
      }

      hoverPopup
        .setLngLat(coordinates)
        .setHTML(`
          <div style="
            width: 200px;
            padding: 12px 14px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.75);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 12px 28px rgba(15,23,42,.14);
            color: #0f172a;
            font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          ">
        
            <div style="
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              gap:10px;
            ">
        
              <div style="min-width:0;">
        
                <div style="
                  font-size:14px;
                  font-weight:600;
                  line-height:1.2;
                  color:#0f172a;
                ">
                  ${properties.name ?? ""}
                </div>
        
                <div style="
                  margin-top:2px;
                  font-size:12px;
                  font-weight:500;
                  color:#64748b;
                ">
                  ${properties.abbreviation ?? ""}
                </div>
        
              </div>
        
              <div style="
                flex-shrink:0;
                padding:3px 8px;
                border-radius:999px;
                background:rgba(34,197,94,.12);
                color:#16a34a;
                font-size:12px;
                font-weight:600;
              ">
                Open
              </div>
        
            </div>
        
            ${
              properties.liveHours
                ? `
                <div style="
                  margin-top:10px;
                  padding-top:10px;
                  border-top:1px solid rgba(148,163,184,.2);
                ">
        
                  <div style="
                    display:flex;
                    align-items:center;
                    gap:7px;
                  ">
        
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style="flex-shrink:0;"
                    >
                      <circle cx="12" cy="12" r="9"></circle>
                      <polyline points="12 7 12 12 15 14"></polyline>
                    </svg>
        
                    <div style="
                      font-size:11px;
                      font-weight:500;
                      color:#475569;
                    ">
                      ${properties.liveHours}
                    </div>
        
                  </div>
        
                  ${
                    properties.timeRemaining
                      ? `
                      <div style="
                        display:flex;
                        align-items:center;
                        gap:7px;
                        margin-top:1px;
                      ">
        
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#64748b"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          style="flex-shrink:0;"
                        >
                          <path d="M6 2h12"></path>
                          <path d="M6 22h12"></path>
                          <path d="M8 2v6a4 4 0 0 0 8 0V2"></path>
                          <path d="M16 22v-6a4 4 0 0 0-8 0v6"></path>
                        </svg>
        
                        <div style="
                          font-size:11px;
                          font-weight:500;
                          color:#475569;
                        ">
                          ${properties.timeRemaining}
                        </div>
        
                      </div>
                      `
                      : ""
                  }
        
                </div>
                `
                : ""
            }
        
          </div>
        `)
        .addTo(map);
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
      if (map.getLayer("campus-building-hover")) {
        map.setFilter("campus-building-hover", ["==", ["get", "id"], ""]);
      }
      if (map.getLayer("residence-building-hover")) {
        map.setFilter("residence-building-hover", ["==", ["get", "id"], ""]);
      }
      hoverPopup.remove();
    });
    map.on("click", layerId, (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
    
      const properties = feature.properties as BuildingProperties;
    
      hoverPopup.remove();
      //since we send a callback function setSelectedBuilding it will use that
      //useState hook and send the properties information back into the
      //selectedBuilding so we can use it in map.tsx
      onBuildingClick?.(properties);
    });
  });
}