/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * État et logique : activities/useActivitiesState ; sections : activities/.
 */
import { ActivityTrip, ActivityParticipant, ActivityExpense, Student, Teacher, Class, SystemSettings } from "../types";
import { useActivitiesState } from "./activities/useActivitiesState";
import { ActivitiesContext } from "./activities/ActivitiesContext";
import ActivitiesOverview from "./activities/ActivitiesOverview";
import ActivitiesList from "./activities/ActivitiesList";
import ActivityWorkspace from "./activities/ActivityWorkspace";
import ActivityFormModal from "./activities/ActivityFormModal";
import ParticipantModal from "./activities/ParticipantModal";
import ActivityExpenseModal from "./activities/ActivityExpenseModal";
import ActivityPrintModal from "./activities/ActivityPrintModal";

export interface ActivitiesManagementProps {
  activities: ActivityTrip[];
  participants: ActivityParticipant[];
  activityExpenses: ActivityExpense[];
  students: Student[];
  teachers: Teacher[];
  classes: Class[];
  systemSettings: SystemSettings | null;
  canManageActivities?: boolean;
  canCreateActivity?: boolean;
  canUpdateActivity?: boolean;
  canDeleteActivity?: boolean;
  canPrintActivity?: boolean;
  onSaveActivity: (activity: ActivityTrip) => void;
  onDeleteActivity: (id: string) => void;
  onSaveParticipant: (participant: ActivityParticipant) => void;
  onDeleteParticipant: (id: string) => void;
  onSaveActivityExpense: (expense: ActivityExpense) => void;
  onDeleteActivityExpense: (id: string) => void;
  onSyncToFinance: (activity: ActivityTrip, netBalance: number, totalContributions: number, totalExpenses: number) => void;
  onNavigateToFinance?: () => void;
}

export default function ActivitiesManagement(props: ActivitiesManagementProps) {
  const state = useActivitiesState(props);
  const {
    activities,
  } = state;
  return (
    <ActivitiesContext.Provider value={state}>
    <div id="activities-management-module" data-screen="activities" className="space-y-6">
      {/* Main Dashboard Interactive UI (Hidden during print) */}
      <div className="space-y-6 print:hidden">
        <ActivitiesOverview />

      {/* Main Two-Column or Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <ActivitiesList />

        <ActivityWorkspace />
      </div>
      </div>

      <ActivityFormModal />

      <ParticipantModal />

      <ActivityExpenseModal />

      <ActivityPrintModal />
    </div>
    </ActivitiesContext.Provider>
  );
}
