import type { Metadata } from "next";
import { ClinicView } from "@/components/clinic/clinic-view";

export const metadata: Metadata = {
  title: "Tiiramisu · Clinic",
  description: "Who might need a call this week.",
};

export default function ClinicPage() {
  return <ClinicView />;
}
