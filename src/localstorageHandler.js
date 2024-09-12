const firstRunKey = "isFirstRun";
const apiTypeKey = "apiType";
const themeSettingKey = "themeSetting";
const hideLegendKey = "hideLegend";
const canMapBeMovedKey = "canMapBeMoved";
const geoJsonMapKey = "geoJsonMap";
const timeConversionKey = "timeConversion";

// default values
const defaultSettings = {
  [firstRunKey]: "false",
  [apiTypeKey]: "main",
  [themeSettingKey]: "system",
  [hideLegendKey]: "false",
  [canMapBeMovedKey]: "false",
  [geoJsonMapKey]: "false",
  [timeConversionKey]: "true",
};

try {
  // localStorage feature check
  if (typeof localStorage === "undefined") {
    console.warning("localStorage is not available in this environment.");
  }

  for (const key in defaultSettings) {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, defaultSettings[key]);
    }
  }
} catch (error) {
  console.error("An error occurred while accessing localStorage:", error);
}
