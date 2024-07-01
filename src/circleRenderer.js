import axios from "axios";
import { hideMapHandlerIcons, showMapHandlerIcons } from './maphandler';

export let isEEW, isEEWforIndex;
isEEW = false;
isEEWforIndex = false;
let reportNum;
let isThisTheFirstTime = false;

console.info("psWave listener started");

function updateBorder(colorClass) {
  const borderElement = document.getElementById("changeBorderHere");
  borderElement.classList.remove("border-neutral-700", "dark:border-neutral-600", "border-amber-400", "border-orange-400", "border-red-500", "border-purple-500", "border-blue-500");
  borderElement.classList.add(colorClass);
}

function returnBorder() {
  updateBorder("border-neutral-700 dark:border-neutral-600");
}

const fetchCircleData = async () => {
  const date = new Date(Date.now() + 9 * 60 * 60 * 1000);
  date.setSeconds(date.getSeconds() - 2);
  const NowTime = date.toISOString().slice(0, 19).replace(/[-T:]/g, "");
  const NowDay = NowTime.slice(0, 8);

  const url = `https://weather-kyoshin.east.edge.storage-yahoo.jp/RealTimeData/${NowDay}/${NowTime}.json`;

  try {
    const response = await axios.get(url);
    document.getElementById("statusText").textContent = "";
    return response.data;
  } catch (error) {
    console.error("Error fetching circle data:", error);
    const statusText = document.getElementById("statusText");
    statusText.classList.add("text-red-600");
    statusText.textContent = `Error fetching circle data: ${error}`;
    return null;
  }
};

const renderCircles = (mapInstance, circleData) => {
  if (mapInstance.psSGroup) {
    mapInstance.removeLayer(mapInstance.psSGroup);
    returnBorder();
  }
  if (!circleData || !circleData.psWave || !circleData.psWave.items || circleData.psWave.items.length === 0) {
    isThisTheFirstTime = false;
    isEEW = false;
    isEEWforIndex = false;
    showMapHandlerIcons();
    return;
  }

  isEEW = true;
  isEEWforIndex = true;
  hideMapHandlerIcons();

  const psWaveItem = circleData.psWave.items[0];
  const hypoItem = circleData.hypoInfo.items[0];
  
  // Update DOM elements
  document.getElementById("where").textContent = hypoItem.regionName;
  document.getElementById("magnitude").textContent = `Magnitude: ${hypoItem.magnitude}`;
  document.getElementById("depth").textContent = `Depth: ${hypoItem.depth}`;
  document.getElementById("time").textContent = hypoItem.isFinal ? "Final report" : `Report #${hypoItem.reportNum}`;

  const statusText = document.getElementById("statusText");
  if (hypoItem.isTraining === 'true') {
    statusText.classList.add("text-red-600", "animate-pulse");
    statusText.textContent = "Warning: This EEW is marked as Training";
  } else {
    statusText.classList.remove("text-red-600", "animate-pulse");
    statusText.textContent = "";
  }

  const intensity = document.getElementById("intensity");
  const calcIntensity = hypoItem.calcintensity;
  let expInt = "--";
  let borderColor = "border-blue-500";

  if (calcIntensity === 0) {
    expInt = "0";
  } else if (calcIntensity === "01" || calcIntensity === "02") {
    expInt = calcIntensity.slice(-1);
    borderColor = "border-amber-400";
  } else if (calcIntensity === "03" || calcIntensity === "04") {
    expInt = calcIntensity.slice(-1);
    borderColor = "border-orange-400";
  } else if (calcIntensity === "5-" || calcIntensity === "5+") {
    expInt = calcIntensity;
    borderColor = "border-red-500";
  } else if (calcIntensity === "6-" || calcIntensity === "6+" || calcIntensity === "07") {
    expInt = calcIntensity === "07" ? "7" : calcIntensity;
    borderColor = "border-purple-500";
  }

  intensity.textContent = expInt;
  updateBorder(borderColor);

  const latitude = parseFloat(psWaveItem.latitude.slice(1));
  const longitude = parseFloat(psWaveItem.longitude.slice(1));
  const pRadius = parseFloat(psWaveItem.pRadius);
  const sRadius = parseFloat(psWaveItem.sRadius);

  mapInstance.psSGroup = L.layerGroup().addTo(mapInstance);

  L.circle([latitude, longitude], {
    weight: 2,
    color: "#35b4fb",
    fillColor: "blue",
    fillOpacity: 0.0,
    radius: pRadius * 1000,
  }).addTo(mapInstance.psSGroup);

  L.circle([latitude, longitude], {
    weight: 2,
    color: "#f6521f",
    fillColor: "#f97316",
    fillOpacity: 0.1,
    radius: sRadius * 1000,
  }).addTo(mapInstance.psSGroup);

  L.marker([latitude, longitude], {
    icon: L.icon({
      iconUrl: "https://pickingname.github.io/basemap/icons/epicenter.png",
      iconSize: [30, 30],
    }),
  }).addTo(mapInstance.psSGroup);

  if (!isThisTheFirstTime) {
    const bounds = L.latLngBounds([latitude, longitude]).extend([latitude + pRadius, longitude + sRadius]);
    mapInstance.fitBounds(bounds.pad(0.002));
    isThisTheFirstTime = true;
  }
};

const updateMapWithCircleData = async (mapInstance) => {
  const circleData = await fetchCircleData();
  if (circleData) {
    renderCircles(mapInstance, circleData);
  } else {
    showMapHandlerIcons();
  }
};

export const initCircleRendering = (mapInstance) => {
  updateMapWithCircleData(mapInstance);

  setInterval(() => {
    updateMapWithCircleData(mapInstance);
  }, 1000);
};