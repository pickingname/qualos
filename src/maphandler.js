import axios from "axios";
import Papa from "papaparse";
import { initCircleRendering } from "./circleRenderer";
import { isEEWforIndex } from "./circleRenderer";
let isScalePrompt = false;
let iconPadding = 0.0;
let prevForeign = false; // this is for the padding marker system
let currentTW = false;
let foreTs = false;
let domeTs = false;
let tsMag, tsInt, tsDepth;

const apiEndpoint =
  "https://api.p2pquake.net/v2/history?codes=551&codes=552&limit=2&offset=0";
const tsunamiApiEndpoint =
  "http://localhost:5500/tsunami.json"; // https://api.p2pquake.net/v2/jma/tsunami?limit=1&offset=7
const geojsonUrl =
  "https://pickingname.github.io/basemap/tsunami_areas.geojson";

let userTheme = "light";
let isApiCallSuccessful = true;
let isMapDataChanged = false;
let isPreviouslyScalePrompt = false;
let isPreviouslyUpdated = true;
let isPreviouslyForeign = false;

var newData = new Audio("https://pickingname.github.io/datastores/yes.mp3");
var intensityReport = new Audio(
  "https://pickingname.github.io/datastores/update.mp3"
);
var distantArea = new Audio(
  "https://pickingname.github.io/datastores/alert.mp3"
);
var tsunamiWarning = new Audio(
  "https://pickingname.github.io/datastores/eq/E4.mp3"
);

export let responseCache;

let previousEarthquakeData = null;
let mapInstance = null;
let markersLayerGroup = null;
let stationMarkersGroup = null;
let tsunamiGeojsonLayer = null;

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
    document.getElementById("statusText").classList.add("text-red-600");
    document.getElementById("statusText").textContent =
      "Error fetching comparison data, " + error;
    return [];
  }
};

const getTrueIntensity = (maxScale) => {
  switch (maxScale) {
    case 10:
      return "1";
    case 20:
      return "2";
    case 30:
      return "3";
    case 40:
      return "4";
    case 45:
      return "5-";
    case 50:
      return "5+";
    case 55:
      return "6-";
    case 60:
      return "6+";
    case 70:
      return "7";
    default:
      console.log("intensity isnt on the list, " + maxScale);
      return "--";
  }
};

function handleTsunamiWarning(type) {
  tsunamiWarning.play();
  document.getElementById("emergWarnTextContainer").classList.remove("hidden");
  document.getElementById("tsType").textContent = type;
}

function handleTsunamiOriginType(type) {
  document.getElementById("warnOrigin").textContent =
    type.charAt(0).toUpperCase() + type.slice(1);
}

function setTsWarningTexts(mag, int, depth) {
  document.getElementById("tsMag").textContent = mag;
  document.getElementById("tsInt").textContent = int;
  document.getElementById("tsDepth").textContent = depth;
}

function removeTsunamiWarning() {
  tsunamiWarning.pause();
  document.getElementById("emergWarnTextContainer").classList.add("hidden");
  document.getElementById("tsType").textContent = "";
}

const findStationCoordinates = (comparisonData, stationName) => {
  const station = comparisonData.find((entry) => entry.name === stationName);
  return station
    ? { lat: parseFloat(station.lat), lng: parseFloat(station.long) }
    : null;
};

const updateCamera = (bounds) => {
  if (bounds && bounds.isValid()) {
    mapInstance.flyToBounds(bounds.pad(iconPadding), {
      duration: 0.15,
      easeLinearity: 0.15,
    });
  } else {
    console.warn("No valid bounds for updating camera");
  }
};

let deflatedIconColors = {};

const getScaleColor = (scale) => {
  if (userTheme === "dark") {
    deflatedIconColors = {
      10: "#8e979780",
      20: "#119a4c80",
      30: "#136ca580",
      40: "#c99c0090",
      45: "#f18a2d90",
      50: "#d16a0c90",
      55: "#eb190090",
      60: "#b7130090",
      70: "#96009690",
    };
  } else {
    deflatedIconColors = {
      10: "#6b787850",
      20: "#119a4c50",
      30: "#136ca560",
      40: "#c99c0060",
      45: "#f18a2d70",
      50: "#d16a0c80",
      55: "#eb190090",
      60: "#b7130090",
      70: "#96009690",
    };
  }
  return deflatedIconColors[scale] || "#CCCCCC50";
};

const createDeflatedIcon = (scale) => {
  return L.divIcon({
    html: `<div style="background-color: ${getScaleColor(
      scale
    )}; width: 10px; height: 10px; border-radius: 50%;"></div>`,
    className: "deflated-marker",
    iconSize: [10, 10],
  });
};

const createInflatedIcon = (scale) => {
  let iconScale = scale.toString().replace("+", "p").replace("-", "m");
  const validScales = [10, 20, 30, 40, 45, 50, 55, 60, 70];
  const numericIconScale = parseInt(iconScale, 10);

  if (!validScales.includes(numericIconScale)) {
    iconScale = "invalid";
  }

  const iconUrl = isScalePrompt
    ? `https://pickingname.github.io/basemap/icons/scales/${iconScale}.png`
    : `https://pickingname.github.io/basemap/icons/intensities/${iconScale}.png`;

  return L.divIcon({
    html: `<img src="${iconUrl}" style="width: 20px; height: 20px;">`,
    className: "inflated-marker",
    iconSize: [20, 20],
  });
};

const updateMapWithData = async (earthquakeData) => {
  if (!mapInstance) {
    mapInstance = L.map("map", {
      center: [35.689487, 139.691711],
      zoom: 5,
      maxZoom: 8,
      minZoom: 2,
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

  if (stationMarkersGroup) {
    stationMarkersGroup.clearLayers();
  } else {
    stationMarkersGroup = L.inflatableMarkersGroup({
      iconCreateFunction: function (marker) {
        return createDeflatedIcon(marker.options.scale);
      },
    }).addTo(mapInstance);
  }

  // Tsunami warning handler
  if (
    earthquakeData.earthquake.domesticTsunami.toLowerCase() === "warning" ||
    earthquakeData.earthquake.domesticTsunami.toLowerCase() === "watch"
  ) {
    currentTW = true;
    domeTs = true;
    handleTsunamiOriginType("domestic");
    handleTsunamiWarning(earthquakeData.earthquake.domesticTsunami);
  } else {
    domeTs = false;
  }

  if (
    earthquakeData.earthquake.foreignTsunami.toLowerCase() === "warning" ||
    earthquakeData.earthquake.foreignTsunami.toLowerCase() === "watch"
  ) {
    currentTW = true;
    foreTs = true;
    handleTsunamiOriginType("foreign");
    handleTsunamiWarning(earthquakeData.earthquake.foreignTsunami);
  } else {
    foreTs = false;
  }

  if (foreTs === false && domeTs === false) {
    removeTsunamiWarning();
  } else if (foreTs === true && domeTs === true) {
    handleTsunamiWarning("Warning");
    handleTsunamiOriginType("foreign & domestic");
  }

  if (earthquakeData.issue.type === "Foreign") {
    prevForeign = true;
    L.marker([24.444243, 122.927329]).setOpacity(0.0).addTo(markersLayerGroup);
    L.marker([45.65552, 141.92889]).setOpacity(0.0).addTo(markersLayerGroup);
    L.marker([44.538807, 147.777433]).setOpacity(0.0).addTo(markersLayerGroup);
    iconPadding = 0.1;
  } else {
    prevForeign = false;
    iconPadding = 0;
  }

  if (earthquakeData.issue.type !== "ScalePrompt") {
    isScalePrompt = false;
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

    const comparisonData = await fetchComparisonData(
      "https://pickingname.github.io/basemap/compare_points.csv"
    );

    earthquakeData.points.forEach((point) => {
      const stationCoordinates = findStationCoordinates(
        comparisonData,
        point.addr
      );
      if (stationCoordinates) {
        const marker = L.marker(
          [stationCoordinates.lat, stationCoordinates.lng],
          {
            icon: createInflatedIcon(point.scale),
            scale: point.scale,
          }
        );
        stationMarkersGroup.addLayer(marker);
      }
    });
  } else {
    isScalePrompt = true;
    const comparisonData = await fetchComparisonData(
      "https://pickingname.github.io/basemap/prefs.csv"
    );

    earthquakeData.points.forEach((point) => {
      console.log(`Processing point with address: ${point.addr}`);
      const stationCoordinates = findStationCoordinates(
        comparisonData,
        point.addr
      );
      if (stationCoordinates) {
        console.log(
          `Found coordinates for ${point.addr}: `,
          stationCoordinates
        );
        const marker = L.marker(
          [stationCoordinates.lat, stationCoordinates.lng],
          {
            icon: createInflatedIcon(point.scale),
            scale: point.scale,
          }
        );
        stationMarkersGroup.addLayer(marker);
      } else {
        console.warn(`No coordinates found for ${point.addr}`);
      }
    });
  }

  const bounds = markersLayerGroup
    .getBounds()
    .extend(stationMarkersGroup.getBounds());

  // Include tsunamiGeojsonLayer bounds if it exists
  if (tsunamiGeojsonLayer) {
    bounds.extend(tsunamiGeojsonLayer.getBounds());
  }

  var shouldIUpdate = isEEWforIndex || true;

  if (bounds.isValid() && shouldIUpdate) {
    updateCamera(bounds);
  } else if (!bounds.isValid()) {
    console.info("No valid bounds for markersLayerGroup");
  }
};

const fetchTsunamiData = async () => {
  try {
    const response = await axios.get(tsunamiApiEndpoint);
    return response.data[0];
  } catch (error) {
    console.error("Error fetching tsunami data:", error);
    return null;
  }
};

const fetchGeojsonData = async () => {
  try {
    const response = await axios.get(geojsonUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching GeoJSON data:", error);
    return null;
  }
};

const updateTsunamiLayer = async (tsunamiData, geojsonData) => {
  if (tsunamiGeojsonLayer) {
    mapInstance.removeLayer(tsunamiGeojsonLayer);
  }

  if (tsunamiData.cancelled) {
    return; // Don't display anything if cancelled is true
  }

  tsunamiGeojsonLayer = L.geoJSON(geojsonData, {
    style: (feature) => {
      const tsunamiArea = tsunamiData.areas.find(
        (area) => area.name === feature.properties.name
      );
      if (tsunamiArea) {
        return {
          color: getTsunamiColor(tsunamiArea.grade),
          weight: 3,
          opacity: 0.7,
        };
      }
      return {
        color: "#ccc",
        weight: 1,
        opacity: 0.3,
      };
    },
  }).addTo(mapInstance);
};

const getTsunamiColor = (grade) => {
  switch (grade) {
    case "Warning":
      return "#ff0000";
    case "Watch":
      return "#ffff00";
    default:
      return "#ccc";
  }
};

const updateMapWithTsunamiData = async () => {
  const tsunamiData = await fetchTsunamiData();
  const geojsonData = await fetchGeojsonData();

  if (tsunamiData && geojsonData) {
    await updateTsunamiLayer(tsunamiData, geojsonData);
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

    tsDepth = latestEarthquakeData.earthquake.hypocenter.depth;
    tsInt = getTrueIntensity(latestEarthquakeData.earthquake.maxScale);
    tsMag = latestEarthquakeData.earthquake.hypocenter.magnitude;

    if (latestEarthquakeData.issue.type === "Foreign") {
      if (isPreviouslyForeign === false) {
        distantArea.play();
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
        newData.play();
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
        intensityReport.play();
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

    // Update tsunami data
    await updateMapWithTsunamiData();
  } catch (error) {
    console.error("API call failed:", error);
    document.getElementById("statusText").classList.add("text-red-600");
    document.getElementById("statusText").textContent = "Map error: " + error;
    isApiCallSuccessful = false;
  }

  if (currentTW === true) {
    setTsWarningTexts(tsMag, tsInt, tsDepth);
  }
};

// Initial data fetch and update
fetchAndUpdateData();

// Set up intervals for regular updates
setInterval(() => {
  if (isEEWforIndex === false) {
    const bounds = markersLayerGroup
      ? markersLayerGroup.getBounds().extend(stationMarkersGroup.getBounds())
      : null;
    if (bounds && bounds.isValid()) {
      updateCamera(bounds);
    } else {
      console.info("No valid bounds for interval camera update");
    }
  }
}, 3000);

setTimeout(function () {
  setInterval(fetchAndUpdateData, 2000);
}, 2000);

updateMapWithTsunamiData();