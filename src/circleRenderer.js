import axios from "axios";

export var isEEW, isEEWforIndex;
isEEW = false;
isEEWforIndex = false;
let reportNum;
let isThisTheFirstTime = false;

console.info("psWave listener started");

function borderYellow() {
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-neutral-700");
  document
    .getElementById("changeBorderHere")
    .classList.remove("dark:border-neutral-600");
  document.getElementById("changeBorderHere").classList.add("border-amber-400");
}

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

function borderRed() {
  document
    .getElementById("changeBorderHere")
    .classList.remove("border-neutral-700");
  document
    .getElementById("changeBorderHere")
    .classList.remove("dark:border-neutral-600");
  document.getElementById("changeBorderHere").classList.add("border-red-500");
}

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

// Function to fetch circle data from the API
const fetchCircleData = async () => {
  var date = new Date();

  // convert to UTC 0
  date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  // convert to JST
  date = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - 0);
  date.setSeconds(date.getSeconds() - 2); // offset to prevent 404 error
  const NowTime =
    date.getFullYear() +
    "" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "" +
    ("0" + date.getDate()).slice(-2) +
    "" +
    ("0" + date.getHours()).slice(-2) +
    "" +
    ("0" + date.getMinutes()).slice(-2) +
    "" +
    ("0" + date.getSeconds()).slice(-2);
  const NowDay =
    date.getFullYear() +
    "" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "" +
    ("0" + date.getDate()).slice(-2);

  const url =
    "https://weather-kyoshin.east.edge.storage-yahoo.jp/RealTimeData/" +
    NowDay +
    "/" +
    NowTime +
    ".json";

  try {
    const response = await axios.get(url);
    document.getElementById("statusText").textContent = "";
    return response.data;
  } catch (error) {
    console.error("Error fetching circle data:", error);
    document.getElementById("statusText").classList.add("text-red-600");
    document.getElementById("statusText").textContent =
      "Error fetching circle data, " + error;
    return null;
  }
};

// Function to render P wave, S wave circles, and epicenter icon on the map
const renderCircles = (mapInstance, circleData) => {
  function fitCircleBounds() {
    bounds.extend(pCircle.getBounds());
    bounds.extend(sCircle.getBounds());
    mapInstance.fitBounds(bounds.pad(0.002));
  }
  // Remove previous layers if they exist
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

    console.log("CHANGE")
    document.getElementById("EEW").classList.remove("flex");
    document.getElementById("EEW").classList.add("hidden");
    return;
  }

  isEEW = true;
  isEEWforIndex = true;
  const psWaveItem = circleData.psWave.items[0];

  console.log('EEW FLEX')
  document.getElementById("INT").classList.add("hidden");
  document.getElementById("STA").classList.add("hidden");
  document.getElementById("EEW").classList.remove("hidden");
  document.getElementById("EEW").classList.add("flex");

  // EEW data for parsing in the index.html
  let epicenterName = circleData.hypoInfo.items[0].regionName;
  let magnitude = parseFloat(circleData.hypoInfo.items[0].magnitude).toFixed(1);
  reportNum = circleData.hypoInfo.items[0].reportNum;
  let depth = circleData.hypoInfo.items[0].depth;
  let isTraining = circleData.hypoInfo.items[0].isTraining;
  let isFinal = circleData.hypoInfo.items[0].isFinal;
  let calcIntensity = circleData.hypoInfo.items[0].calcintensity;
  console.log(calcIntensity);
  let expInt;
  let reportText;

  // check if the report is a training report or a final report

  // if (isTraining === 'true') {
  //    // TODO: make a bottom status text showing that the EEW is training
  //    document.getElementById("STA").classList.add("text-red-600")
  //    document.getElementById("statusText").textContent = "This EEW is marked as Training";
  //  } else {
  //    document.getElementById("STA").classList.remove("text-red-600")
  //    document.getElementById("statusText").textContent = "Non training"; // clears the status
  //  }

  console.log("isfinal? " + isFinal);
  if (isFinal === "true") {
    reportText = "Final report";
  } else if (isFinal === "false") {
    reportText = "Report #" + reportNum;
  }

  // compare the expected intensity with the calculated intensity
  if (calcIntensity === 0) {
    expInt = "0";
    borderBlue();
  } else if (calcIntensity == "01") {
    expInt = 1;
    borderYellow();
  } else if (calcIntensity == "02") {
    expInt = 2;
    borderYellow();
  } else if (calcIntensity == "03") {
    expInt = 3;
    borderOrange();
  } else if (calcIntensity == "04") {
    expInt = 4;
    borderOrange();
  } else if (calcIntensity == "5-") {
    expInt = "5-";
    borderRed();
  } else if (calcIntensity == "5+") {
    expInt = "5+";
    borderRed();
  } else if (calcIntensity == "6-") {
    expInt = "6-";
    borderPurple();
  } else if (calcIntensity == "6+") {
    expInt = "6+";
    borderPurple();
  } else if (calcIntensity == "07") {
    expInt = 7;
    borderPurple();
  } else {
    expInt = "--";
    borderBlue();
  }

  // update the EEW data in the index.html

  document.getElementById("intensity").textContent = expInt;
  document.getElementById("magnitude").textContent = "Magnitude: " + magnitude;
  document.getElementById("depth").textContent = "Depth: " + depth;
  document.getElementById("time").textContent = reportText;
  document.getElementById("where").textContent = epicenterName;

  const latitude = parseFloat(psWaveItem.latitude.slice(1)); // remove the 'N' and convert to float
  const longitude = parseFloat(psWaveItem.longitude.slice(1)); // remove the 'E' and convert to float
  const pRadius = parseFloat(psWaveItem.pRadius) || 0;
  const sRadius = parseFloat(psWaveItem.sRadius) || 0;

  function updateEpicenterLocationOnce() {
    document.getElementById("intensity").textContent = expInt;
  }

  // Create a layer group for P wave, S wave, and epicenter
  mapInstance.psSGroup = L.layerGroup().addTo(mapInstance);

  // Create and add the P wave circle (blue)
  const pCircle = L.circle([latitude, longitude], {
    weight: 2,
    color: "#35b4fb",
    fillColor: "blue",
    fillOpacity: 0.0,
    radius: pRadius * 1000, // convert to meters if the radius is in kilometers
  }).addTo(mapInstance.psSGroup);

  // Create and add the S wave circle (red)
  const sCircle = L.circle([latitude, longitude], {
    weight: 2,
    color: "#f6521f",
    fillColor: "#f97316",
    fillOpacity: 0.1,
    radius: sRadius * 1000, // convert to meters if the radius is in kilometers
  }).addTo(mapInstance.psSGroup);

  // Add the epicenter icon at the center of the circles
  const epicenterIcon = L.icon({
    iconUrl: "https://pickingname.github.io/basemap/icons/epicenter.png",
    iconSize: [30, 30],
  });

  const epicenterMarker = L.marker([latitude, longitude], {
    icon: epicenterIcon,
  }).addTo(mapInstance.psSGroup);

  // Fit the map to the bounds of the P and S wave circles
  const bounds = L.latLngBounds([latitude, longitude]);
  if (isThisTheFirstTime === false) {
    updateEpicenterLocationOnce();
    fitCircleBounds();
  }

  isThisTheFirstTime = true;
};

// Function to update map with circle data
const updateMapWithCircleData = async (mapInstance) => {
  const circleData = await fetchCircleData();
  renderCircles(mapInstance, circleData);
};

// Initialize circle rendering on the map
export const initCircleRendering = (mapInstance) => {
  updateMapWithCircleData(mapInstance);

  // Update circles every 1 second
  setInterval(() => {
    updateMapWithCircleData(mapInstance);
  }, 1000);
};
