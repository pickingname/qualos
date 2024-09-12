import axios from "axios";
import Papa from "papaparse";
import { dimScreenAndReload } from "./reloadHandler";
import { initCircleRendering, isEEWforIndex } from "./circleRenderer";
let isScalePrompt = false;
let iconPadding = 0.0;
let currentTW = false;
let foreTs = false;
let domeTs = false;
let tsMag = "--";
let tsInt = "--";
let tsDepth = "--";
let shouldIUpdate = true;
let doNotUpdateBondBecauseThereIsAFuckingTsunami = false;
const tsunamiApiEndpoint =
  "https://api.p2pquake.net/v2/jma/tsunami?limit=1&offset=0";
const geojsonUrl =
  "https://pickingname.github.io/basemap/tsunami_areas.geojson";

let userTheme = "light";
const themeSetting = localStorage.getItem("theme");
let isApiCallSuccessful = true;
let isMapDataChanged = false;
let isPreviouslyScalePrompt = false;
let isPreviouslyUpdated = true;
let isPreviouslyForeign = false;
let mapPan = "false"; // defaults to false
let isThereEEWNow = "true";
// skipcq: JS-0239, JS-0119, JS-E1009
export var currentID;

// skipcq: JS-0125 uses leaflet now since leaflet should also be ignore cause it is fetched fron a cdn
const leaflet = L;

const newData = new Audio("https://pickingname.github.io/datastores/yes.mp3");
const intensityReport = new Audio(
  "https://pickingname.github.io/datastores/update.mp3",
);
const distantArea = new Audio(
  "https://pickingname.github.io/datastores/alert.mp3",
);
const tsunamiWarning = new Audio(
  "https://pickingname.github.io/datastores/eq/E4.mp3",
);

let previousEarthquakeData = null;
let mapInstance = null;
let markersLayerGroup = null;
let stationMarkersGroup = null;
let tsunamiGeojsonLayer = null;
let usegeojson = "false"; // needs init on exec anyway and needs to be false on default

if (localStorage.getItem("geoJsonMap") === "true") {
  usegeojson = true;
} else if (localStorage.getItem("geoJsonMap") === "false") {
  usegeojson = false;
} else {
  console.log(
    `geoJsonMap is ${localStorage.getItem("geoJsonMap")}, defaulting to false`,
  );
  localStorage.setItem("geoJsonMap", "false");
}

if (localStorage.getItem("theme") === null) {
  console.log(
    `localstorage theme is ${localStorage.getItem(
      "theme",
    )}, defaulting to system.`,
  );
  localStorage.setItem("theme", "system");
}

if (themeSetting === "system") {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    userTheme = "dark";
    document.body.classList.add("dark");
  } else {
    userTheme = "light";
    document.body.classList.remove("dark");
  }
} else if (themeSetting === "dark") {
  userTheme = "dark";
  document.body.classList.add("dark");
} else if (themeSetting === "light") {
  userTheme = "light";
  document.body.classList.remove("dark");
} else {
  userTheme = "dark";
  document.body.classList.add("dark");
}

if (localStorage.getItem("movableMap") === "true") {
  mapPan = true;
} else if (localStorage.getItem("movableMap") === "false") {
  mapPan = false;
} else {
  console.log(
    `movableMap is ${localStorage.getItem("movableMap")}, defaulting to false`,
  );
  localStorage.setItem("movableMap", "false");
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    userTheme = event.matches ? "dark" : "light";
    if (localStorage.getItem("theme") === "system") {
      console.log(
        "User theme changed and the setting is system, refreshing...",
      );
      dimScreenAndReload("user changed system theme");
    }
  });

/**
 * Fetches comparison data from a specified URL and parses it using PapaParse.
 *
 * @async
 * @function fetchComparisonData
 * @param {string} url - The URL to fetch the comparison data from.
 * @returns {Promise<Object[]>} A promise that resolves to an array of parsed data objects.
 * @throws {Error} If the API call fails.
 */
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

/**
 * Converts a given maximum seismic intensity scale to its corresponding intensity level.
 *
 * @function getTrueIntensity
 * @param {number} maxScale - The maximum seismic intensity scale.
 * @returns {string} The corresponding intensity level as a string. If the scale is not recognized, returns "--".
 */
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
      return "--";
  }
};

/**
 * Handles the display and audio for a tsunami warning.
 * Will display the warning card and play the warning audio.
 *
 * @function handleTsunamiWarning
 * @param {string} type - The type of tsunami warning.
 */
function handleTsunamiWarning(type) {
  tsunamiWarning.play();
  document.getElementById("emergWarnTextContainer").classList.remove("hidden");
  document.getElementById("tsType").textContent = type;
}

/**
 * Updates the tsunami warning origin type text.
 *
 * @function handleTsunamiOriginType
 * @param {string} type - The origin type of the tsunami warning.
 */
function handleTsunamiOriginType(type) {
  document.getElementById("warnOrigin").textContent =
    type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Sets the tsunami warning texts for magnitude, intensity, and depth.
 * PROBLEM: this will only displays the latest earthquake data, which might not be the one that causes the tsunami warning in the first place.
 *
 * @function setTsWarningTexts
 * @param {string} mag - The magnitude of the tsunami.
 * @param {string} int - The intensity of the tsunami.
 * @param {string} depth - The depth of the tsunami.
 */
function setTsWarningTexts(mag, int, depth) {
  document.getElementById("tsMag").textContent = mag;
  document.getElementById("tsInt").textContent = int;
  document.getElementById("tsDepth").textContent = depth;
}

/**
 * Removes the tsunami warning display and pauses the warning audio.
 *
 * @function removeTsunamiWarning
 */
function removeTsunamiWarning() {
  tsunamiWarning.pause();
  document.getElementById("emergWarnTextContainer").classList.add("hidden");
  document.getElementById("tsType").textContent = "";
}

/**
 * Finds the coordinates of a station given its name from the comparison data.
 *
 * @function findStationCoordinates
 * @param {Object[]} comparisonData - An array of objects containing station data.
 * @param {string} stationName - The name of the station to find.
 * @returns {Object|null} An object containing the latitude and longitude of the station, or null if the station is not found.
 */
const findStationCoordinates = (comparisonData, stationName) => {
  const station = comparisonData.find((entry) => entry.name === stationName);
  return station
    ? { lat: parseFloat(station.lat), lng: parseFloat(station.long) }
    : null;
};

/**
 * Updates the camera view on the map to fit the given intensity points bounds or whatever is given.
 *
 * @function updateCamera
 * @param {Object} bounds - The bounds to fit the camera view to. Must have an `isValid` method.
 * @returns {void}
 */
const updateCamera = (bounds) => {
  if (bounds?.isValid()) {
    if (doNotUpdateBondBecauseThereIsAFuckingTsunami === false) {
      const originalMaxZoom = mapInstance.options.maxZoom;
      mapInstance.options.maxZoom = 8;
      mapInstance.flyToBounds(bounds.pad(iconPadding), {
        duration: 0.15,
        easeLinearity: 0.15,
      });
      mapInstance.options.maxZoom = originalMaxZoom;
    }
  } else {
    console.warn("No valid bounds for updating camera");
  }
};

let deflatedIconColors = {};

/**
 * Returns the color associated with a given seismic intensity scale based on the users selected theme
 * This is only for the deflated intensity icons
 *
 * @function getScaleColor
 * @param {number} scale - The seismic intensity scale.
 * @returns {string} The color corresponding to the seismic intensity scale.
 */
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

/**
 * Creates a deflated icon for a given seismic intensity scale.
 * Deflated icon only appears when the cluster of a station is too close
 * This will be a semi-transparent circle with the color of the scale
 *
 * @function createDeflatedIcon
 * @param {number} scale - The seismic intensity scale.
 * @returns {Object} A Leaflet divIcon object with the appropriate color and size.
 */
const createDeflatedIcon = (scale) => {
  return leaflet.divIcon({
    html: `<div style="background-color: ${getScaleColor(
      scale,
    )}; width: 10px; height: 10px; border-radius: 50%;"></div>`,
    className: "deflated-marker",
    iconSize: [10, 10],
  });
};

/**
 * Creates an inflated icon for a given seismic intensity scale.
 * Inflated icon only appears when the cluster of a station is far enough
 * Will uses a icon based on the scale
 * The icon is served from github pages
 *
 * @function createInflatedIcon
 * @param {number} scale - The seismic intensity scale.
 * @returns {Object} A Leaflet divIcon object with the appropriate icon URL and size.
 */
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

  return leaflet.divIcon({
    html: `<img src="${iconUrl}" style="width: 20px; height: 20px;">`,
    className: "inflated-marker",
    iconSize: [20, 20],
  });
};

/**
 * Updates the map with the provided earthquake data.
 * Initializes the map instance if it does not already exist.
 * Adds various layers and markers to the map based on the earthquake data.
 * Handles tsunami warnings and updates the camera view to fit the bounds of the markers.
 *
 * @async
 * @function updateMapWithData
 * @param {Object} earthquakeData - The data related to the earthquake, including points and tsunami information.
 * @returns {Promise<void>} A promise that resolves when the map has been updated.
 */
const updateMapWithData = async (earthquakeData) => {
  if (!mapInstance) {
    mapInstance = leaflet.map("map", {
      center: [35.689487, 139.691711],
      zoom: 5,
      minZoom: 2,
      zoomControl: false,
      attributionControl: false,
      keyboard: false,
      boxZoom: mapPan,
      doubleClickZoom: mapPan,
      tap: mapPan,
      touchZoom: mapPan,
      dragging: mapPan,
      scrollWheelZoom: mapPan,
      // maxBoundsViscosity: 1.0,
      // maxBounds: [
      //   [-90, -180],
      //   [90, 180],
      // ],
    });

    if (usegeojson === true) {
      // skipcq: JS-0125 ignore this because it is fetched from a cdn
      omnivore
        .topojson("https://pickingname.github.io/basemap/subPrefsTopo.json")
        .on("ready", function () {
          this.eachLayer((layer) => {
            layer.setStyle({
              color: userTheme === "dark" ? "#bebebe" : "#969e9e",
              weight: 1,
              smoothFactor: 0.0,
              fill: true,
              fillColor: userTheme === "dark" ? "#FFFFFF" : "#95999b",
              fillOpacity: 0.1,
            });
          });
        })
        .addTo(mapInstance);

      // world geojson
      fetch("https://pickingname.github.io/basemap/world.geojson")
        .then((response) => response.json())
        .then((data) => {
          leaflet
            .geoJSON(data, {
              style() {
                return {
                  color: userTheme === "dark" ? "#5e5e5e" : "#c2cbcc",
                  weight: 1,
                  smoothFactor: 0.0,
                  fill: true,
                  fillColor: userTheme === "dark" ? "#121212" : "#969e9e",
                  fillOpacity: 0.5,
                };
              },
            })
            .addTo(mapInstance);
        })
        .catch((error) => console.error("Error loading GeoJSON:", error));
    } else if (usegeojson === false) {
      leaflet
        .tileLayer(
          `https://{s}.basemaps.cartocdn.com/${userTheme}_all/{z}/{x}/{y}{r}.png`,
          {
            maxZoom: 24,
          },
        )
        .addTo(mapInstance);
    } else {
      leaflet
        .tileLayer(
          `https://{s}.basemaps.cartocdn.com/${userTheme}_all/{z}/{x}/{y}{r}.png`,
          {
            maxZoom: 24,
          },
        )
        .addTo(mapInstance);
    }

    initCircleRendering(mapInstance);
  }

  if (markersLayerGroup) {
    markersLayerGroup.clearLayers();
  } else if (isEEWforIndex === false) {
    markersLayerGroup = leaflet.featureGroup().addTo(mapInstance);
  }

  if (stationMarkersGroup) {
    stationMarkersGroup.clearLayers();
  } else {
    stationMarkersGroup = leaflet
      .inflatableMarkersGroup({
        iconCreateFunction(marker) {
          return createDeflatedIcon(marker.options.scale);
        },
      })
      .addTo(mapInstance);
  }

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
    leaflet
      .marker([24.444243, 122.927329])
      .setOpacity(0.0)
      .addTo(markersLayerGroup);
    leaflet
      .marker([45.65552, 141.92889])
      .setOpacity(0.0)
      .addTo(markersLayerGroup);
    leaflet
      .marker([44.538807, 147.777433])
      .setOpacity(0.0)
      .addTo(markersLayerGroup);
    iconPadding = 0.1;
  } else {
    iconPadding = 0;
  }

  if (earthquakeData.issue.type !== "ScalePrompt") {
    isScalePrompt = false;
    // tempskip
    const epicenterIcon = leaflet.icon({
      iconUrl: "https://pickingname.github.io/basemap/icons/oldEpicenter.png",
      iconSize: [30, 30],
    });

    // tempskip
    leaflet
      .marker(
        [
          earthquakeData.earthquake.hypocenter.latitude,
          earthquakeData.earthquake.hypocenter.longitude,
        ],
        { icon: epicenterIcon },
      )
      .addTo(markersLayerGroup);

    const comparisonData = await fetchComparisonData(
      "https://pickingname.github.io/basemap/compare_points.csv",
    );

    earthquakeData.points.forEach((point) => {
      const stationCoordinates = findStationCoordinates(
        comparisonData,
        point.addr,
      );
      if (stationCoordinates) {
        // tempskip
        const marker = leaflet.marker(
          [stationCoordinates.lat, stationCoordinates.lng],
          {
            icon: createInflatedIcon(point.scale),
            scale: point.scale,
          },
        );
        stationMarkersGroup.addLayer(marker);
      }
    });
  } else {
    isScalePrompt = true;
    const comparisonData = await fetchComparisonData(
      "https://pickingname.github.io/basemap/prefs.csv",
    );

    earthquakeData.points.forEach((point) => {
      console.log(`processing point with address: ${point.addr}`);
      const stationCoordinates = findStationCoordinates(
        comparisonData,
        point.addr,
      );
      if (stationCoordinates) {
        console.log(
          `found coordinates for ${point.addr}: `,
          stationCoordinates,
        );
        // tempskip
        const marker = leaflet.marker(
          [stationCoordinates.lat, stationCoordinates.lng],
          {
            icon: createInflatedIcon(point.scale),
            scale: point.scale,
          },
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
  shouldIUpdate = isEEWforIndex || true;
  if (bounds.isValid() && shouldIUpdate) {
    updateCamera(bounds);
  } else if (!bounds.isValid()) {
    console.log("No valid bounds for markersLayerGroup");
  }
};

/**
 * Fetches tsunami data from the API and returns the first entry in the response data.
 *
 * @async
 * @function fetchTsunamiData
 * @returns {Promise<Object|null>} A promise that resolves to the fetched tsunami data, or null if an error occurs.
 * @throws {Error} If the API call fails.
 */
const fetchTsunamiData = async () => {
  try {
    const response = await axios.get(tsunamiApiEndpoint);
    return response.data[0];
  } catch (error) {
    console.error("Error fetching tsunami data:", error);
    return null;
  }
};

/**
 * Fetches GeoJSON data from a specified URL (https://pickingname.github.io/basemap/tsunami_areas.geojson).
 *
 * @async
 * @function fetchGeojsonData
 * @returns {Promise<Object|null>} A promise that resolves to the fetched GeoJSON data, or null if an error occurs.
 * @throws {Error} If the API call fails.
 */
const fetchGeojsonData = async () => {
  try {
    const response = await axios.get(geojsonUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching GeoJSON data:", error);
    return null;
  }
};

/**
 * Returns the color associated with a given tsunami warning grade. Returns blue for unknown grades.
 *
 * @param {string} grade - The tsunami warning grade. Can be "Warning", "Watch", or any other string.
 * @returns {string} The color corresponding to the tsunami warning grade. (Red for "Warning", yellow for "Watch", blue for unknown grades.)
 */
const getTsunamiColor = (grade) => {
  switch (grade) {
    case "Warning":
      return "#ff0000";
    case "Watch":
      return "#ffff00";
    default:
      return "#1c7aff";
  }
};

/**
 * Updates the tsunami layer on the map with the provided tsunami and geojson data.
 *
 * @async
 * @function updateTsunamiLayer
 * @param {Object} tsunamiData - The data related to the tsunami, including areas and their grades.
 * @param {Object} geojsonData - The GeoJSON data to be displayed on the map.
 * @returns {Promise<void>} A promise that resolves when the tsunami layer has been updated.
 */
const updateTsunamiLayer = (tsunamiData, geojsonData) => {
  if (tsunamiGeojsonLayer) {
    mapInstance.removeLayer(tsunamiGeojsonLayer);
  }

  if (tsunamiData && !tsunamiData.cancelled && geojsonData) {
    const filteredGeojsonData = {
      ...geojsonData,
      features: geojsonData.features.filter((feature) => {
        const tsunamiArea = tsunamiData.areas.find(
          (area) => area.name === feature.properties.name,
        );
        return tsunamiArea?.grade;
      }),
    };

    // tempskip since leaflet is imported from cdn
    tsunamiGeojsonLayer = leaflet
      .geoJSON(filteredGeojsonData, {
        style: (feature) => {
          const tsunamiArea = tsunamiData.areas.find(
            (area) => area.name === feature.properties.name,
          );
          if (tsunamiArea) {
            return {
              color: getTsunamiColor(tsunamiArea.grade),
              weight: 3,
              opacity: 0.7,
              smoothFactor: 0.0,
              noClip: false,
            };
          }
          return {
            color: "#ccc",
            weight: 0,
            opacity: 0,
            smoothFactor: 999994,
          };
        },
      })
      .addTo(mapInstance);

    let bounds = tsunamiGeojsonLayer.getBounds();
    if (markersLayerGroup && markersLayerGroup.getBounds().isValid()) {
      bounds = bounds.extend(markersLayerGroup.getBounds());
    }
    if (stationMarkersGroup && stationMarkersGroup.getBounds().isValid()) {
      bounds = bounds.extend(stationMarkersGroup.getBounds());
    }

    if (bounds.isValid()) {
      updateCamera(bounds);
    } else {
      console.warn(
        "Invalid bounds after combining tsunamiGeojsonLayer with other layers",
      );
    }
  }
};

/**
 * This updates the page if theres a tsunami warnind data from the API
 * This outputs a line on the map
 * This function is not responsible for the sound and the card.
 * And if theres a data, the bounds will be updated to the tsunami area and only that area.
 *
 * @async
 * @function updateMapWithTsunamiData
 * @throws {Error} If the API call fails.
 */
const updateMapWithTsunamiData = async () => {
  try {
    const tsunamiData = await fetchTsunamiData();
    const geojsonData = await fetchGeojsonData();

    if (tsunamiData || geojsonData) {
      await updateTsunamiLayer(tsunamiData, geojsonData);

      if (tsunamiData) {
        if (tsunamiData.cancelled === true) {
          doNotUpdateBondBecauseThereIsAFuckingTsunami = false;
        } else {
          doNotUpdateBondBecauseThereIsAFuckingTsunami = true;
        }
      }
    } else {
      if (tsunamiGeojsonLayer) {
        mapInstance.removeLayer(tsunamiGeojsonLayer);
      }
    }
  } catch (error) {
    console.error("Error updating tsunami data:", error);
  }
};

/**
 * Fetches the latest earthquake data from the API and updates the map accordingly.
 * The API endpoint is determined based on the value stored in localStorage under the key "apiType".
 * If the API call is successful, it updates various global variables and triggers certain actions based on the data.
 * If the API call fails, it logs the error and sets the isApiCallSuccessful flag to false.
 *
 * @async
 * @function fetchAndUpdateData
 * @throws {error} If the API call fails.
 */
const fetchAndUpdateData = async () => {
  try {
    const apiType = localStorage.getItem("apiType");
    let apiEndpoint =
      "https://api.p2pquake.net/v2/history?codes=551&limit=1&offset=0"; // will be init on exec since this should be the default anyway
    if (apiType === "main") {
      apiEndpoint =
        "https://api.p2pquake.net/v2/history?codes=551&limit=1&offset=0";
    } else if (apiType === "sandbox") {
      apiEndpoint =
        "https://api-v2-sandbox.p2pquake.net/v2/history?codes=551&codes=552&limit=1&offset=0";
    } else {
      apiEndpoint =
        "https://api.p2pquake.net/v2/history?codes=551&limit=1&offset=0";
    }

    const response = await axios.get(apiEndpoint);

    if (!isApiCallSuccessful) {
      const sanitizedResponseStatus = response.status
        .toString()
        .replace(/\n|\r/g, "");
      console.log(
        "API call successful with response code:",
        sanitizedResponseStatus,
      );
      isApiCallSuccessful = true;
    }
    isApiCallSuccessful = true;
    const latestEarthquakeData = response.data[0];

    currentID = latestEarthquakeData.id;

    tsDepth = latestEarthquakeData.earthquake.hypocenter.depth;
    // skipcq: JS-A1004
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
      console.log("data has changed, updating map.");
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
    // document.getElementById("statusText").classList.add("text-red-600");
    // document.getElementById("statusText").textContent = "Map error: " + error;
    isApiCallSuccessful = false;
  }

  if (currentTW === true) {
    setTsWarningTexts(tsMag, tsInt, tsDepth);
  }
};

fetchAndUpdateData();

setInterval(() => {
  if (isEEWforIndex === true) {
    isThereEEWNow = true;
  } else if (isEEWforIndex === false) {
    if (isThereEEWNow === true) {
      console.log("maphandler eew ended check pass");
      const bounds = markersLayerGroup
        ? markersLayerGroup.getBounds().extend(stationMarkersGroup.getBounds())
        : null;
      if (bounds?.isValid()) {
        updateCamera(bounds);
      } else {
        console.info("No valid bounds for interval camera update");
      }
    }
    isThereEEWNow = false;
  }
}, 1000);

setTimeout(() => {
  setInterval(fetchAndUpdateData, 2000);
}, 2000);

setInterval(updateMapWithTsunamiData, 8000);
