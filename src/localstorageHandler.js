function isFirstRun() {
    const firstRunKey = 'isFirstRun';

    // Check if the key exists in localStorage
    if (!localStorage.getItem(firstRunKey)) {
        // If the key does not exist, this is the first run
        localStorage.setItem(firstRunKey, 'false');
        return true;
    }

    // If the key exists, this is not the first run
    return false;
}

// Usage
if (isFirstRun()) {
    console.log("This is the first time the script is being run.");
} else {
    console.log("This script has been run before.");
}