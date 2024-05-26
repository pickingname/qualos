import axios from "axios";
import Papa from "papaparse";

let theme = "light"; // Default theme
let isSuccessfulCall = true;
let isDataChanged = false;

// Check the color scheme preference
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  theme = "dark";
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    theme = event.matches ? "dark" : "light";
    console.info("theme changed, refreshing...");
    location.reload();
  });

let p2p =
  "https://api.p2pquake.net/v2/history?codes=551&codes=552&limit=1&offset=0";

const fetchComparisonData = async () => {
  try {
    const response = await axios.get(
      "https://pickingname.github.io/basemap/compare_points.csv"
    );
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

let previousData = null;
let map = null;
let markersGroup = null;

const updateMap = async (data) => {
  if (!map) {
    map = L.map("map", {
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

    L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${theme}_all/{z}/{x}/{y}{r}.png`,
      {
        maxZoom: 24,
      }
    ).addTo(map);
  }

  if (markersGroup) {
    markersGroup.clearLayers();
  } else {
    markersGroup = L.featureGroup().addTo(map);
  }

  const epicenterIcon = L.icon({
    iconUrl: "https://pickingname.github.io/basemap/icons/epicenter.png",
    iconSize: [30, 30],
  });

  L.marker(
    [data.earthquake.hypocenter.latitude, data.earthquake.hypocenter.longitude],
    { icon: epicenterIcon }
  ).addTo(markersGroup);

  const comparisonData = await fetchComparisonData();

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
};

const fetchDataAndLog = async () => {
  try {
    const response = await axios.get(p2p);
    
    if (isSuccessfulCall === false) {
      console.log("API call successful with response code:", response.status);
      isSuccessfulCall = true;
    }
    isSuccessfulCall = true;
    const newData = response.data[0];

    if (
      !previousData ||
      JSON.stringify(newData) !== JSON.stringify(previousData)
    ) {
      isDataChanged = true;
      console.log("Data has changed, updating map.");
      await updateMap(newData);
      previousData = newData;
    } else {
      if (isDataChanged === true) {
        // console.log("Data has not changed."); nvm
        isDataChanged = false;
      }
    }
  } catch (error) {
    console.error("API call failed:", error);
    isSuccessfulCall = false;
  }
};

// Fetch data immediately and then every 3 seconds
fetchDataAndLog();
setInterval(fetchDataAndLog, 3000);
