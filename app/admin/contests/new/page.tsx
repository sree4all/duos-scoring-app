import { ContestDetailsStep } from "@/components/admin/contest-wizard/contest-details-step";
import { EventsStep } from "@/components/admin/contest-wizard/events-step";
import { PromptsStep } from "@/components/admin/contest-wizard/prompts-step";
import { ScoringStep } from "@/components/admin/contest-wizard/scoring-step";
import { PublishStep } from "@/components/admin/contest-wizard/publish-step";

export default function NewContestPage() {
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">New Contest Wizard</h1>
      <ContestDetailsStep />
      <EventsStep />
      <PromptsStep />
      <ScoringStep />
      <PublishStep />
    </main>
  );
}
