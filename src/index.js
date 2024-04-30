import axios from "axios";

const response = await axios.get(
  "https://pickingname.github.io/testjson/p2pquake_v2_jma_scaleanddestination.json"
); // ORIGINAL https://api.p2pquake.net/v2/jma/quake?limit=1&order=-1&quake_type=ScaleAndDestination

console.log(response.data);

const data = response.data;

const _a = data[0];

const latitude = _a.earthquake.hypocenter.latitude;
const longitude = _a.earthquake.hypocenter.longitude;
const mag = _a.earthquake.hypocenter.magnitude;
const maxScale = _a.earthquake.maxScale;
const time = _a.earthquake.time;
const depth = _a && _a.earthquake.hypocenter.depth === -1 ? 'unknown' : (_a.earthquake.hypocenter.depth === 0 ? 'Very shallow' : `${_a.earthquake.hypocenter.depth}km`);
const where = _a.earthquake.hypocenter.name;

const _intensity = (maxScale) => {
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
      return "?";
  }
};

const intensity = _intensity(maxScale);


document.getElementById('intensity').textContent = intensity;
document.getElementById('magnitude').textContent = `Magnitude: ${mag}`;
document.getElementById('time').textContent = `Time: ${time}`;
document.getElementById('depth').textContent = `Depth: ${depth}`;
document.getElementById('where').textContent = `${where}`;

var epicenter = L.icon({
  iconUrl: "/src/icons/epicenter.png",

  iconSize: [30, 30],
});


var map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
}).setView([latitude, longitude], 8); // ウラジミール自身は削除しても問題ないと言っている。https://groups.google.com/d/msg/leaflet-js/fA6M7fbchOs/JTNVhqdc7JcJ、しかし、残すか、何らかの形でリーフレットを認めるべきだと思われる。

L.marker([latitude, longitude], { icon: epicenter }).addTo(map);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'",
  {
    maxZoom: 19,
  }
).addTo(map);
