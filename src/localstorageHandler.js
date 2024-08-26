function isFirstRun() {
    const firstRunKey = 'isFirstRun';
    const apiType = 'main';

    try {
        // localstorage feature check
        if (typeof localStorage === 'undefined') {
            console.warning("localStorage is not available in this environment.");
            return false;
        }

        // key check
        if (!localStorage.getItem(firstRunKey)) {
            localStorage.setItem(firstRunKey, 'false');
            localStorage.setItem(apiType, 'main'); // can be "main" or "sandbox", use "main" for the default endpoint, let the user change it to "sandbox" if they want
            return true;
        }

        return false;
    } catch (error) {
        console.error("An error occurred while accessing localStorage:", error);
        return false;
    }
}

// if (isFirstRun()) {
//     console.log("Hello! It appears this is your first visit to our website. If you encounter any bugs, please report them on our GitHub repository. You can find the link to the repo at the bottom of the settings page.");
// } else {
//     console.log("Welcome back.");
// }
