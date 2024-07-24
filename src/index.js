import axios from "axios";
import { isEEW } from "./circleRenderer";

let apiEndpoint = "http://localhost:5500/tsunami.json";

let comparisonDataCache = null;
export let responseCache;

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
    document.getElementById("statusText").classList.add("text-red-600");
    document.getElementById("statusText").textContent =
      "Error fetching comparison data, " + error;
    return [];
  }
};

const findEnglishName = (comparisonData, japaneseName) => {
  const match = comparisonData.find((entry) => entry.jp === japaneseName);
  return match ? match.en : japaneseName;
};

const fetchData = async () => {
  const response = await axios.get(apiEndpoint);
  responseCache = response;
  const quakeData = response.data;
  const quakeDetails = quakeData[0];

  const magnitude = parseFloat(
    quakeDetails.earthquake.hypocenter.magnitude
  ).toFixed(1);
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
        console.log("default intensity recieved");
        return "--";
    }
  };

  const intensityDescription = getIntensityDescription(maxScale);

  if (intensityDescription === "--") {
    document.getElementById("STA").classList.add("hidden");
    document.getElementById("INT").classList.add("hidden");
  } else if (quakeDetails.issue.type === "ScalePrompt") {
    document.getElementById("STA").classList.add("hidden");
    document.getElementById("INT").classList.remove("hidden");
  } else if (quakeDetails.issue.type === "DetailScale") {
    document.getElementById("STA").classList.remove("hidden");
    document.getElementById("INT").classList.add("hidden");
  } else if (quakeDetails.issue.type === "Foreign") {
    document.getElementById("STA").classList.add("hidden");
    document.getElementById("INT").classList.add("hidden");
  }

  const comparisonData = await fetchComparisonData();
  const englishName = findEnglishName(comparisonData, locationName);

  if (
    quakeDetails.earthquake.hypocenter.depth === -1 &&
    quakeDetails.issue.type === "ScalePrompt"
  ) {
    console.info("Earthquake intensity report received");
    let reportScale = getIntensityDescription(maxScale);
    document.getElementById("intensity").textContent = reportScale;
    document.getElementById(
      "magnitude"
    ).textContent = `Magnitude: ${magnitude}`;
    document.getElementById("depth").textContent = `Awaiting full report`;
    document.getElementById(
      "where"
    ).textContent = `Earthquake intensity report received`;
    document.getElementById("time").textContent =
      "Time: " + quakeDetails.issue.time;
  } else {
    if (quakeDetails.earthquake.hypocenter.depth === -1) {
      if (
        quakeDetails.issue.type === "Foreign"
      ) {
        console.log('what the fuck ')
        document.getElementById(
          "where"
        ).textContent = `Foreign earthquake information`;
        if (intensityDescription === "--") {
          document.getElementById("intensity").textContent = "";
        } else {
          document.getElementById("intensity").textContent =
            intensityDescription;
        }
        if (depth === "unknown") {
          document.getElementById("depth").textContent = "";
        } else {
          document.getElementById("depth").textContent = `Depth: ${depth}`;
        }
        document.getElementById(
          "magnitude"
        ).textContent = `Foreign, No mag. data`;
        document.getElementById("time").textContent = `Time: ${time}`;

        document.getElementById("where").textContent = `${englishName}`;
      } else {
        console.info("invalid data");
        document.getElementById("where").textContent = `Invalid data received`;
      }
    } else {
      document.getElementById("intensity").textContent = intensityDescription;
      document.getElementById(
        "magnitude"
      ).textContent = `Magnitude: ${magnitude}`;
      document.getElementById("time").textContent = `Time: ${time}`;
      document.getElementById("depth").textContent = `Depth: ${depth}`;
      document.getElementById("where").textContent = `${englishName}`;
    }
  }
};

shouldIChangeTheFuckingText();

function shouldIChangeTheFuckingText() {
  if (isEEW === true) {
    console.log("");
    // it is now possible to change the text.
  } else if (isEEW === false) {
    fetchData();
  }
}

setTimeout(function () {
  setInterval(shouldIChangeTheFuckingText, 2000);
}, 2000);
