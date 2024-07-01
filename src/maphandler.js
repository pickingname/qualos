import axios from "axios";
import Papa from "papaparse";
import { initCircleRendering, isEEW } from "./circleRenderer";

const apiEndpoint = "https://api.p2pquake.net/v2/history?codes=551&codes=552&limit=2&offset=0";
const comparisonDataUrl = "https://pickingname.github.io/basemap/compare_points.csv";
const prefDataUrl = "https://pickingname.github.io/basemap/prefs.csv";

let userTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
let isApiCallSuccessful = true;
let isPreviouslyScalePrompt = false;
let isPreviouslyUpdated = true;
let isPreviouslyForeign = false;
const scaleIconSize = 25;

const intAudio = new Audio("https://pickingname.github.io/datastores/yes.mp3");
const updateAudio = new Audio("https://pickingname.github.io/datastores/update.mp3");
const alertAudio = new Audio("https://pickingname.github.io/datastores/alert.mp3");

export let responseCache;

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  userTheme = event.matches ? "dark" : "light";
  console.info("User theme changed, refreshing...");
  location.reload();
});

const fetchComparisonData = async (url) => {
  try {
    const response = await axios.get(url);
    return Papa.parse(response.data, { header: true }).data;
  } catch (error) {
    console.error("Error fetching comparison data:", error);
    document.getElementById("statusText").classList.add("text-red-600");
    document.getElementById("statusText").textContent = `Error fetching comparison data: ${error}`;
    return [];
  }
};

const findStationCoordinates = (comparisonData, stationName) => {
  const station = comparisonData.find((entry) => entry.name === stationName);
  return station ? { lat: parseFloat(station.lat), lng: parseFloat(station.long) } : null;
};

let previousEarthquakeData = null;
let mapInstance = null;
let markersLayerGroup = null;
let comparisonData = null;
let prefData = null;

const updateCamera = (bounds) => {
  if (bounds && bounds.isValid()) {
    mapInstance.flyToBounds(bounds.pad(0.1), {
      duration: 0.15,
      easeLinearity: 0.15,
    });
  } else {
    console.warn("No valid bounds for updating camera");
  }
};

export const hideMapHandlerIcons = () => {
  if (markersLayerGroup) {
    markersLayerGroup.clearLayers();
  }
};

export const showMapHandlerIcons = () => {
  if (previousEarthquakeData) {
    updateMapWithData(previousEarthquakeData);
  }
};

const updateMapWithData = async (earthquakeData) => {
  if (!mapInstance) {
    mapInstance = L.map("map", {
      center: [35.689487, 139.691711],
      zoom: 5,
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

    initCircleRendering(mapInstance);
  }

  if (markersLayerGroup) {
    markersLayerGroup.clearLayers();
  } else {
    markersLayerGroup = L.featureGroup().addTo(mapInstance);
  }

  if (!comparisonData) {
    comparisonData = await fetchComparisonData(comparisonDataUrl);
  }

  if (!prefData) {
    prefData = await fetchComparisonData(prefDataUrl);
  }

  if (earthquakeData.issue.type !== "ScalePrompt") {
    const epicenterIcon = L.icon({
      iconUrl: "https://pickingname.github.io/basemap/icons/oldEpicenter.png",
      iconSize: [30, 30],
    });

    L.marker(
      [
        earthquakeData.earthquake.hypocenter.latitude,
        earthquakeData.earthquake.hypocenter.longitude,
      ],
      { icon: epicenterIcon }
    ).addTo(markersLayerGroup);

    earthquakeData.points.forEach((point) => {
      const stationCoordinates = findStationCoordinates(comparisonData, point.addr);
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
  } else {
    earthquakeData.points.forEach((point) => {
      const stationCoordinates = findStationCoordinates(prefData, point.addr);
      if (stationCoordinates) {
        const stationIcon = L.icon({
          iconUrl: `https://pickingname.github.io/basemap/icons/scales/${point.scale}.png`,
          iconSize: [scaleIconSize, scaleIconSize],
        });

        L.marker([stationCoordinates.lat, stationCoordinates.lng], {
          icon: stationIcon,
        }).addTo(markersLayerGroup);
      } else {
        console.warn(`No coordinates found for ${point.addr}`);
      }
    });
  }

  const bounds = markersLayerGroup.getBounds();

  if (bounds.isValid() && !isEEW) {
    updateCamera(bounds);
  }
};

const fetchAndUpdateData = async () => {
  try {
    const response = await axios.get(apiEndpoint);
    responseCache = response;

    if (!isApiCallSuccessful) {
      console.log("API call successful with response code:", response.status);
      isApiCallSuccessful = true;
    }

    const latestEarthquakeData = response.data[0];

    if (latestEarthquakeData.issue.type === "Foreign") {
      if (!isPreviouslyForeign) {
        alertAudio.play();
        isPreviouslyForeign = true;
      }
    } else {
      isPreviouslyForeign = false;
    }

    if (
      latestEarthquakeData.earthquake.hypocenter.depth === -1 &&
      latestEarthquakeData.issue.type === "ScalePrompt"
    ) {
      if (!isPreviouslyScalePrompt) {
        intAudio.play();
        isPreviouslyScalePrompt = true;
      }
    } else {
      isPreviouslyScalePrompt = false;
    }

    if (
      !previousEarthquakeData ||
      JSON.stringify(latestEarthquakeData) !== JSON.stringify(previousEarthquakeData)
    ) {
      console.log("Data has changed, updating map.");
      if (!isPreviouslyUpdated) {
        updateAudio.play();
        isPreviouslyUpdated = true;
      }

      if (!isEEW) {
        await updateMapWithData(latestEarthquakeData);
      }
      previousEarthquakeData = latestEarthquakeData;
    } else {
      isPreviouslyUpdated = false;
    }
  } catch (error) {
    console.info("API call failed: this is totally not an error ", error+'a'); // there is totally no errors here
    document.getElementById("statusText").classList.add("text-red-600");
    document.getElementById("statusText").textContent = `Map error: ${error}`;
    isApiCallSuccessful = false;
  }
};

fetchAndUpdateData();