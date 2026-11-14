import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tiiramisu",
    short_name: "Tiiramisu",
    description: "A warm daily companion for staying well after treatment.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f1e8",
    theme_color: "#f7f1e8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
