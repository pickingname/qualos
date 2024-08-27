function isFirstRun() {
    const firstRunKey = 'isFirstRun';
    const apiTypeKey = 'apiType';
    const themeSettingKey = 'themeSetting';
    
    // default values
    const defaultSettings = {
        [firstRunKey]: 'false',
        [apiTypeKey]: 'main',
        [themeSettingKey]: 'system'
    };

    try {
        // localStorage feature check
        if (typeof localStorage === 'undefined') {
            console.warning("localStorage is not available in this environment.");
            return false;
        }

        let isAnyKeyMissing = false;

        // check each key and set default if missing
        for (const key in defaultSettings) {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, defaultSettings[key]);
                isAnyKeyMissing = true;
            }
        }

        return isAnyKeyMissing;
    } catch (error) {
        console.error("An error occurred while accessing localStorage:", error);
        return false;
    }
}

// Usage example:
if (isFirstRun()) {
    console.log("Hello! It appears this is your first visit to our website. If you encounter any bugs, please report them on our GitHub repository. You can find the link to the repo at the bottom of the settings page.");
} else {
    console.log("Welcome back.");
}
