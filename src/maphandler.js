import axios from "axios";
import Papa from "papaparse";

const apiEndpoint = "https://api-v2-sandbox.p2pquake.net/v2/history";

let userTheme = "light";
let isApiCallSuccessful = true;
let isMapDataChanged = false;
let isPreviouslyScalePrompt = false;
let isPreviouslyUpdated = true;
let isPreviouslyForeign = false;
let scaleIconSize = 25;

var intAudio = new Audio("https://pickingname.github.io/datastores/yes.mp3");
var update = new Audio("https://pickingname.github.io/datastores/update.mp3");
var alert = new Audio("https://pickingname.github.io/datastores/alert.mp3");

export let responseCache;

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

const fetchComparisonData = async (url) => {
  try {
    const response = await axios.get(url);
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
      center: [35.689487, 139.691711], // Default center (Tokyo)
      zoom: 8, // Default zoom level
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

  if (earthquakeData.issue.type !== "ScalePrompt") {
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

    const comparisonData = await fetchComparisonData(
      "https://pickingname.github.io/basemap/compare_points.csv"
    );

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
  } else {
    const comparisonData = await fetchComparisonData(
      "https://pickingname.github.io/basemap/prefs.csv"
    );

    earthquakeData.points.forEach((point) => {
      console.log(`Processing point with addr: ${point.addr}`);
      const stationCoordinates = findStationCoordinates(
        comparisonData,
        point.addr
      );
      if (stationCoordinates) {
        console.log(
          `Found coordinates for ${point.addr}: `,
          stationCoordinates
        );
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
  if (bounds.isValid()) {
    mapInstance.flyToBounds(bounds.pad(0.1), {
      duration: 0.15,
      easeLinearity: 0.15,
    });
  } else {
    console.warn("No valid bounds for markersLayerGroup");
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
    isApiCallSuccessful = true;
    const latestEarthquakeData = response.data[0];

    if (latestEarthquakeData.issue.type === "Foreign") {
      if (isPreviouslyForeign === false) {
        alert.play();
        isPreviouslyForeign = true;
      }
    } else {
      isPreviouslyForeign = false;
    }

    if (
      latestEarthquakeData.earthquake.hypocenter.depth === -1 &&
      latestEarthquakeData.issue.type === "ScalePrompt"
    ) {
      if (isPreviouslyScalePrompt === false) {
        intAudio.play();
        isPreviouslyScalePrompt = true;
      }
    } else {
      isPreviouslyScalePrompt = false;
    }

    if (
      !previousEarthquakeData ||
      JSON.stringify(latestEarthquakeData) !==
        JSON.stringify(previousEarthquakeData)
    ) {
      isMapDataChanged = true;
      console.log("Data has changed, updating map.");
      if (isPreviouslyUpdated === false) {
        update.play();
        isPreviouslyUpdated = true;
      }

      await updateMapWithData(latestEarthquakeData);
      previousEarthquakeData = latestEarthquakeData;
    } else {
      if (isMapDataChanged) {
        isPreviouslyUpdated = false;
        isMapDataChanged = false;
      }
    }
  } catch (error) {
    console.error("API call failed:", error);
    isApiCallSuccessful = false;
  }
};

fetchAndUpdateData();

setTimeout(function () {
  setInterval(fetchAndUpdateData, 2000);
}, 2000);
