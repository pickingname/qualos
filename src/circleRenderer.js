import axios from "axios";

// skipcq: JS-E1009, JS-0119, JS-0239
export var isEEW, isEEWforIndex;
isEEW = false;
isEEWforIndex = false;
let reportNum = "1";
let isThisTheFirstTime = false;

// skipcq: JS-0125 | leaflet is imported through CDN
const leaflet = L;

const EEW = new Audio("https://pickingname.github.io/datastores/EEW.mp3");
EEW.volume = 0.5;

/**
 * Change the border the the color specified in the function
 * I am too lazy to write the same docs multiple times
 *
 *
 * @function border...
 * @returns {void}
 */
function borderYellow() {
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-neutral-700");
  document
    .getElementById("changeBorderHere")
    .classList.remove("dark:border-neutral-600");
  document.getElementById("changeBorderHere").classList.add("border-amber-400");
}

/**
 * Change the border the the color specified in the function
 * I am too lazy to write the same docs multiple times
 *
 *
 * @function border...
 * @returns {void}
 */
function borderOrange() {
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-neutral-700");
  document
    .getElementById("changeBorderHere")
    .classList.remove("dark:border-neutral-600");
  document
    .getElementById("changeBorderHere")
    .classList.add("border-orange-400");
}

/**
 * Change the border the the color specified in the function
 * I am too lazy to write the same docs multiple times
 *
 *
 * @function border...
 * @returns {void}
 */
function borderRed() {
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-neutral-700");
  document
    .getElementById("changeBorderHere")
    .classList.remove("dark:border-neutral-600");
  document.getElementById("changeBorderHere").classList.add("border-red-500");
}

/**
 * Change the border the the color specified in the function
 * I am too lazy to write the same docs multiple times
 *
 *
 * @function border...
 * @returns {void}
 */
function borderPurple() {
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-neutral-700");
  document
    .getElementById("changeBorderHere")
    .classList.remove("dark:border-neutral-600");
  document
    .getElementById("changeBorderHere")
    .classList.add("border-purple-500");
}

/**
 * Change the border the the color specified in the function
 * I am too lazy to write the same docs multiple times
 *
 *
 * @function border...
 * @returns {void}
 */
function borderBlue() {
  // this is for test or cancelled EEWs
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-neutral-700");
  document
    .getElementById("changeBorderHere")
    .classList.remove("dark:border-neutral-600");
  document.getElementById("changeBorderHere").classList.add("border-blue-500");
}

/**
 * Returns border to the defalt theme color
 *
 * @function border...
 * @returns {void}
 */
function returnBorder() {
  document
    .getElementById("changeBorderHere")
    .classList.add("border-neutral-700");
  document
    .getElementById("changeBorderHere")
    .classList.add("dark:border-neutral-600");
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-purple-500");
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-blue-500");
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-red-500");
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-orange-400");
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-amber-400");
}

/**
 * Fetches circle data from a remote server based on the current date and time.
 * The date and time are adjusted to UTC and then to JST (Japan Standard Time).
 * The function constructs a URL using the adjusted date and time and makes an HTTP GET request to fetch the data.
 * The URL is offsetted by 2 seconds to prevent 404 errors.
 *
 * @async
 * @function fetchCircleData
 * @returns {Promise<Object|null>} A promise that resolves to the fetched circle data, or null if an error occurs.
 * @throws {Error} If the API call fails.
 */
const fetchCircleData = async () => {
  let date = new Date();

  // convert to UTC 0
  date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  // convert to JST
  date = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - 0);
  date.setSeconds(date.getSeconds() - 2); // offset to prevent 404 error

  // i know it is a very aggressive way to ignore but it works
  // skipcq: JS-0246
  const NowTime = `${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(
    -2
    // skipcq: JS-0246
  )}${("0" + date.getDate()).slice(-2)}${("0" + date.getHours()).slice(-2)}${
    // skipcq: JS-0246
    ("0" + date.getMinutes()).slice(-2)
  }${
    // skipcq: JS-0246
    ("0" + date.getSeconds()).slice(-2)
  }`;

  const NowDay = `${date.getFullYear()}${
    // skipcq: JS-0246
    ("0" + (date.getMonth() + 1)).slice(-2)
  }${
    // skipcq: JS-0246
    // skipcq: JS-0246
    ("0" + date.getDate()).slice(-2)
  }`;

  const url = `https://weather-kyoshin.east.edge.storage-yahoo.jp/RealTimeData/${NowDay}/${NowTime}.json`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching circle data:", error);
    return null;
  }
};

/**
 * Renders circles on the map to represent P wave and S wave data from an earthquake if the API is responsed with one
 * Updates the map with the epicenter location and adjusts the view to fit the bounds of the circles.
 * Handles the display of earthquake early warning (EEW) information and updates the UI accordingly.
 *
 * @function renderCircles
 * @param {Object} mapInstance - The Leaflet map instance to render the circles on.
 * @param {Object} circleData - The data related to the earthquake, including P wave and S wave information.
 * @returns {void}
 */
const renderCircles = (mapInstance, circleData) => {
  /**
   * Adjust the camera bounds to fit the P and S wave circles on the map.
   */
  function fitCircleBounds() {
    // skipcq: JS-0129
    bounds.extend(pCircle.getBounds());
    // skipcq: JS-0129
    bounds.extend(sCircle.getBounds());
    // skipcq: JS-0129
    mapInstance.fitBounds(bounds.pad(0.002));
  }
  // remove previous layers if they exist
  if (mapInstance.psSGroup) {
    mapInstance.removeLayer(mapInstance.psSGroup);
    returnBorder();
  }
  if (
    !circleData ||
    !circleData.psWave ||
    !circleData.psWave.items ||
    circleData.psWave.items.length === 0
  ) {
    isThisTheFirstTime = false;
    isEEW = false;
    isEEWforIndex = false;

    document.getElementById("EEW").classList.remove("flex");
    document.getElementById("EEW").classList.add("hidden");
    return;
  }

  isEEW = true;
  isEEWforIndex = true;
  const psWaveItem = circleData.psWave.items[0];

  document.getElementById("INT").classList.add("hidden");
  document.getElementById("STA").classList.add("hidden");
  document.getElementById("EEW").classList.remove("hidden");
  document.getElementById("EEW").classList.add("flex");

  // EEW data for parsing in the index.html
  const epicenterName = circleData.hypoInfo.items[0].regionName;
  const magnitude = parseFloat(circleData.hypoInfo.items[0].magnitude).toFixed(
    1
  );
  reportNum = circleData.hypoInfo.items[0].reportNum;
  const depth = circleData.hypoInfo.items[0].depth;
  // const isTraining = circleData.hypoInfo.items[0].isTraining;
  const isFinal = circleData.hypoInfo.items[0].isFinal;
  const calcIntensity = circleData.hypoInfo.items[0].calcintensity;
  let expInt = "--";
  let reportText = "--";

  // need to do: check if the report is a training report or a final report
  if (isFinal === "true") {
    reportText = "Final report";
  } else if (isFinal === "false") {
    reportText = `Report #${reportNum}`;
  }

  // compare the expected intensity with the calculated intensity
  if (calcIntensity === 0) {
    expInt = "0";
    borderBlue();
  } else if (calcIntensity === "01") {
    expInt = 1;
    borderYellow();
  } else if (calcIntensity === "02") {
    expInt = 2;
    borderYellow();
  } else if (calcIntensity === "03") {
    expInt = 3;
    borderOrange();
  } else if (calcIntensity === "04") {
    expInt = 4;
    borderOrange();
  } else if (calcIntensity === "5-") {
    expInt = "5-";
    borderRed();
  } else if (calcIntensity === "5+") {
    expInt = "5+";
    borderRed();
  } else if (calcIntensity === "6-") {
    expInt = "6-";
    borderPurple();
  } else if (calcIntensity === "6+") {
    expInt = "6+";
    borderPurple();
  } else if (calcIntensity === "07") {
    expInt = 7;
    borderPurple();
  } else {
    expInt = "--";
    borderBlue();
  }

  document.getElementById("intensity").textContent = expInt;
  document.getElementById("magnitude").textContent = `Magnitude: ${magnitude}`;
  document.getElementById("depth").textContent = `Depth:  + ${depth}`;
  document.getElementById("time").textContent = reportText;
  document.getElementById("where").textContent = epicenterName;

  const latitude = parseFloat(psWaveItem.latitude.slice(1)); // remove the 'N' and convert to float
  const longitude = parseFloat(psWaveItem.longitude.slice(1)); // remove the 'E' and convert to float
  const pRadius = parseFloat(psWaveItem.pRadius) || 0;
  const sRadius = parseFloat(psWaveItem.sRadius) || 0;

  /**
   * This function updates the epicenter location on the map once.
   *
   * Will be called when the P and S wave is visible on the map, which is only once and then the
   * camera will never update again until the P and S wave isnt there, which the varaible will change
   * about the EEW, and the auto camera adjustment will rebound the camera into the epicenter location and the intensity points.
   *
   */
  function updateEpicenterLocationOnce() {
    document.getElementById("intensity").textContent = expInt;
  }

  // create a layer group for P wave, S wave, and epicenter
  mapInstance.psSGroup = leaflet.layerGroup().addTo(mapInstance);

  // P wave circle (blue)
  const pCircle = leaflet
    .circle([latitude, longitude], {
      weight: 2,
      color: "#35b4fb",
      fillColor: "blue",
      fillOpacity: 0.0,
      radius: pRadius * 1000, // convert to meters if the radius is in kilometers
    })
    .addTo(mapInstance.psSGroup);

  // S wave circle (red)
  const sCircle = leaflet
    .circle([latitude, longitude], {
      weight: 2,
      color: "#f6521f",
      fillColor: "#f97316",
      fillOpacity: 0.1,
      radius: sRadius * 1000, // convert to meters if the radius is in kilometers
    })
    .addTo(mapInstance.psSGroup);

  const epicenterIcon = leaflet.icon({
    iconUrl: "https://pickingname.github.io/basemap/icons/epicenter.png",
    iconSize: [30, 30],
  });

  // skipcq: JS-0128 | gonna ignore this because i am afraid that removing this unused variable will break the code
  const epicenterMarker = leaflet
    .marker([latitude, longitude], {
      icon: epicenterIcon,
    })
    .addTo(mapInstance.psSGroup);

  const bounds = leaflet.latLngBounds([latitude, longitude]);
  if (isThisTheFirstTime === false) {
    EEW.play();
    updateEpicenterLocationOnce();
    fitCircleBounds();
  }

  isThisTheFirstTime = true;
};

/**
 * This updates the map itself with the P and S wave circles and the epicenter location.
 *
 * @param {Object} mapInstance - The Leaflet map instance to render the circles on.
 */
const updateMapWithCircleData = async (mapInstance) => {
  const circleData = await fetchCircleData();
  renderCircles(mapInstance, circleData);
};

/**
 * Export this so that the function will be called on the maphandler.js which will init the circle and repeatly fetches the data and display when needed.
 *
 * @param {Object} mapInstance Map instance to render the circles on.
 */
export const initCircleRendering = (mapInstance) => {
  updateMapWithCircleData(mapInstance);

  setInterval(() => {
    updateMapWithCircleData(mapInstance);
  }, 1000);
};
