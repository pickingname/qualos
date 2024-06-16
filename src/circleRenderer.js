import axios from "axios";

console.info("psWave listener started");

// Function to fetch circle data from the API
const fetchCircleData = async () => {
  const date = new Date();
  date.setSeconds(date.getSeconds() - 3); // offset to prevent 404 error
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

    const getUrl = url //"https://weather-kyoshin.east.edge.storage-yahoo.jp/RealTimeData/20240507/20240507162525.json"
    
    // replace with const: url for real data, this is for testing

  try {
    const response = await axios.get(getUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching circle data:", error);
    return null;
  }
};

// Function to render P wave, S wave circles, and epicenter icon on the map
const renderCircles = (mapInstance, circleData) => {
  if (!circleData || !circleData.psWave || !circleData.psWave.items || circleData.psWave.items.length === 0) {
    return;
  }

  const psWaveItem = circleData.psWave.items[0];

  const latitude = parseFloat(psWaveItem.latitude.slice(1)); // remove the 'N' and convert to float
  const longitude = parseFloat(psWaveItem.longitude.slice(1)); // remove the 'E' and convert to float
  const pRadius = parseFloat(psWaveItem.pRadius);
  const sRadius = parseFloat(psWaveItem.sRadius);

  // Remove previous layers if they exist
  if (mapInstance.psSGroup) {
    mapInstance.removeLayer(mapInstance.psSGroup);
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

  const epicenterMarker = L.marker([latitude, longitude], { icon: epicenterIcon }).addTo(mapInstance.psSGroup);

  // Fit the map to the bounds of the P and S wave circles
  const bounds = L.latLngBounds([latitude, longitude]);
  bounds.extend(pCircle.getBounds());
  bounds.extend(sCircle.getBounds());
  mapInstance.fitBounds(bounds.pad(0.2));
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
