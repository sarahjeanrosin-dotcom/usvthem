import { CompetitorForm } from "@/components/admin/competitor-form";

export default function NewCompetitorPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Add Competitor</h1>
        <p className="mt-1 text-sm text-gray-text">
          Add a new competitor to the knowledge base
        </p>
      </div>
      <CompetitorForm />
    </div>
  );
}
