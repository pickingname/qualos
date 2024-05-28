import axios from "axios";
import Papa from "papaparse";

let userTheme = "light";
let isApiCallSuccessful = true;
let isMapDataChanged = false;

if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  userTheme = "dark";
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    userTheme = event.matches ? "dark" : "light";
    console.info("User theme changed, refreshing...");
    location.reload();
  });

const apiEndpoint = "https://api.p2pquake.net/v2/history?codes=551&codes=552&limit=1&offset=0";

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

const findStationCoordinates = (comparisonData, stationName) => {
  const station = comparisonData.find((entry) => entry.name === stationName);
  return station
    ? { lat: parseFloat(station.lat), lng: parseFloat(station.long) }
    : null;
};

let previousEarthquakeData = null;
let mapInstance = null;
let markersLayerGroup = null;

const updateMapWithData = async (earthquakeData) => {
  if (!mapInstance) {
    mapInstance = L.map("map", {
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      keyboard: false,
      boxZoom: false,
      doubleClickZoom: false,
      tap: false,
      touchZoom: false,
      dragging: false,
      scrollWheelZoom: false,
    });

    L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${userTheme}_all/{z}/{x}/{y}{r}.png`,
      {
        maxZoom: 24,
      }
    ).addTo(mapInstance);
  }

  if (markersLayerGroup) {
    markersLayerGroup.clearLayers();
  } else {
    markersLayerGroup = L.featureGroup().addTo(mapInstance);
  }

  const epicenterIcon = L.icon({
    iconUrl: "https://pickingname.github.io/basemap/icons/epicenter.png",
    iconSize: [30, 30],
  });

  L.marker(
    [
      earthquakeData.earthquake.hypocenter.latitude,
      earthquakeData.earthquake.hypocenter.longitude,
    ],
    { icon: epicenterIcon }
  ).addTo(markersLayerGroup);

  const comparisonData = await fetchComparisonData();

  earthquakeData.points.forEach((point) => {
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
      }).addTo(markersLayerGroup);
    }
  });

  mapInstance.fitBounds(markersLayerGroup.getBounds().pad(0.1)); // Set the padding here
};

const fetchAndUpdateData = async () => {
  try {
    const response = await axios.get(apiEndpoint);

    if (!isApiCallSuccessful) {
      console.log("API call successful with response code:", response.status);
      isApiCallSuccessful = true;
    }
    isApiCallSuccessful = true;
    const latestEarthquakeData = response.data[0];

    if ( latestEarthquakeData.earthquake.hypocenter.depth === -1 && latestEarthquakeData.issue.type === "ScalePrompt") {
      // intensity report
    } else {
      // not intensity report
    }

    if (
      !previousEarthquakeData ||
      JSON.stringify(latestEarthquakeData) !==
        JSON.stringify(previousEarthquakeData)
    ) {
      isMapDataChanged = true;
      console.log("Data has changed, updating map.");
      await updateMapWithData(latestEarthquakeData);
      previousEarthquakeData = latestEarthquakeData;
    } else {
      if (isMapDataChanged) {
        isMapDataChanged = false;
      }
    }
  } catch (error) {
    console.error("API call failed:", error);
    isApiCallSuccessful = false;
  }
};

fetchAndUpdateData();

setTimeout(function(){
  setInterval(fetchAndUpdateData, 2000);
}, 2000);
