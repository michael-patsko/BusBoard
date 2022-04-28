import fetch from "node-fetch";
// import prompt from "prompt-sync";
// let stopCode = prompt('Please enter a valid TfL bus stop code: ');
// console.log(stopCode);
let stopCode = "490008660N";
let apiKey = "d32dc34554204e6f875b8c3c3e599f56";
const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${stopCode}/Arrivals${
    typeof apiKey !== 'undefined' ? `?app_key=${apiKey}` : ""
}`);
const arrivals = await response.json();

arrivals.sort((a, b) => a.timeToStation - b.timeToStation);

for (let i = 0; i < arrivals.length; i++) {
    const arrival = arrivals[i];
    let time = 0;
    let units = "";
    if (arrival.timeToStation === 1) {
        time = arrival.timeToStation;
        units = "second";
    } else if (arrival.timeToStation < 60) {
        time = arrival.timeToStation;
        units = "seconds";
    } else if (arrival.timeToStation < 120) {
        time = Math.floor(arrival.timeToStation/60);
        units = "minute";
    } else {
        time = Math.floor(arrival.timeToStation/60);
        units = "minutes";
    }
    console.log(`Bus to ${arrival.destinationName} arriving in ${time} ${units}.`);
}