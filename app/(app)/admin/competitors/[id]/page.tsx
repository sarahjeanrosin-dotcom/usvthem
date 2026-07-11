import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompetitorForm } from "@/components/admin/competitor-form";

export default async function EditCompetitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: competitor } = await supabase
    .from("competitors")
    .select("*")
    .eq("id", id)
    .single();

  if (!competitor) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">
          Edit — {competitor.name}
        </h1>
        <p className="mt-1 text-sm text-gray-text">
          Update competitor details and knowledge sources
        </p>
      </div>
      <CompetitorForm competitor={competitor} />
    </div>
  );
}
