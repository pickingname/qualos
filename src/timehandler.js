function updateTime() {
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    var milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    if (milliseconds == 100) {
        now.setSeconds(now.getSeconds() + 1);
        milliseconds = '000';
    }

    var timeString = hours + ":" + minutes + ":" + seconds; // + ":" + milliseconds.substring(0, 2);

    document.getElementById("rightnow").innerText = timeString;
}

// Call updateTime initially
updateTime();

// Update time every millisecond
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