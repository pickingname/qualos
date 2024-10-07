/**
 * Function to dim the screen and reload the page
 * Creates a better 'app-like' experience for the user
 * And also tells the user that the leaflet map might stuck at like zoom level 0 when reloaded using location.reload();
 *
 * @param {String} reason Reason for the reload, will be displayed on the screen also
 */
export function dimScreenAndReload() {
  setTimeout(() => {
    const overlay = document.createElement("div");
    overlay.classList.add("dim-overlay");
    document.body.appendChild(overlay);

    const contentWrapper = document.createElement("div");
    contentWrapper.classList.add("content-wrapper");

    const reloadingText = document.createElement("p");
    reloadingText.classList.add(
      "font-outfit",
      "text-white",
      "text-4xl",
      "mb-4",
      "reloadingText",
    );
    reloadingText.textContent = "Reloading this application";
    contentWrapper.appendChild(reloadingText);

    const spinner = document.createElement("div");
    spinner.classList.add("mx-auto");
    spinner.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stroke-white animate-spin loadingSpinner"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
    contentWrapper.appendChild(spinner);

    const bottomText = document.createElement("p");
    bottomText.classList.add(
      "font-outfit",
      "text-white",
      "text-lg",
      "mt-4",
      "px-2",
      "bottomText",
    );
    bottomText.textContent =
      "This might cause map rendering issues. For a better way, reload the website manually.";
    contentWrapper.appendChild(bottomText);

    document.body.appendChild(contentWrapper);

    setTimeout(() => {
      document.querySelector(".reloadingText").classList.add("show");
      document.querySelector(".bottomText").classList.add("show");
      document.querySelector(".loadingSpinner").classList.add("show");
      document.querySelector(".reasonText").classList.add("show");
    }, 50);

    setTimeout(() => {
      overlay.classList.add("dimmed");
    }, 0);

    setTimeout(() => {
      location.reload();
    }, 2500); // used to be 3000, this is just to tell user to reload manually when map rendering issues occur
  }, 100); // yea really needed the delay for css to be applied correctly
}
