export interface MockBin {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  zone: string;
  fillAvg: number;
}

export const MOCK_BINS: MockBin[] = [
  {
    id: "BIN-112",
    name: "Gangapur Road Bin",
    location: "Gangapur Road, Near Hotel Panchavati",
    lat: 20.0059,
    lng: 73.7898,
    zone: "Zone A",
    fillAvg: 52,
  },
  {
    id: "BIN-118",
    name: "College Road Bin",
    location: "College Road, Near Rajiv Gandhi Bhavan",
    lat: 19.9975,
    lng: 73.7898,
    zone: "Zone B",
    fillAvg: 38,
  },
  {
    id: "BIN-124",
    name: "Sharanpur Road Bin",
    location: "Sharanpur Road, Near CBS Bus Stand",
    lat: 20.0011,
    lng: 73.7851,
    zone: "Zone A",
    fillAvg: 71,
  },
  {
    id: "BIN-131",
    name: "Panchavati Bin",
    location: "Panchavati, Near Ram Kund",
    lat: 20.0133,
    lng: 73.7924,
    zone: "Zone C",
    fillAvg: 24,
  },
  {
    id: "BIN-137",
    name: "Nashik Road Bin",
    location: "Nashik Road, Near Railway Station",
    lat: 19.9896,
    lng: 73.8012,
    zone: "Zone D",
    fillAvg: 85,
  },
];