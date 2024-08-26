// settingsHandler.js

console.log("settingsHandler.js is loaded");

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
      "bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-xl transform scale-95 transition-transform duration-300 mx-20 max-w-2xl w-full"; // Increased max-width to max-w-2xl

    // modal text and dropdown creation
    modalContent.innerHTML = `
<div class="inline-flex items-center space-x-2">
  <img src="https://pickingname.github.io/basemap/icons/epicenter.png" alt="Icon" class="h-7 w-7 mt-[4px] rounded-md" />
  <div class="font-outfit">
    <div class="text-black dark:text-white">qualos.info</div>
    <div class="text-sm text-neutral-500">application settings</div>
  </div>
</div>

<div class="mt-4 text-left font-outfit">
  <label for="apiEndpoint" class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
    P2PQuake API endpoint
  </label>
  <p class="text-xs text-neutral-500 dark:text-neutral-400">
    Selecting "main" will shows the latest data. Selecting sandbox shows historical data with the 30 seconds update interval.
  </p>
  <select id="apiEndpoint" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white font-outfit focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
    <option value="main">main</option>
    <option value="sandbox">sandbox</option>
  </select>
</div>

<div class="flex justify-center mt-4">
    <a href="https://github.com/pickingname/qualos" target="_blank" class="w-full">
        <button class="bg-neutral-300 hover:bg-neutral-200 text-black dark:text-white dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors duration-150 ease-in-out bg-opacity-50 font-outfit py-2 px-4 rounded w-full">
            visit the GitHub repository
        </button>
    </a>
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

    // close button is unused 
    // const closeButton = modalContent.querySelector("#closeSettings");
    // closeButton.addEventListener("click", closeModal);

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
