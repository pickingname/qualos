import axios from "axios";
import Papa from "papaparse";

let theme = 'light'; // Default theme

// Check the color scheme preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  theme = 'dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  theme = event.matches ? "dark" : "light";
  console.info('theme changed, refreshing...')
  location.reload()
});

let p2p = "https://api.p2pquake.net/v2/history?codes=551&codes=552&limit=1&offset=0";

const fetchComparisonData = async () => {
  try {
    const response = await axios.get("https://pickingname.github.io/basemap/compare_points.csv");
    const parsedData = Papa.parse(response.data, { header: true }).data;
    return parsedData;
  } catch (error) {
    console.error("Error fetching comparison data:", error);
    return [];
  }
};

const findStationCoordinates = (compareData, stationName) => {
  const station = compareData.find((entry) => entry.name === stationName);
  return station
    ? { lat: parseFloat(station.lat), lng: parseFloat(station.long) }
    : null;
};

(async () => {
    const response = await axios.get(p2p);
    const data = response.data[0];
  
    const comparisonData = await fetchComparisonData();
  
    const map = L.map("map", {
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      keyboard: false,
      dragging: false,
      zoomControl: false,
      boxZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      tap: false,
      touchZoom: false,
    });
  
    const epicenterIcon = L.icon({
      iconUrl: "https://pickingname.github.io/basemap/icons/epicenter.png",
      iconSize: [30, 30],
    });
  
    const markersGroup = L.featureGroup().addTo(map);
  
    L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${theme}_all/{z}/{x}/{y}{r}.png`,
      {
        maxZoom: 24,
      }
    ).addTo(map);

  //   (function(){
  //     var originalInitTile = L.GridLayer.prototype._initTile
  //     L.GridLayer.include({
  //         _initTile: function (tile) {
  //             originalInitTile.call(this, tile);
  
  //             var tileSize = this.getTileSize();
  
  //             tile.style.width = tileSize.x + 1 + 'px';
  //             tile.style.height = tileSize.y + 1 + 'px';
  //         }
  //     });
  // })()
  
    L.marker(
      [data.earthquake.hypocenter.latitude, data.earthquake.hypocenter.longitude],
      { icon: epicenterIcon }
    ).addTo(markersGroup);
  
    data.points.forEach((point) => {
      const stationCoordinates = findStationCoordinates(
        comparisonData,
        point.addr
      );
      if (stationCoordinates) {
        const stationIcon = L.icon({
          iconUrl: `https://pickingname.github.io/basemap/icons/intensities/${point.scale}.png`,
          iconSize: [20, 20],
        });
  
        L.marker([stationCoordinates.lat, stationCoordinates.lng], {
          icon: stationIcon,
        }).addTo(markersGroup);
      }
    });
  
    map.fitBounds(markersGroup.getBounds().pad(0.1)); // set the padding right here
})();
