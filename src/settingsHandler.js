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

    // modal text creation, 
    // unused but, use "border border-neutral-700 dark:border-neutral-600 rounded-md p-2" for the border
    modalContent.innerHTML = `
<div class="inline-flex items-center space-x-2">
  <img src="https://pickingname.github.io/basemap/icons/epicenter.png" alt="Icon" class="h-7 w-7 mt-[4px] rounded-md" />
  <div class="font-outfit">
    <div class="text-black dark:text-white">qualos.info</div>
    <div class="text-sm text-neutral-500">application settings</div>
  </div>
</div>
<p class="font-outfit animate-pulse text-orange-500">You are on the beta version</p>
<p class="font-outfit mb-4 text-neutral-600 dark:text-neutral-300">this feature is still being actively worked on, please check back soon.</p>
<button id="closeSettings" class="font-outfit focus:shadow-outline rounded bg-blue-500 px-4 py-2 text-white transition duration-300 ease-in-out hover:bg-blue-600 focus:outline-none">ok</button>
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
