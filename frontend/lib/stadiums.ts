export interface Stadium {
  id: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
  capacity: number
  climateProfile: string
  signatureScenario: Scenario
}

export type Scenario =
  | "normal"
  | "price_spike"
  | "sensor_fail"
  | "api_broken"
  | "heat_wave"

export const scenarios: { value: Scenario; label: string; description: string }[] = [
  { value: "normal", label: "Normal operations", description: "Baseline — happy path" },
  { value: "price_spike", label: "Energy price spike", description: "Grid price surges 3× at step 5" },
  { value: "sensor_fail", label: "Sensor failure", description: "Temp sensor reads 250°F at step 8" },
  { value: "api_broken", label: "Broken HVAC API", description: "HVAC tool errors after step 3" },
  { value: "heat_wave", label: "Heat wave", description: "Outside temp ramps 95→118°F" },
]

export const stadiums: Stadium[] = [
  {
    id: "lusail",
    name: "Lusail Stadium",
    city: "Lusail",
    country: "Qatar",
    lat: 25.4220,
    lng: 51.4891,
    capacity: 88966,
    climateProfile: "desert_hot",
    signatureScenario: "heat_wave",
  },
  {
    id: "lambeau",
    name: "Lambeau Field",
    city: "Green Bay",
    country: "USA",
    lat: 44.5013,
    lng: -88.0622,
    capacity: 81441,
    climateProfile: "cold_continental",
    signatureScenario: "price_spike",
  },
  {
    id: "wembley",
    name: "Wembley Stadium",
    city: "London",
    country: "UK",
    lat: 51.5560,
    lng: -0.2795,
    capacity: 90000,
    climateProfile: "temperate_maritime",
    signatureScenario: "normal",
  },
  {
    id: "allegiant",
    name: "Allegiant Stadium",
    city: "Las Vegas",
    country: "USA",
    lat: 36.0908,
    lng: -115.1833,
    capacity: 65000,
    climateProfile: "arid_desert",
    signatureScenario: "api_broken",
  },
  {
    id: "yankee",
    name: "Yankee Stadium",
    city: "New York",
    country: "USA",
    lat: 40.8296,
    lng: -73.9262,
    capacity: 54251,
    climateProfile: "humid_subtropical",
    signatureScenario: "sensor_fail",
  },
]

export function latLngToVector3(lat: number, lng: number, radius: number = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return { x, y, z }
}
