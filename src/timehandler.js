function updateTime() {
    var now = new Date();
    var timeString = now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    document.getElementById("rightnow").innerText = timeString;
}

// Call updateTime initially
updateTime();

// Update time every second
setInterval(updateTime, 1000);

function updateDate() {
    var now = new Date();
    var day = String(now.getDate()).padStart(2, '0');
    var month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    var year = String(now.getFullYear()).slice(-2); // Extract last two digits of the year

    var dateString = day + "/" + month + "/" + year;

    document.getElementById("datenow").innerText = dateString;
}

updateDate();
setInterval(updateDate, 1000);