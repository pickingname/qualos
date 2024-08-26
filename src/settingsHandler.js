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
      "bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-xl transform scale-95 transition-transform duration-300 max-w-md w-full";

    // modal text creation
    modalContent.innerHTML = `
            <h2 class="text-xl font-outfit mb-4 text-neutral-800 dark:text-white">application config</h2>
            <p class="font-outfit text-orange-500 animate-pulse">You are on the beta version</p>
            <p class="font-outfit text-neutral-600 dark:text-neutral-300 mb-4">this feature is still being actively worked on, please check back soon.</p>
            <button id="closeSettings" class="bg-blue-500 hover:bg-blue-600 text-white font-outfit py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out">
              ok
            </button>
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
