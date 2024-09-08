import axios from "axios";
import { isEEW } from "./circleRenderer";

function convertToLocalTime(gmtPlus9TimeString) {
  const [datePart, timePart] = gmtPlus9TimeString.split(' ');
  const [year, month, day] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');

  const gmtPlus9Date = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour) - 9,
    parseInt(minute),
    parseInt(second)
  ));


  const localDate = new Date(gmtPlus9Date.toLocaleString());

  // output formatting
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  return localDate.toLocaleString(undefined, options);
}

function replaceFormat(input) {
  return input.replace(/\+/g, "p").replace(/-/g, "m");
}

function hideInt(which) {
  document.getElementById(which).classList.add("hidden");
}

function showInt(which) {
  document.getElementById(which).classList.remove("hidden");
}

function updateInt(intensityDescription) {
  const levels = ["i1", "i2", "i3", "i4", "i5m", "i5p", "i6m", "i6p", "i7"];
  const maxIndex = levels.indexOf(intensityDescription.toString());

  levels.forEach((level, index) => {
    if (index <= maxIndex) {
      showInt(level);
    } else {
      hideInt(level);
    }
  });
}

function updateScale(intensityDescription) {
  const levels = ["s1", "s2", "s3", "s4", "s5m", "s5p", "s6m", "s6p", "s7"];
  const maxIndex = levels.indexOf(intensityDescription.toString());

  levels.forEach((level, index) => {
    if (index <= maxIndex) {
      showInt(level);
    } else {
      hideInt(level);
    }
  });
}

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
    "Error fetching comparison data, " + error;
    return [];
  }
};

const findEnglishName = (comparisonData, japaneseName) => {
  const match = comparisonData.find((entry) => entry.jp === japaneseName);
  return match ? match.en : japaneseName;
};

const fetchData = async () => {
  let apiType = localStorage.getItem("apiType");
  let apiEndpoint;
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
  responseCache = response;
  const quakeData = response.data;
  const quakeDetails = quakeData[0];

  const magnitude = parseFloat(
    quakeDetails.earthquake.hypocenter.magnitude
  ).toFixed(1);
  const maxScale = quakeDetails.earthquake.maxScale;
  let time = quakeDetails.earthquake.time;
  console.log(time)
  time = convertToLocalTime(time);
  console.log(time + " : converted")
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
        return "--";
    }
  };

  const intensityDescription = getIntensityDescription(maxScale);

  if (intensityDescription === "--") {
    document.getElementById("STA").classList.add("hidden");
    document.getElementById("INT").classList.add("hidden");
  } else if (quakeDetails.issue.type === "ScalePrompt") {
    updateScale("s" + replaceFormat(intensityDescription));
    document.getElementById("STA").classList.add("hidden");
    document.getElementById("INT").classList.remove("hidden");
  } else if (quakeDetails.issue.type === "DetailScale") {
    updateInt("i" + replaceFormat(intensityDescription));
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
    let reportScale = getIntensityDescription(maxScale);
    document.getElementById("intensity").textContent = reportScale;
    document.getElementById("magnitude").textContent = ``;
    document.getElementById("depth").textContent = `Awaiting full report`;
    document.getElementById(
      "where"
    ).textContent = `Earthquake intensity report received`;
    document.getElementById("time").textContent =
      "Time: " + quakeDetails.issue.time;
  } else {
    if (quakeDetails.earthquake.hypocenter.depth === -1) {
      if (quakeDetails.issue.type === "Foreign") {
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
        console.log("invalid data");
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
    // it is now possible to change the text.
  } else if (isEEW === false) {
    fetchData();
  }
}

setTimeout(function () {
  setInterval(shouldIChangeTheFuckingText, 2000);
}, 2000);
