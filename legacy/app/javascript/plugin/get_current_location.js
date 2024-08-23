const x = document.getElementById("error");
const longitude = document.getElementById("longitude");
const latitude = document.getElementById("latitude");
const button =  document.getElementById("submit");

button.value = "............."

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
} else {
    x.innerHTML = "Geolocation is not supported by this browser.";
}

function showPosition(position) {
    latitude.value = position.coords.latitude;
    longitude.value = position.coords.longitude;
    button.disabled = false;
    button.value = "Find your way"
}