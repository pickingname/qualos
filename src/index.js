import axios from "axios";
import { isEEW } from "./circleRenderer";

/**
 * formats the date so that the function below can convert the date to the user's browser time
 *
 * @param {String} dateString the date string to format
 * @returns formatted date string, the time is still the same, this is just to format the date to the correct format
 */
function formatDate(dateString) {
  const [datePart, timePart] = dateString.split(" ");

  const [year, month, day] = datePart.split("/");

  return `${day}/${month}/${year}, ${timePart}`;
}

/**
 * converts the p2pquake reported time into the user's browser time
 *
 * @param {String} unformattedString the unformatted date string (gmt+9)
 * @returns the formatted date string in the user's browser time
 */
function convertToLocalTime(unformattedString) {
  const [datePart, timePart] = unformattedString.split(" ");
  const [year, month, day] = datePart.split("/");
  const [hour, minute, second] = timePart.split(":");

  const unformattedDate = new Date(
    Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour) - 9,
      parseInt(minute),
      parseInt(second)
    )
  );

  const localDate = new Date(unformattedDate.toLocaleString());

  // output formatting
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  return localDate.toLocaleString(undefined, options);
}

/**
 * Replaces the + and - with p and m for the intensity description
 * 
 * @param {String} input String to replace the + and - with p and m
 * @returns 
 */
function replaceFormat(input) {
  return input.replace(/\+/g, "p").replace(/-/g, "m");
}

/**
 * Hides the intensity icon for better visibility
 * 
 * @param {String} which Which intensity to hide, lower thna {which} will be hidden
 */
function hideInt(which) {
  document.getElementById(which).classList.add("hidden");
}

/**
 * Show intensity back after being hidden
 * 
 * @param {String} which Which intensity to show
 */
function showInt(which) {
  document.getElementById(which).classList.remove("hidden");
}

/**
 * Updates the intensity icon for Detailscale reports
 * 
 * @param {String} intensityDescription 
 */
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

/**
 * Updates the scale icon for scalePrompt reports
 * 
 * @param {String} intensityDescription 
 */
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

/**
 * This is the function to fetches the comparison data from the github page.
 * The comparision data is for to translate the japanese location names to english.
 *
 * @returns {Promise<Array>} comparisonData as a json
 */
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

/**
 * Finds the English epicenter location name corresponding to a given Japanese name from the comparison data.
 * And translates the Japanese epicenter name to English.
 *
 * @function findEnglishName
 * @param {Object[]} comparisonData - An array of objects containing Japanese and English name pairs. which is fetched by the fetchComparisonData function.
 * @param {string} japaneseName - The Japanese name of the epicenter
 * @returns {string} The English name if a match is found, otherwise returns the original Japanese name.
 */
const findEnglishName = (comparisonData, japaneseName) => {
  const match = comparisonData.find((entry) => entry.jp === japaneseName);
  return match ? match.en : japaneseName;
};

/**
 * Fetches the actual p2pquake data to displays on the card, not the map.
 *
 */
const fetchData = async () => {
  const apiType = localStorage.getItem("apiType");
  let apiEndpoint =
    "https://api.p2pquake.net/v2/history?codes=551&limit=1&offset=0"; //
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
  const quakeData = response.data;
  const quakeDetails = quakeData[0];

  const magnitude = parseFloat(
    quakeDetails.earthquake.hypocenter.magnitude
  ).toFixed(1);
  const maxScale = quakeDetails.earthquake.maxScale;
  let time = quakeDetails.earthquake.time;

  if (localStorage.getItem("timeConversion") === "true") {
    time = convertToLocalTime(time);
  } else if (localStorage.getItem("timeConversion") === "false") {
    time = formatDate(time);
  } else {
    // will displays this when the user resets the settings
    console.log("time conversion setting is invalid, defaulting to true");
    localStorage.setItem("timeConversion", true);
  }

  const depth =
    quakeDetails.earthquake.hypocenter.depth === -1
      ? "unknown"
      : quakeDetails.earthquake.hypocenter.depth === 0
      ? "Very shallow"
      : `${quakeDetails.earthquake.hypocenter.depth}km`;
  const locationName = quakeDetails.earthquake.hypocenter.name;

  /**
   * Translates the original intensity scale to a more human readable format.
   *
   * @param {String} maxScale
   * @returns {String} The translated intensity description for human eyes
   */
  // skipcq: JS-0123
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
    updateScale(`s${replaceFormat(intensityDescription)}`); // uses the text "s" to tell the upper function that this is a scalePrompt and to uses the scale icon
    document.getElementById("STA").classList.add("hidden");
    document.getElementById("INT").classList.remove("hidden");
  } else if (quakeDetails.issue.type === "DetailScale") {
    updateInt(`i${replaceFormat(intensityDescription)}`); // uses the text "i" to tell the upper function that this is a detailScale and to uses the rounded intensity icon
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
    const reportScale = getIntensityDescription(maxScale);
    document.getElementById("intensity").textContent = reportScale;
    document.getElementById("magnitude").textContent = "";
    document.getElementById("depth").textContent = "Awaiting full report";
    document.getElementById("where").textContent =
      "Earthquake intensity report received";
    document.getElementById(
      "time"
    ).textContent = `Time: ${quakeDetails.issue.time}`;
  } else {
    if (quakeDetails.earthquake.hypocenter.depth === -1) {
      if (quakeDetails.issue.type === "Foreign") {
        document.getElementById("where").textContent =
          "Foreign earthquake information";
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
        document.getElementById("magnitude").textContent =
          "Foreign, No mag. data";
        document.getElementById("time").textContent = `Time: ${time}`;

        document.getElementById("where").textContent = `${englishName}`;
      } else {
        console.log("invalid data");
        document.getElementById("where").textContent = "Invalid data received";
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

/**
 * This is for the EEW so that they can change the text or not, not having this will make the EEW text change flashes because both EEW report and the regular Intensity report text
 * are overriding the same card
 */
function shouldIChangeTheFuckingText() {
  if (isEEW === true) {
    // it is now possible to change the text.
  } else if (isEEW === false) {
    fetchData();
  }
}

setTimeout(() => {
  setInterval(shouldIChangeTheFuckingText, 2000);
}, 2000);
