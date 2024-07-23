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

const apiEndpoint =
  "http://localhost:5500/tsunami.json";

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

function handleTsunamiWarning(type) {
  tsunamiWarning.play();
  document.getElementById("emergWarnTextContainer").classList.remove("hidden");
  if (type === "Warning") {
    console.info("tsunami warning has been issued");
    document.getElementById("emergWarnText").textContent = "TSUNAMI WARNING";
  }
  if (type === "Watch") {
    console.info("tsunami watch has been issued");
    document.getElementById("emergWarnText").textContent =
      "TSUNAMI WATCH ISSUED";
  }
}

function removeTsunamiWarning() {
  tsunamiWarning.pause();
  document.getElementById("emergWarnTextContainer").classList.add("hidden");
  document.getElementById("emergWarnText").textContent = "";
}

const findStationCoordinates = (comparisonData, stationName) => {
  const station = comparisonData.find((entry) => entry.name === stationName);
  return station
    ? { lat: parseFloat(station.lat), lng: parseFloat(station.long) }
    : null;
};

let previousEarthquakeData = null;
let mapInstance = null;
let markersLayerGroup = null;
let stationMarkersGroup = null;

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

const getScaleColor = (scale) => {
  const colors = {
    10: "#6b787850",
    20: "#119a4c50",
    30: "#136ca560",
    40: "#c99c0060",
    45: "#f18a2d70",
    50: "#d16a0c80",
    55: "#eb190090",
    60: "#b71300",
    70: "#960096",
  };
  return colors[scale] || "#CCCCCC";
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
  let iconUrl = "";
  if (isScalePrompt === true) {
    iconUrl = `https://pickingname.github.io/basemap/icons/scales/${iconScale}.png`;
  } else {
    iconUrl = `https://pickingname.github.io/basemap/icons/intensities/${iconScale}.png`;
  }
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

  // TSUNAMI HANDLER STARTS HERE

  if (earthquakeData.earthquake.domesticTsunami.toLowerCase() === "warning") {
    currentTW = true;
    domeTs = true;
    handleTsunamiWarning("Warning");
  } else if (earthquakeData.earthquake.domesticTsunami.toLowerCase() === "watch") {
    currentTW = true;
    domeTs = true;
    handleTsunamiWarning("Watch");
  } else {
    domeTs = false;
  }

  if (earthquakeData.earthquake.foreignTsunami.toLowerCase() === "warning") {
    currentTW = true;
    foreTs = true;
    handleTsunamiWarning("Warning (Foreign)");
  } else if (earthquakeData.earthquake.foreignTsunami.toLowerCase() === "watch") {
    currentTW = true;
    foreTs = true;
    handleTsunamiWarning("Watch (Foreign)");
  } else {
    foreTs = false;
  }

  // checking system
  if (foreTs === false && domeTs === false) {
    // no ts
    removeTsunamiWarning();
  } else if (foreTs === true && domeTs === true) {
    // both ts (no way this will happen)
    handleTsunamiWarning("Warning (Both foreign and domestic)");
  }

  // TSUNAMI HANDLER ENDS HERE

  if (earthquakeData.issue.type === "Foreign") {
    // if its a foreign then apply the marker to both NE and SW of the country to make a padding
    prevForeign = true;
    L.marker([24.444243, 122.927329]).setOpacity(0.0).addTo(markersLayerGroup); // lower left
    L.marker([45.65552, 141.92889]).setOpacity(0.0).addTo(markersLayerGroup); // upper
    L.marker([44.538807, 147.777433]).setOpacity(0.0).addTo(markersLayerGroup); // upper right
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
    const comparisonData = await fetchComparisonData(
      "https://pickingname.github.io/basemap/prefs.csv"
    );

    earthquakeData.points.forEach((point) => {
      isScalePrompt = true;
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

  var shouldIUpdate = isEEWforIndex || true;

  if (bounds.isValid() && shouldIUpdate) {
    updateCamera(bounds);
  } else if (!bounds.isValid()) {
    console.info("No valid bounds for markersLayerGroup");
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
  } catch (error) {
    console.error("API call failed:", error);
    document.getElementById("statusText").classList.add("text-red-600");
    document.getElementById("statusText").textContent = "Map error: " + error;
    isApiCallSuccessful = false;
  }
};

fetchAndUpdateData();

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
