/**
 * @author Brendan McGuire
 * @date 5 October 2021
 * 
 * Current constant favorites, will eventually be replaced by a more robust favorites system by
 * user. Favorites will be used to generate suggestions and will feature prominently on the home page.
 */

import { ResponseType } from "./data";

export const favorites: ResponseType["XREF"] = [
  {
    PointSliceID: 8935,
    Room: "325",
    RoomType: "Project Room",
    BLG: "WATT",
    Floor: "3rd Floor",
    ReadingType: "Zone Temp",
    Alias: "RM 325"
  },
  {
    PointSliceID: 8939,
    Room: "327",
    RoomType: "Project Room",
    BLG: "WATT",
    Floor: "3rd Floor",
    ReadingType: "Zone Temp",
    Alias: "RM 327",
  },
  {
    PointSliceID: 8916,
    Room: "331",
    RoomType: "Classroom",
    BLG: "WATT",
    Floor: "3rd Floor",
    ReadingType: "Zone Temp",
    Alias: "RM 331",
  },
  {
    PointSliceID: 8921,
    Room: "329",
    RoomType: "Project Room",
    BLG: "WATT",
    Floor: "3rd Floor",
    ReadingType: "Zone Temp",
    Alias: "RM 329",
  },
];