# qualos

[unused logo]: <> (<img align="right" width="285" height="71" src="https://github.com/user-attachments/assets/85827092-099e-405d-8f99-f10ff1c85e37">)

A website that shows the most recent earthquake in a map using p2pquake API.

[![CodeFactor](https://www.codefactor.io/repository/github/pickingname/qualos/badge)](https://www.codefactor.io/repository/github/pickingname/qualos)
[![DeepSource](https://app.deepsource.com/gh/pickingname/qualos.svg/?label=active+issues&show_trend=true&token=4jDokZxN0UkI37cOA17xRYS1)](https://app.deepsource.com/gh/pickingname/qualos/)
[![DeepSource](https://app.deepsource.com/gh/pickingname/qualos.svg/?label=resolved+issues&show_trend=true&token=4jDokZxN0UkI37cOA17xRYS1)](https://app.deepsource.com/gh/pickingname/qualos/)

##### [https://qualos.info](https://qualos.info)

![banner](https://github.com/user-attachments/assets/a5c70cf9-7c08-44a3-8837-3f542c705c40)

---

### Inspiration

This app was developed as an alternative to [quarog](https://fuku1213.github.io/quarog-site/), serving as a web-based remake of the original. We extend our gratitude to the original creator for the app's concept. Please note that this app is not affiliated with the original app's creator.

---

### Features

- Displays real-time earthquake information sourced from the [p2pquake API](https://www.p2pquake.net/develop/json_api_v2/).
- Renders a banner showing details such as epicenter location, maximum intensity, depth, time, and magnitude.
- Shows intensity measured from stations on a map as a circle icon.
- Displays intensity reports; if intensity exceeds 3, it highlights prefectures with intensity levels using a square icon instead of a circle.
- Shows P and S wave information during an active earthquake using the Yahoo API.
- Light / Dark theme support. (Applied automatically based on the system's theme)
- Now displays tsunami warning (line + text)

---

### Limitations

Please note that this might be changed

- Cannot display the live data from the stations
- Cannot display the english name when the EEW is issued
- Camera movement is not good enough

---

### Development

To get started with development:

1. Clone this repository.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Open [localhost:5173](http://localhost:5173) (or the address shown by Vite in the terminal) in your browser.
