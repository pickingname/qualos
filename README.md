### qualos
[![CodeFactor](https://www.codefactor.io/repository/github/pickingname/qualos/badge)](https://www.codefactor.io/repository/github/pickingname/qualos)
##### [https://qualos.info](https://qualos.info)

![appPreview](https://github.com/pickingname/qualos/assets/115550149/45f3777a-1a59-47ff-917c-5581792fc070)
---
### About the credits at the corner
As you can see, there a credits at the bottom left of the screen. **You have my permission to remove the credits using F12**. I need to put in the credits to prove my work there, Thanks.

---
#### features
- basically shows the most recent earthquake information from [p2pquake api](https://www.p2pquake.net/develop/json_api_v2/)
- renders a banner showing the epicenter location; maximum intensity and other informations such as depth; time and magnitude
- has a map that show the stations points and their readings as a circle with a number thing idk how to explain

---
#### developing
- clone this repo
- make sure you have npm installed
- `npm i`
- `npm dev`
- go to [localhost:5173](http://localhost:5173) or the address that vite shows you in the terminal

---

#### notes
- this codebase is amazingly horrible
- there will be a unverified commit because i sometimes works on github codespaces and i have no idea how to configure gpg into there
- `maphandler.js` fetch a data from the p2pquake api; renders the map and do the work of converting points and showing the icons
- `index.js` fetch a data from p2pquake api; then puts the data into the banner
- the assets are stored in another website; since vite doesnt seems to work with the `src/` directory
