import fetch from "node-fetch";
import promptSync from "prompt-sync";
import readline from "readline-sync";
import winston from 'winston';


const { combine, timestamp, printf, colorize, align } = winston.format;
const logger = winston.createLogger({
    format: combine(
      colorize({ all: true }),
      timestamp({
        format: 'YYYY-MM-DD hh:mm:ss.SSS A',
      }),
      align(),
      printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [new winston.transports.Console()],
  });
  

let postcode = "";
let postcodeValid = false;

console.log("Please enter a valid postcode: ");
postcode = readline.prompt();


while (!postcodeValid){
    try {
        const postcodeValidationResponse = await fetch(`https://api.postcodes.io/postcodes/${postcode}/validate`);
        const postcodeValidation = await postcodeValidationResponse.json();
            if (!postcodeValidation.result) {
                logger.error("Invalid postcode");
                throw new Error ("Invalid postcode");
            }
            postcodeValid = true
        }
    catch (err) {
        console.log("\nInvalid postcode, please try again.")
        console.log("Please enter a valid postcode: ");
        postcode = readline.prompt();
    }
}

// Postcode
const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
const postcodeDetails = await postcodeResponse.json();
const lat = postcodeDetails.result.latitude;
const long = postcodeDetails.result.longitude;

// Bus Stop
try {
    const busStopResponse = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${long}&stopTypes=NaptanPublicBusCoachTram&radius=500`);
    const busStopDetails = await busStopResponse.json();
    if (busStopDetails.stopPoints.length === 0) {
        logger.error("No bus stops nearby");
        throw new Error ("No bus stops nearby")
    }
} catch (err) {
    console.log("\nThere are no TfL bus stops near this location.")
    throw err.message;
}
const busStopResponse = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${long}&stopTypes=NaptanPublicBusCoachTram&radius=500`);
const busStopDetails = await busStopResponse.json();
busStopDetails.stopPoints.sort((a, b) => a.distance - b.distance);

// Bus Times
let apiKey = "d32dc34554204e6f875b8c3c3e599f56";

var dict = {};

for (let j = 0; j < 2; j ++) {
    let stopCode = (busStopDetails.stopPoints[j].id);
    const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${stopCode}/Arrivals?app_key=${apiKey}`);
    const arrivals = await response.json();
    arrivals.sort((a, b) => a.timeToStation - b.timeToStation);
    dict[busStopDetails.stopPoints[j].commonName] = [];

    for (let i = 0; i < arrivals.length; i++) {
        const arrival = arrivals[i];
        dict[busStopDetails.stopPoints[j].commonName].push(`       Bus ${arrival.lineName} to ${arrival.destinationName} arriving in ${timeUnits(arrival.timeToStation)}.`);
    }
} 
let counter = 0;
Object.entries(dict).forEach(([key, value]) => {
    if (value.length === 0) counter += 1;
  })

try {
    if (counter === 2) {
        logger.error("No buses coming");
        throw new Error ("No buses coming");
    }
}
catch (err) {
    console.log("\nThere are no buses arriving.");
    throw err.message;
}
Object.entries(dict).forEach(([key, value]) => {
    console.log(key);
    value.forEach(element => console.log(element));
  })
function timeUnits(time) {
    if (time === 1) {
        return time + " second";
    } else if (time < 60) {
        return time + " seconds";
    } else if (time < 120) {
        return Math.floor(time/60) + " minute";
    } else {
        return Math.floor(time/60) + " minutes";
    }
}