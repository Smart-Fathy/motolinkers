export type VehicleOrigin = "cn" | "ae";
export type VehicleType = "ev" | "hybrid";
export type VehiclePowerTrain = "ev" | "reev" | "phev" | "hybrid";
export type VehicleBody =
  | "sedan"
  | "suv"
  | "hatchback"
  | "coupe"
  | "wagon"
  | "pickup"
  | "mpv"
  | "convertible";
export type VehicleDriveType = "fwd" | "rwd" | "awd" | "4wd";

export interface Vehicle {
  id: string;
  name: string;
  origin: VehicleOrigin;
  type: VehicleType;
  year: number;
  price: number;
  trans: string;
  drive: string;
  img: string;
  // Filterable fields — populated from Supabase, optional in the static
  // fallback so existing seed data still validates.
  brand?: string | null;
  model?: string | null;
  body?: VehicleBody | null;
  driveType?: VehicleDriveType | null;
  powerTrain?: VehiclePowerTrain;
  gallery?: string[];
  createdAt?: string;
}

export const FLEET: Vehicle[] = [
  {
    id: "denza-n9",
    name: "Denza N9 Premium",
    origin: "cn",
    type: "hybrid",
    year: 2026,
    price: 5495808,
    trans: "CVT",
    drive: "Hybrid",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChxkPmcIg1SAC8aOABS-CaJfeEE991.avif",
  },
  {
    id: "denza-d9",
    name: "Denza D9 DMI Navigator",
    origin: "cn",
    type: "hybrid",
    year: 2026,
    price: 4582780,
    trans: "Auto",
    drive: "Hybrid",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__Chto52l282aAdFJRACsqCVLYKVo946.avif",
  },
  {
    id: "leopard-8",
    name: "Fang Cheng Bao Leopard 8",
    origin: "cn",
    type: "hybrid",
    year: 2026,
    price: 5272026,
    trans: "CVT",
    drive: "Hybrid · 7-seat",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtlyGe294uAVmSDADGjc-F-DHE533.avif",
  },
  {
    id: "leopard-7",
    name: "Leopard 7 190KM Ultra 4WD",
    origin: "cn",
    type: "hybrid",
    year: 2026,
    price: 3123726,
    trans: "Auto",
    drive: "Hybrid 4WD",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChxpWGkITn-AJLkFAAmiY-1RJCo135.avif",
  },
  {
    id: "byd-tang",
    name: "BYD Tang L EV LiDAR Flagship",
    origin: "cn",
    type: "ev",
    year: 2026,
    price: 2485445,
    trans: "Fixed",
    drive: "670 km · Pure EV",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtpWGknIiyATwyuADJRagq1gp0475.avif",
  },
  {
    id: "byd-sealion",
    name: "BYD Sealion 06 EV 605 PLUS",
    origin: "cn",
    type: "ev",
    year: 2026,
    price: 1735474,
    trans: "Fixed",
    drive: "605 km · Pure EV",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__Chto52jx-KSAPEjYACgLYFpHJ3E958.avif",
  },
  {
    id: "byd-yuan",
    name: "BYD Yuan Up Smart Driving",
    origin: "cn",
    type: "ev",
    year: 2025,
    price: 1316556,
    trans: "Fixed",
    drive: "401 km · Pure EV",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtlyGe8g0SAGTSOACml6eF6rXE546.avif",
  },
  {
    id: "icar-v23",
    name: "ICAR V23 4WD",
    origin: "cn",
    type: "ev",
    year: 2026,
    price: 1796978,
    trans: "Fixed",
    drive: "Electric 4WD",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtpWGkIPwCAYgMbADp0_hK49ow697.avif",
  },
  {
    id: "nissan-n7",
    name: "Nissan N7 625 Max",
    origin: "cn",
    type: "ev",
    year: 2026,
    price: 1517340,
    trans: "Single-Speed",
    drive: "625 km · EV",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__Chtlx2gR21iAVZEFAFTCkCgt7TI284-1.avif",
  },
  {
    id: "bmw-i3",
    name: "BMW i3 40 L",
    origin: "ae",
    type: "ev",
    year: 2026,
    price: 2501031,
    trans: "Single-Speed",
    drive: "Pure EV",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChxpVml3lMOAK5jcAD2ES09g0Ms415.avif",
  },
  {
    id: "deepal-s05-max",
    name: "Deepal S05 EV 620 Max",
    origin: "cn",
    type: "ev",
    year: 2026,
    price: 1447221,
    trans: "Single-Speed",
    drive: "620 km · EV",
    img: "https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtpWGisQU-AHOnIAFNwUKrNxXc077-3.avif",
  },
  {
    id: "deepal-s05",
    name: "Deepal S05 520 Plus",
    origin: "cn",
    type: "ev",
    year: 2026,
    price: 1199785,
    trans: "Auto",
    drive: "520 km · EV",
    img: "https://motolinkers.com/wp-content/uploads/2026/03/22-660x440.avif",
  },
  {
    id: "avatr-12",
    name: "Avatr 12 Max EV",
    origin: "ae",
    type: "ev",
    year: 2026,
    price: 2717414,
    trans: "Auto",
    drive: "Pure EV · Flagship",
    img: "https://motolinkers.com/wp-content/uploads/2026/02/banner_pc-660x440.jpg",
  },
  {
    id: "avatr-07r",
    name: "Avatr 07 REEV Ultra",
    origin: "cn",
    type: "hybrid",
    year: 2026,
    price: 2417567,
    trans: "Auto",
    drive: "REEV Ultra",
    img: "https://motolinkers.com/wp-content/uploads/2026/02/CAR-2-660x440.jpg",
  },
  {
    id: "avatr-07e",
    name: "Avatr 07 EV Max Plus",
    origin: "ae",
    type: "ev",
    year: 2026,
    price: 2683590,
    trans: "Auto",
    drive: "Pure EV Max",
    img: "https://motolinkers.com/wp-content/uploads/2026/02/CAR-1-660x440.jpg",
  },
];
