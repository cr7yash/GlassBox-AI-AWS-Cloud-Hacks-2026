import dynamic from "next/dynamic";

export const ThreeBackdropDynamic = dynamic(
  () => import("./ThreeBackdrop").then((m) => m.ThreeBackdrop),
  { ssr: false }
);

