import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { Map } from "./components/Map";
import { Itinerary } from "./components/Itinerary";
import { Panorama } from "./components/Panorama";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "map", Component: Map },
      { path: "itinerary", Component: Itinerary },
      { path: "panorama", Component: Panorama },
      { path: "panorama/:siteId", Component: Panorama },
    ],
  },
]);
