import { dimScreenAndReload } from "./reloadHandler";

if (localStorage.getItem("apiType") === "sandbox") {
  document.getElementById("isUsingSandboxAPI").textContent =
    "Using Sandbox API";
} else {
  document.getElementById("isUsingSandboxAPI").textContent = "";
}

if (localStorage.getItem("hideLegend") === "hide") {
  document.getElementById("hideTheIntensityLegendHere").classList.add("hidden");
} else if (localStorage.getItem("hideLegend") === "show") {
  document
    .getElementById("hideTheIntensityLegendHere")
    .classList.remove("hidden");
} else {
  console.log(
    `intensityHide value is ${localStorage.getItem(
      "hideLegend",
    )}, defaulting to show.`,
  );
  localStorage.setItem("hideLegend", "show");
}

/**
 * Fetches the latest release from a GitHub repository.
 *
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The name of the repository.
 * @returns {Promise<Object>} - A promise that resolves to the latest release data.
 */
async function setCurrentVersionToLocalstorage() {
  const url = "https://api.github.com/repos/pickingname/qualos/releases/latest";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Error fetching the latest release: ${response.statusText}`,
      );
    }
    const data = await response.json();

    const sanitizedTagName = data.tag_name.replace(/[<>]/g, "");
    console.log(`running on version: ${sanitizedTagName}`);
    localStorage.setItem("appVersion", sanitizedTagName);

    return data;
  } catch (error) {
    console.error("Error fetching the latest release:", error);
    throw error;
  }
}

setCurrentVersionToLocalstorage();

document.addEventListener("DOMContentLoaded", () => {
  const settingsButton = document.getElementById("settings");
  const body = document.body;

  settingsButton.addEventListener("click", () => {
    // modal creation
    const modalContainer = document.createElement("div");
    modalContainer.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 transition-opacity duration-300";
    modalContainer.id = "settingsModal";
    modalContainer.style.zIndex = "6969";

    // modal content creation
    const modalContent = document.createElement("div");
    modalContent.className =
      "bg-white dark:bg-neutral-800 backdrop-blur-sm py-6 rounded-lg transform scale-95 transition-transform duration-300 mx-20 max-w-2xl w-full";

    // modal text and dropdown creation
    modalContent.innerHTML = /*html*/ `
    <div class="overflow-hidden max-h-[80vh]">
      <div class="overflow-auto max-h-[calc(80vh-2rem)] px-3 mx-3">
        <div class="flex items-center justify-between mb-4">
          <div class="inline-flex items-center space-x-2">
            <img src="https://pickingname.github.io/basemap/icons/epicenter.png" alt="Icon"
              class="h-7 w-7 mt-[4px] rounded-md" />
            <div class="font-outfit">
              <div class="text-black dark:text-white">qualos.info</div>
              <p id="appVersionText" class="text-sm text-neutral-500">application settings</p>
            </div>
          </div>
          <a href="https://github.com/pickingname/qualos" target="_blank"
            class="dark:bg-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-colors duration-150 ease-in-out dark:hover:bg-neutral-600 dark:text-white font-bold p-2 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="">
              <path
                d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </div>

        <div
          class="hidden mt-4 font-outfit items-center p-2 mb-4 text-sm text-blue-800 border border-blue-300 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800"
          role="alert">
          <svg class="ml-2 flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
            fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <span class="sr-only">Info</span>
          <div>
            <span class="">Alert</span> <br />
            <p>Information</p>
          </div>
        </div>

        <div class="mt-2 text-left font-outfit">
          <label for="themeSetting" class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Theme
          </label>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            Changing this will refresh the page
          </p>
          <select id="themeSetting"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white font-outfit focus:outline-none sm:text-sm rounded-md">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div class="mt-4 text-left font-outfit">
          <label for="hideLegendSetting" class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Hide Intensity Legend
          </label>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            Hides the bottom right legend
          </p>
          <select id="hideLegendSetting"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white font-outfit focus:outline-none sm:text-sm rounded-md">
            <option value="show">Show</option>
            <option value="hide">Hide</option>
          </select>
        </div>

        <div class="mt-4 text-left font-outfit">
          <label for="convertTimeSetting" class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Convert Time
          </label>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            This converts the reported time [GMT+9] to your browser time through <code class="pl-0.5"><span
                class="dark:text-purple-400 text-purple-500">var</span> Date: <span
                class="dark:text-purple-300 text-purple-700">DateConstructor</span></code>. We do not use your IP
            address
            to determine your location.
          </p>
          <select id="convertTimeSetting"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white font-outfit focus:outline-none sm:text-sm rounded-md">
            <option value="false">Disable</option>
            <option value="true">Enable</option>
          </select>
        </div>

        <div class="mt-4 text-left font-outfit">
          <label for="movableMapSetting" class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Movable Map
          </label>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            Enable panning and zooming on the map, Changing this will refresh the page
          </p>
          <select id="movableMapSetting"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white font-outfit focus:outline-none sm:text-sm rounded-md">
            <option value="false">Disable</option>
            <option value="true">Enable</option>
          </select>
        </div>

        <div class="mt-4 text-left font-outfit">
          <label for="geoJsonDropdown" class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Use GeoJSON map
          </label>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            For slower connections, This option uses a simplified JSON map instead of image tiles, which may improve
            loading
            times but offers less detail
          </p>
          <select id="geoJsonDropdown"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white font-outfit focus:outline-none sm:text-sm rounded-md">
            <option value="false">Disable</option>
            <option value="true">Enable</option>
          </select>
        </div>

        <div class="mt-4 text-left font-outfit">
          <label for="apiEndpoint" class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            P2PQuake API endpoint
          </label>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            Selecting "main" will shows the latest data. Selecting "sandbox" shows historical data with the 30 seconds
            update
            interval
          </p>
          <select id="apiEndpoint"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white font-outfit focus:outline-none sm:text-sm rounded-md">
            <option value="main">main</option>
            <option value="sandbox">sandbox</option>
          </select>
        </div>

        <div class="mt-4 text-left font-outfit">
          <label for="apiEndpoint" class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Reset all settings
          </label>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            Returns all settings value to default. This action is irreversible!
          </p>
          <div class="pt-1 pb-3 font-outfit">
            <button id="logButton" class="text-left text-sm py-1 w-full bg-red-500/40 border border-red-500 text-black dark:text-white rounded-md transition-colors ease-out duration-300 hover:bg-red-500/80">
              <p class="pl-2">Reset everything</p>
            </button>
          </div>
        </div>
      </div>
      `;

    // append content
    modalContainer.appendChild(modalContent);

    // append modal
    body.appendChild(modalContainer);

    // open func
    setTimeout(() => {
      modalContainer.classList.add("opacity-100");
      modalContent.classList.remove("scale-95");
      modalContent.classList.add("scale-100");

      if (localStorage.getItem("appVersion")) {
        document.getElementById("appVersionText").textContent =
          `application setting | ${localStorage.getItem("appVersion")}`;
      }
    }, 10);

    // fetch current apiType from localStorage and set it as the selected option
    const apiEndpointDropdown = modalContent.querySelector("#apiEndpoint");
    const currentApiType = localStorage.getItem("apiType") || "main"; // default to "main" if not set
    apiEndpointDropdown.value = currentApiType;

    // dropdown handler and localstorage fetch
    apiEndpointDropdown.addEventListener("change", (e) => {
      const selectedEndpoint = e.target.value;
      localStorage.setItem("apiType", selectedEndpoint);
      console.log(`API endpoint set to: ${selectedEndpoint}`);

      if (selectedEndpoint === "sandbox") {
        document.getElementById("isUsingSandboxAPI").textContent =
          "Using Sandbox API";
      } else {
        document.getElementById("isUsingSandboxAPI").textContent = "";
      }
    });

    // fetch current theme from localStorage and set it as the selected option
    const themeDropdown = modalContent.querySelector("#themeSetting");
    const currentTheme = localStorage.getItem("theme") || "system"; // default to "system" if not set
    themeDropdown.value = currentTheme;

    // dropdown handler for theme
    themeDropdown.addEventListener("change", (e) => {
      const selectedTheme = e.target.value;
      localStorage.setItem("theme", selectedTheme);
      console.log(`Theme set to: ${selectedTheme}`);
      dimScreenAndReload();
    });

    // fetch current hideLegend setting from localStorage and set it as the selected option
    const hideLegendDropdown = modalContent.querySelector("#hideLegendSetting");
    const currentHideLegend = localStorage.getItem("hideLegend") || "show"; // default to "show" if not set
    hideLegendDropdown.value = currentHideLegend;

    // dropdown handler for hide legend
    hideLegendDropdown.addEventListener("change", (e) => {
      const selectedHideLegend = e.target.value;
      localStorage.setItem("hideLegend", selectedHideLegend);
      if (selectedHideLegend === "hide") {
        document
          .getElementById("hideTheIntensityLegendHere")
          .classList.add("hidden");
      } else if (selectedHideLegend === "show") {
        document
          .getElementById("hideTheIntensityLegendHere")
          .classList.remove("hidden");
      }
    });

    // fetch current movableMap setting from localStorage and set it as the selected option
    const movableMapDropdown = modalContent.querySelector("#movableMapSetting");
    const currentMovableMap = localStorage.getItem("movableMap") || "false"; // default to "false" if not set
    movableMapDropdown.value = currentMovableMap;

    // dropdown handler for movable map
    movableMapDropdown.addEventListener("change", (e) => {
      const selectedMovableMap = e.target.value;
      localStorage.setItem("movableMap", selectedMovableMap);
      console.log(`Movable Map set to: ${selectedMovableMap}`);
      dimScreenAndReload();
    });

    // fetch current geojson setting from localStorage and set it as the selected option
    const geojsonMapDropdown = modalContent.querySelector("#geoJsonDropdown");
    const currentGeoJsonMap = localStorage.getItem("geoJsonMap");
    geojsonMapDropdown.value = currentGeoJsonMap || "false"; // defaults to false

    // dropdown handler for geojson map
    geojsonMapDropdown.addEventListener("change", (e) => {
      const selectedGeoJsonMap = e.target.value;
      localStorage.setItem("geoJsonMap", selectedGeoJsonMap);
      console.log(`geoJson style set to: ${selectedGeoJsonMap}`);
      dimScreenAndReload();
    });

    const convertTimeDropdown = modalContent.querySelector(
      "#convertTimeSetting",
    );
    let currentConvertTime = localStorage.getItem("timeConversion");
    if (!currentConvertTime) {
      currentConvertTime = "true";
      localStorage.setItem("timeConversion", "true");
    }
    convertTimeDropdown.value = currentConvertTime;

    convertTimeDropdown.addEventListener("change", (e) => {
      const selectedConvertTime = e.target.value;
      localStorage.setItem("timeConversion", selectedConvertTime);
      console.log(`Convert Time setting set to: ${selectedConvertTime}`);
    });

    // close modal func
    const closeModal = () => {
      modalContainer.classList.remove("opacity-100");
      modalContent.classList.remove("scale-100");
      modalContent.classList.add("scale-95");
      setTimeout(() => {
        modalContainer.remove();
      }, 300);
    };

    // Add event listener to the button
    document.getElementById("logButton").addEventListener("click", () => {
      console.log("resetting everything");
      localStorage.clear();
      dimScreenAndReload();
    });

    // close on clicking outside the modal
    modalContainer.addEventListener("click", (e) => {
      if (e.target === modalContainer) {
        closeModal();
      }
    });

    // close on esc key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    });
  });
});
