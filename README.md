# qualos
<img align="right" width="285" height="71" src="https://pickingname.github.io/icons/qualos/qualos_logo.png">

Website that shows the most recent earthquake in a map using p2pquake API.

[![CodeFactor](https://www.codefactor.io/repository/github/pickingname/qualos/badge)](https://www.codefactor.io/repository/github/pickingname/qualos)
##### [https://qualos.info](https://qualos.info)

![appPreview](https://github.com/pickingname/qualos/assets/115550149/a9fa2290-3929-4f80-9101-44adfa0b41c1)

---
### About the Credits

At the bottom left corner of the screen, you'll notice credits displayed. You have permission to remove these credits using the browser's developer tools (F12). However, please note that the credits are essential to acknowledge and verify the work done. Thank you for understanding.

---

### Features

- Displays real-time earthquake information sourced from the [p2pquake API](https://www.p2pquake.net/develop/json_api_v2/).
- Renders a banner showing details such as epicenter location, maximum intensity, depth, time, and magnitude.
- Shows intensity measured from stations on a map as a circle icon.
- Displays intensity reports; if intensity exceeds 3, it highlights prefectures with intensity levels using a square icon instead of a circle.
- Shows P and S wave information during an active earthquake using the Yahoo API.
- Light / Dark theme support. (Applied automatically based on the system's theme)

---

### Development

To get started with development:

1. Clone this repository.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Open [localhost:5173](http://localhost:5173) (or the address shown by Vite in the terminal) in your browser.
