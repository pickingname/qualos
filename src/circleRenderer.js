import axios from "axios";

console.info("psWave listener started");

const circleApiEndpoint = "https://weather-kyoshin.east.edge.storage-yahoo.jp/RealTimeData/20240507/20240507162525.json"; // replace with const: url for real data, this is for testing

let pCircle = null;
let sCircle = null;
let epicenterMarker = null;

export const fetchCircleData = async () => {
  try {
    const response = await axios.get(circleApiEndpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching circle data:", error);
    return null;
  }
};

export const renderCircles = (mapInstance, circleData) => {
  if (
    !circleData ||
    !circleData.psWave ||
    !circleData.psWave.items ||
    circleData.psWave.items.length === 0
  ) {
    // Remove existing circles and marker if they exist
    if (pCircle) {
      mapInstance.removeLayer(pCircle);
      pCircle = null;
    }
    if (sCircle) {
      mapInstance.removeLayer(sCircle);
      sCircle = null;
    }
    if (epicenterMarker) {
      mapInstance.removeLayer(epicenterMarker);
      epicenterMarker = null;
    }
    return;
  }

  const psWaveItem = circleData.psWave.items[0];

  const latitude = parseFloat(psWaveItem.latitude.slice(1)); // Remove the 'N' and convert to float
  const longitude = parseFloat(psWaveItem.longitude.slice(1)); // Remove the 'E' and convert to float
  const pRadius = parseFloat(psWaveItem.pRadius);
  const sRadius = parseFloat(psWaveItem.sRadius);

  // Remove existing circles and marker if they exist
  if (pCircle) {
    mapInstance.removeLayer(pCircle);
  }
  if (sCircle) {
    mapInstance.removeLayer(sCircle);
  }
  if (epicenterMarker) {
    mapInstance.removeLayer(epicenterMarker);
  }

  // Create and add the P wave circle (blue)
  pCircle = L.circle([latitude, longitude], {
    weight: 2,
    color: "#35b4fb",
    fillColor: "blue",
    fillOpacity: 0.0,
    radius: pRadius * 1000, // Convert to meters if the radius is in kilometers
  }).addTo(mapInstance);

  // Create and add the S wave circle (red)
  sCircle = L.circle([latitude, longitude], {
    weight: 2,
    color: "#f6521f",
    fillColor: "#f97316",
    fillOpacity: 0.1,
    radius: sRadius * 1000, // Convert to meters if the radius is in kilometers
  }).addTo(mapInstance);

  // Add the epicenter icon at the center of the circles
  const epicenterIcon = L.icon({
    iconUrl: "https://pickingname.github.io/basemap/icons/epicenter.png",
    iconSize: [30, 30],
  });

  epicenterMarker = L.marker([latitude, longitude], { icon: epicenterIcon }).addTo(mapInstance);
};

export const updateMapWithCircleData = async (mapInstance) => {
  const circleData = await fetchCircleData();
  renderCircles(mapInstance, circleData);
};

export const initCircleRendering = (mapInstance) => {
  updateMapWithCircleData(mapInstance);

  // Update circles every 2 seconds
  setInterval(() => {
    updateMapWithCircleData(mapInstance);
  }, 2000);
};
