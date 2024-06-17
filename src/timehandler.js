function updateTime() {
  var currentTime = new Date();
  var formattedTime = currentTime.toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  document.getElementById("rightnow").innerText = formattedTime;
}

updateTime();
setInterval(updateTime, 1000);

function updateDate() {
  var currentDate = new Date();
  var day = String(currentDate.getDate()).padStart(2, "0");
  var month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  var year = String(currentDate.getFullYear()).slice(-2); // Extract last two digits of the year

  var formattedDate = `${day}/${month}/${year}`;

  document.getElementById("datenow").innerText = formattedDate + " JST";
}

updateDate();
setInterval(updateDate, 1000);
