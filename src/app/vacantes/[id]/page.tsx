import { JOBS } from "@/lib/jobs";
import VacanteContent from "./_content";

export function generateStaticParams() {
  return JOBS.map((j) => ({ id: String(j.id) }));
}

export default async function VacantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VacanteContent id={id} />;
}
