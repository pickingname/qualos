import axios from "axios";

let p2pQuakeURL = 'https://api.p2pquake.net/v2/history?codes=551&codes=552&limit=1&offset=0';
let comparisonDataCache = null;

const fetchComparisonData = async () => {
  if (comparisonDataCache) {
    return comparisonDataCache;
  }
  try {
    const response = await axios.get(
      "https://pickingname.github.io/basemap/compare.json"
    );
    comparisonDataCache = response.data;
    return comparisonDataCache;
  } catch (error) {
    console.error("Error fetching comparison data:", error);
    return [];
  }
};

const findEnglishName = (comparisonData, japaneseName) => {
  const match = comparisonData.find((entry) => entry.jp === japaneseName);
  return match ? match.en : japaneseName;
};

const fetchData = async () => {
  const response = await axios.get(p2pQuakeURL);

  const quakeData = response.data;
  const quakeDetails = quakeData[0];

  const magnitude = quakeDetails.earthquake.hypocenter.magnitude;
  const maxScale = quakeDetails.earthquake.maxScale;
  const time = quakeDetails.earthquake.time;
  const depth =
    quakeDetails.earthquake.hypocenter.depth === -1
      ? "unknown"
      : quakeDetails.earthquake.hypocenter.depth === 0
      ? "Very shallow"
      : `${quakeDetails.earthquake.hypocenter.depth}km`;
  const locationName = quakeDetails.earthquake.hypocenter.name;

  const getIntensityDescription = (maxScale) => {
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

  const intensityDescription = getIntensityDescription(maxScale);
  const comparisonData = await fetchComparisonData();
  const englishName = findEnglishName(comparisonData, locationName);

  if (
    quakeDetails.earthquake.hypocenter.depth === -1 &&
    quakeDetails.issue.type === "ScalePrompt"
  ) {
    console.info("Earthquake intensity report received");
    document.getElementById("intensity").textContent = ``;
    document.getElementById("magnitude").textContent = ``;
    document.getElementById("depth").textContent = ``;
    document.getElementById(
      "where"
    ).textContent = `Earthquake intensity report received`;
    document.getElementById("time").textContent =
      "Time: " + quakeDetails.issue.time;
  } else {
    if (quakeDetails.earthquake.hypocenter.depth === -1) {
      if (
        quakeDetails.earthquake.hypocenter.depth === -1 &&
        quakeDetails.issue.type === "Foreign"
      ) {
        document.getElementById(
          "where"
        ).textContent = `Foregin earthquake information`;
        if (intensityDescription === "?"){
            document.getElementById("intensity").textContent = "";
        } else {
            document.getElementById("intensity").textContent = intensityDescription;
        }
        if (depth === "unknown") {
            document.getElementById("depth").textContent = "";
        } else {
            document.getElementById("depth").textContent = `Depth: ${depth}`;
        }
        document.getElementById("magnitude").textContent = `Foreign, No mag. data`;
        document.getElementById("time").textContent = `Time: ${time}`;

        
        document.getElementById("where").textContent = `${englishName}`;
      } else {
        console.info("invalid data");
        document.getElementById("where").textContent = `Invalid data received`;
      }
    } else {
      document.getElementById("intensity").textContent = intensityDescription;
      document.getElementById("magnitude").textContent = `Magnitude: ${magnitude}`;
      document.getElementById("time").textContent = `Time: ${time}`;
      document.getElementById("depth").textContent = `Depth: ${depth}`;
      document.getElementById("where").textContent = `${englishName}`;
    }
  }
};

fetchData();

setTimeout(function () {
  setInterval(fetchData, 5000);
}, 2000);
