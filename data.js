// Demo data — crew, targets, scripted debate, plan, risk
window.HEIST_DATA = {
  crew: [
    {
      id: "professor",
      num: "01",
      role: "MASTERMIND",
      name: "THE PROFESSOR",
      desc: "Strategy, timeline, contingencies, synthesis.",
      pills: ["SYNTHESIS", "ENDGAME"],
      color: "#ffffff",
      colorName: "white",
    },
    {
      id: "brooklyn",
      num: "02",
      role: "HACKER",
      name: "BROOKLYN",
      desc: "Cameras, alarms, comms, networks.",
      pills: ["CCTV", "RADIO BAND"],
      color: "#DC0000",
      colorName: "red",
    },
    {
      id: "detroit",
      num: "03",
      role: "DRIVER",
      name: "DETROIT",
      desc: "Routes, vehicles, timing, getaway.",
      pills: ["EXFIL", "DECOY"],
      color: "#C9A227",
      colorName: "gold",
    },
    {
      id: "houston",
      num: "04",
      role: "INSIDE MAN",
      name: "HOUSTON",
      desc: "Guards, staff, social engineering.",
      pills: ["FLOORPLAN", "PRETEXT"],
      color: "#888888",
      colorName: "grey",
    },
  ],

  targets: [
    {
      name: "TRADER JOE'S, UNION SQUARE",
      address: "142 E 14TH ST, NEW YORK, NY 10003",
      coords: "40.7338° N · 73.9897° W",
      // Position on the SVG NYC map, expressed as 0–1 of a 1200x600 viewbox
      mapX: 0.505,
      mapY: 0.662,
      lng: -73.9897,
      lat: 40.7338,
    },
    {
      name: "STATUE OF LIBERTY, NEW YORK HARBOR",
      address: "LIBERTY ISLAND, NEW YORK, NY 10004",
      coords: "40.6892° N · 74.0445° W",
      mapX: 0,
      mapY: 1,
      lng: -74.0445,
      lat: 40.6892,
    },
    {
      name: "FEDERAL RESERVE BANK OF NEW YORK",
      address: "33 LIBERTY ST, NEW YORK, NY 10045",
      coords: "40.7076° N · 74.0098° W",
      mapX: 0.170,
      mapY: 0.924,
      lng: -74.0098,
      lat: 40.7076,
    },
    {
      name: "TIMES SQUARE · BROADWAY ISLAND",
      address: "1560 BROADWAY, NEW YORK NY 10036",
      coords: "40.7580° N · 73.9855° W",
      mapX: 0.50,
      mapY: 0.46,
      lng: -73.9855,
      lat: 40.7580,
    },
    {
      name: "GRAND CENTRAL · MAIN CONCOURSE",
      address: "89 E 42ND ST, NEW YORK NY 10017",
      coords: "40.7527° N · 73.9772° W",
      mapX: 0.55,
      mapY: 0.49,
      lng: -73.9772,
      lat: 40.7527,
    },
    {
      name: "MET MUSEUM · GREEK & ROMAN WING",
      address: "1000 5TH AVE, NEW YORK NY 10028",
      coords: "40.7794° N · 73.9632° W",
      mapX: 0.58,
      mapY: 0.31,
      lng: -73.9632,
      lat: 40.7794,
    },
  ],

  // Scripted debate — pacing tuned for ~60s read
  debate: [
    { who: "professor", t: "T-04:32", text: "We have a window. Public, dense, fluorescent. The crowd is the cover. The ceiling is the constraint." },
    { who: "brooklyn", t: "T-04:18", text: "I count four PTZ cameras on the floor and two at the loading bay. The DVR is on the back office network. I can loop it from outside the building." },
    { who: "houston", t: "T-04:01", text: "Two uniformed guards rotate at fifteen-minute intervals. One of them takes his break at the bodega across the street. That's our window." },
    { who: "detroit", t: "T-03:44", text: "14th Street is a parking lot at this hour. We don't drive out. We walk out. Three of us north, one south. We meet at the L platform." },
    { who: "professor", t: "T-03:27", text: "No. The L is being serviced tonight. Detroit, give me a backup." },
    { who: "detroit", t: "T-03:14", text: "Then Union Square station, southbound 4. Trains every six minutes. Last platform car. We split as soon as we hit Brooklyn Bridge." },
    { who: "brooklyn", t: "T-02:58", text: "I'll need the fire panel offline for ninety seconds. I can do it without tripping central. Houston needs to clear the back hallway in that window." },
    { who: "houston", t: "T-02:41", text: "Doable. The night manager goes for a smoke at eleven sharp. He props the door with a milk crate. Every night." },
    { who: "professor", t: "T-02:22", text: "Then we move at eleven oh two. Brooklyn cuts the panel at oh one. Detroit holds the platform at oh five. Houston, you stay until the second guard rotates." },
    { who: "professor", t: "T-02:05", text: "We are not here for the money. We are here for the story. Make it a story worth telling." },
  ],

  plan: [
    { t: "T-04:00", title: "ASSEMBLY", body: "Crew converges at the staging point. Comms check on band 4. Final intel sync on guard rotation." },
    { t: "T-02:00", title: "INFILTRATION", body: "Houston enters as staff. Brooklyn pulls into the perimeter van. Detroit holds the platform at Union Square." },
    { t: "T+00:00", title: "EXECUTION", body: "Fire panel offline 90s. Camera loop initiated. Back hallway cleared. Two-minute window." },
    { t: "T+02:00", title: "EXTRACTION", body: "North split via 14th. South split via Union Square 4 train. No comms until Brooklyn Bridge." },
    { t: "T+04:00", title: "DISPERSAL", body: "Crew goes dark. No contact for 72 hours. Professor handles the post-op narrative." },
  ],

  risk: {
    score: 42,
    sub: [
      { label: "DETECTION", value: 28 },
      { label: "INTERCEPT", value: 51 },
      { label: "FALLOUT", value: 47 },
    ],
  },

  quote: "This plan exists only in narrative form.\nThe Heist Crew is a fictional simulation built with AG2 multi-agent AI.\nNo vaults were harmed. No Trader Joe's was robbed.",

  professorQuote: "Some men dream of gold. We dreamed of a clean exit on the FDR. One of those is achievable.",

  disclaimerFooter: "This plan exists only in narrative form. The crew is fictional. The targets are inert. Don't actually rob places.",
};
