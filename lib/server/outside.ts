/**
 * Gets outside data, based on a nearby NWS observation station. The specific station in question is
 * https://api.weather.gov/stations/KCEU/observations/latest
 */

 import fetch from "node-fetch"
 
 export interface Observation {
     id: string;
     type: string;
     geometry: {
         type: string;
         coordinates: number[];
     };
     properties: {
         [property: string]: {
                 value: number;
                 unitCode: string;
                 qualityControl: string;
         }
     }
 };
 
 const cacheLatest = () => {
 
     let latest: Observation | null = null;
 
     async function getLatest() {
         return fetch("https://api.weather.gov/stations/KCEU/observations/latest")
             .then(res => res.json());
     };
 
     setInterval(async () => {
         console.info("Updating external conditions...");
         latest = await getLatest();
     }, 1000 * 60 * 2);
     
     return async () => {
         if (!latest) {
             latest = await getLatest();
         }
         return latest as Observation;
     };
 };
 
 export const getLatest = cacheLatest();
 
 /**
  * Gets the temperature in degree Fahrenheit.
  * @returns {Promise<number>} The temperature in F
  */
 export async function getTemperature() {
     const latest = await getLatest();
     const degC = latest.properties.temperature.value;
 
     return degC * 9 / 5 + 32;
 }
 
 /**
  * Gets the relative humidity in percent.
  * @returns {Promise<number>} The relative humidity in %
  */
 export async function getRelativeHumidity() {
     const latest = await getLatest();
     return latest.properties.relativeHumidity.value;
 }