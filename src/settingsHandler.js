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
<div class="inline-flex items-center space-x-2 mb-4">
  <img src="https://pickingname.github.io/basemap/icons/epicenter.png" alt="Icon" class="h-7 w-7 mt-[4px] rounded-md" />
  <div class="font-outfit">
    <div class="text-black dark:text-white">qualos.info</div>
    <div class="text-sm text-neutral-500">application settings</div>
  </div>
</div>

<!-- Dropdown Component -->
<div class="mt-4 text-left">
  <label for="apiEndpoint" class="block text-sm font-medium text-gray-700 dark:text-gray-200">
    Api endpoint
  </label>
  <p class="text-xs text-gray-500 dark:text-gray-400">
    Please do not tinker if you don't know what this is.
  </p>
  <select id="apiEndpoint" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
    <option value="main">main</option>
    <option value="sandbox">sandbox</option>
  </select>
</div>

<button id="closeSettings" class="font-outfit focus:shadow-outline rounded bg-blue-500 px-4 py-2 text-white transition duration-300 ease-in-out hover:bg-blue-600 focus:outline-none mt-4">ok</button>
        `;

    // Append modal content to container
    modalContainer.appendChild(modalContent);

    // Append modal to body
    body.appendChild(modalContainer);

    // Trigger animations
    setTimeout(() => {
      modalContainer.classList.add("opacity-100");
      modalContent.classList.remove("scale-95");
      modalContent.classList.add("scale-100");
    }, 10);

    // Fetch current apiType from localStorage and set it as the selected option
    const apiEndpointDropdown = modalContent.querySelector("#apiEndpoint");
    const currentApiType = localStorage.getItem("apiType") || "main"; // default to "main" if not set
    apiEndpointDropdown.value = currentApiType;

    // Handle dropdown change and update localStorage
    apiEndpointDropdown.addEventListener("change", (e) => {
      const selectedEndpoint = e.target.value;
      localStorage.setItem("apiType", selectedEndpoint);
      console.log(`API endpoint set to: ${selectedEndpoint}`);
    });

    // Close modal function
    const closeModal = () => {
      modalContainer.classList.remove("opacity-100");
      modalContent.classList.remove("scale-100");
      modalContent.classList.add("scale-95");
      setTimeout(() => {
        modalContainer.remove();
      }, 300);
    };

    // Add event listener to close button
    const closeButton = modalContent.querySelector("#closeSettings");
    closeButton.addEventListener("click", closeModal);

    // Close modal when clicking outside
    modalContainer.addEventListener("click", (e) => {
      if (e.target === modalContainer) {
        closeModal();
      }
    });

    // Close modal on Escape key press
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    });
  });
});
