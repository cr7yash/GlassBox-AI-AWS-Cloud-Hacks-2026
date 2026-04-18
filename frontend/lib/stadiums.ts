export interface Stadium {
  id: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
  capacity: number
}

export const stadiums: Stadium[] = [
  {
    id: "lusail",
    name: "Lusail Stadium",
    city: "Lusail",
    country: "Qatar",
    lat: 25.4186,
    lng: 51.4907,
    capacity: 80000,
  },
  {
    id: "wembley",
    name: "Wembley Stadium",
    city: "London",
    country: "UK",
    lat: 51.556,
    lng: -0.2795,
    capacity: 90000,
  },
  {
    id: "camp-nou",
    name: "Camp Nou",
    city: "Barcelona",
    country: "Spain",
    lat: 41.3809,
    lng: 2.1228,
    capacity: 99354,
  },
  {
    id: "maracana",
    name: "Maracanã",
    city: "Rio de Janeiro",
    country: "Brazil",
    lat: -22.9121,
    lng: -43.2302,
    capacity: 78838,
  },
  {
    id: "rose-bowl",
    name: "Rose Bowl",
    city: "Pasadena",
    country: "USA",
    lat: 34.1613,
    lng: -118.1676,
    capacity: 90888,
  },
]

// Convert lat/lng to 3D sphere coordinates
export function latLngToVector3(lat: number, lng: number, radius: number = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return { x, y, z }
}
