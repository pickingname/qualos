import axios from "axios";

const response = await axios.get(
  "https://pickingname.github.io/testjson/p2pquake_v2_jma_scaleanddestination.json"
); // ORIGINAL https://api.p2pquake.net/v2/jma/quake?limit=1&order=-1&quake_type=ScaleAndDestination

console.log(response.data);

const data = response.data;

const _a = data[0];

const latitude = _a.earthquake.hypocenter.latitude;
const longitude = _a.earthquake.hypocenter.longitude;

var epicenter = L.icon({
  iconUrl: "/src/icons/epicenter.png",

  iconSize: [30, 30], // size of the icon
});

console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

var map = L.map("map", { zoomControl: false }).setView(
  [latitude, longitude], 8
);

L.marker([latitude, longitude], { icon: epicenter }).addTo(map);

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'", {
  maxZoom: 19,
}).addTo(map);
