export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 600;

export const PLAYER_START = {
  x: 470,
  y: 310,
};

export const SHORE_X = 345;

export const PIER = {
  x: 220,
  y: 260,
  width: 675,
  height: 85,
};

export const ZONES = [
  {
    name: "Ocean Study House",
    x: 440,
    y: 40,
    width: 470,
    height: 180,
    color: 0xf6edda,
  },
  {
    name: "Coastal Library",
    x: 445,
    y: 385,
    width: 450,
    height: 175,
    color: 0xf6edda,
  },
];

export const FURNITURE = [
  {
    type: "desk",
    x: 470,
    y: 112,
    width: 110,
    height: 42,
  },
  {
    type: "desk",
    x: 605,
    y: 112,
    width: 110,
    height: 42,
  },
  {
    type: "desk",
    x: 740,
    y: 112,
    width: 110,
    height: 42,
  },
  {
    type: "shelf",
    x: 470,
    y: 430,
    width: 155,
    height: 36,
  },
  {
    type: "project",
    x: 475,
    y: 495,
    width: 145,
    height: 38,
  },
  {
    type: "sofa",
    x: 663,
    y: 430,
    width: 190,
    height: 42,
  },
  {
    type: "table",
    x: 728,
    y: 493,
    width: 62,
    height: 42,
  },
  {
    type: "lounger",
    x: 365,
    y: 156,
    width: 48,
    height: 65,
  },
  {
    type: "lounger",
    x: 365,
    y: 456,
    width: 48,
    height: 65,
  },
];

export const PALMS = [
  { x: 386, y: 65 },
  { x: 912, y: 270 },
  { x: 386, y: 565 },
];

function centered({ x, y, width, height }) {
  return {
    x: x + width / 2,
    y: y + height / 2,
    width,
    height,
  };
}

export const COLLIDERS = [
  // Ocean: the wooden pier remains walkable.
  centered({
    x: 0,
    y: 0,
    width: PIER.x,
    height: WORLD_HEIGHT,
  }),
  centered({
    x: PIER.x,
    y: 0,
    width: SHORE_X - PIER.x,
    height: PIER.y,
  }),
  centered({
    x: PIER.x,
    y: PIER.y + PIER.height,
    width: SHORE_X - PIER.x,
    height: WORLD_HEIGHT - PIER.y - PIER.height,
  }),

  ...FURNITURE.map(centered),

  ...FURNITURE.filter((item) => item.type === "desk").map(
    (item) =>
      centered({
        x: item.x + item.width / 2 - 13,
        y: item.y + 50,
        width: 26,
        height: 23,
      })
  ),

  ...PALMS.map(({ x, y }) => ({
    x,
    y: y + 14,
    width: 18,
    height: 28,
  })),
];

export const COLORS = {
  floor: 0xf1e3be,
  floorLine: 0xe1cca3,
  ocean: 0x91ced1,
  deepWater: 0x79bec6,
  foam: 0xdbf4e8,
  border: 0xb69a78,
  deck: 0xc79b70,
  deckLight: 0xe8c69c,
  desk: 0xe5c39a,
  deskEdge: 0xb68962,
  screen: 0x73c3d0,
  chair: 0x7eaaa2,
  sofa: 0x7eb5b5,
  table: 0xc99d71,
  shelf: 0xc09a76,
  book1: 0x779ba5,
  book2: 0xc4917f,
  book3: 0xa4b590,
  plant: 0x57997e,
  pot: 0xba9169,
  label: 0x29494e,
  labelText: "#ffffff",
};