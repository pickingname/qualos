function isFirstRun() {
  const firstRunKey = "isFirstRun";
  const apiTypeKey = "apiType";
  const themeSettingKey = "themeSetting";
  const hideLegendKey = "hideLegend";
  const canMapBeMovedKey = "canMapBeMoved";
  const geoJsonMapKey = "geoJsonMap";

  // Default values
  const defaultSettings = {
    [firstRunKey]: "false",
    [apiTypeKey]: "main",
    [themeSettingKey]: "system",
    [hideLegendKey]: "false",
    [canMapBeMovedKey]: "false",
    [geoJsonMapKey]: "false",
  };

  try {
    // localStorage feature check
    if (typeof localStorage === "undefined") {
      console.warning("localStorage is not available in this environment.");
      return false;
    }

    let isAnyKeyMissing = false;

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
