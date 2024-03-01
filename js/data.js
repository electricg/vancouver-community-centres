"use strict";

const DAYS_OF_WEEK = [
  {
    id: "1",
    desc: "Sun",
  },
  {
    id: "2",
    desc: "Mon",
  },
  {
    id: "3",
    desc: "Tue",
  },
  {
    id: "4",
    desc: "Wed",
  },
  {
    id: "5",
    desc: "Thu",
  },
  {
    id: "6",
    desc: "Fri",
  },
  {
    id: "7",
    desc: "Sat",
  },
];

const STATUS = [
  {
    id: "0",
    desc: "Future",
  },
  {
    id: "2",
    desc: "In progress / Future",
  },
  {
    id: "1",
    desc: "In progress now",
  },
];

const ORIGINAL_DATA = {
  centers: [
    {
      id: "8",
      desc: "*Barclay Manor",
    },
    {
      id: "38",
      desc: "*Britannia Community Centre",
    },
    {
      id: "37",
      desc: "*Britannia Pool",
    },
    {
      id: "24",
      desc: "*Britannia Rink",
    },
    {
      id: "57",
      desc: "*Champlain Heights Community Centre",
    },
    {
      id: "6",
      desc: "*Coal Harbour Community Centre",
    },
    {
      id: "29",
      desc: "*Creekside Community Recreation Centre",
    },
    {
      id: "48",
      desc: "*Douglas Park Community Centre",
    },
    {
      id: "50",
      desc: "*Dunbar Community Centre",
    },
    {
      id: "43",
      desc: "*False Creek Community Centre",
    },
    {
      id: "44",
      desc: "*Hastings Community Centre",
    },
    {
      id: "59",
      desc: "*Hillcrest Aquatic Centre",
    },
    {
      id: "39",
      desc: "*Hillcrest Community Centre",
    },
    {
      id: "22",
      desc: "*Hillcrest Rink",
    },
    {
      id: "55",
      desc: "*Kensington Community Centre",
    },
    {
      id: "56",
      desc: "*Kensington Pool",
    },
    {
      id: "33",
      desc: "*Kerrisdale Community Centre",
    },
    {
      id: "23",
      desc: "*Kerrisdale Cyclone Taylor Arena",
    },
    {
      id: "34",
      desc: "*Kerrisdale Pool",
    },
    {
      id: "35",
      desc: "*Killarney Community Centre",
    },
    {
      id: "36",
      desc: "*Killarney Pool",
    },
    {
      id: "25",
      desc: "*Killarney Rink",
    },
    {
      id: "40",
      desc: "*Kitsilano Community Centre",
    },
    {
      id: "3",
      desc: "*Kitsilano Pool",
    },
    {
      id: "26",
      desc: "*Kitsilano Rink",
    },
    {
      id: "10",
      desc: "*Lord Byng Pool",
    },
    {
      id: "54",
      desc: "*Marpole-Oakridge Community Centre",
    },
    {
      id: "288",
      desc: "*Moberly Arts and Cultural Centre",
    },
    {
      id: "53",
      desc: "*Mount Pleasant Community Centre",
    },
    {
      id: "5",
      desc: "*New Brighton Pool",
    },
    {
      id: "60",
      desc: "*RayCam Co-operative Centre",
    },
    {
      id: "46",
      desc: "*Renfrew Park Community Centre",
    },
    {
      id: "47",
      desc: "*Renfrew Park Pool",
    },
    {
      id: "42",
      desc: "*Roundhouse Community Arts and Recreation Centre",
    },
    {
      id: "293",
      desc: "*Stanley Park Train",
    },
    {
      id: "51",
      desc: "*Strathcona Community Centre",
    },
    {
      id: "41",
      desc: "*Sunset Community Centre",
    },
    {
      id: "27",
      desc: "*Sunset Rink",
    },
    {
      id: "45",
      desc: "*Templeton Park Pool",
    },
    {
      id: "58",
      desc: "*Thunderbird Community Centre",
    },
    {
      id: "32",
      desc: "*Trout Lake Community Centre",
    },
    {
      id: "28",
      desc: "*Trout Lake Rink",
    },
    {
      id: "2",
      desc: "*Vancouver Aquatic Centre",
    },
    {
      id: "7",
      desc: "*West End Community Centre",
    },
    {
      id: "9",
      desc: "*West End Rink",
    },
    {
      id: "49",
      desc: "*West Point Grey Community Centre - Aberthau",
    },
    {
      id: "67",
      desc: "*West Point Grey Community Centre - Jericho Hill",
    },
    {
      id: "285",
      desc: "Vancouver Park Board Recreation Services",
    },
    {
      id: "52",
      desc: "VanDusen Botanical Garden",
    },
  ],
  othercategories: [
    {
      id: "27",
      desc: "1 - Infant and Toddler",
    },
    {
      id: "26",
      desc: "2 - Preschool",
    },
    {
      id: "22",
      desc: "3 - Child",
    },
    {
      id: "30",
      desc: "4 - Preteen",
    },
    {
      id: "29",
      desc: "5 - Youth",
    },
    {
      id: "23",
      desc: "6 - Adult",
    },
    {
      id: "24",
      desc: "7 - Senior",
    },
    {
      id: "31",
      desc: "All Ages",
    },
    {
      id: "25",
      desc: "Family",
    },
  ],
  sorts: [
    "Ages",
    "Date range",
    "Days of week",
    "Location",
    "Name",
    "Number",
    "Openings",
    "Time range",
  ],
};
