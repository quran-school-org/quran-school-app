/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { checkUserPermission } from "../types";
import ActivitiesManagement from "../components/ActivitiesManagement";
import { useApp } from "../app/AppContext";

export default function ActivitiesScreen() {
  const {
    students,
    teachers,
    classes,
    systemSettings,
    activities,
    activityParticipants,
    activityExpenses,
    currentUser,
    setActiveTab,
    currentRole,
    handleSaveActivity,
    handleDeleteActivity,
    handleSaveActivityParticipant,
    handleDeleteActivityParticipant,
    handleSaveActivityExpense,
    handleDeleteActivityExpense,
    handleSyncActivityToFinance,
  } = useApp();

  return (
    <ActivitiesManagement
      activities={activities}
      participants={activityParticipants}
      activityExpenses={activityExpenses}
      students={students}
      teachers={teachers}
      classes={classes}
      systemSettings={systemSettings}
      canCreateActivity={checkUserPermission(currentUser, currentRole, "activities", "create")}
      canUpdateActivity={checkUserPermission(currentUser, currentRole, "activities", "update")}
      canDeleteActivity={checkUserPermission(currentUser, currentRole, "activities", "delete")}
      canPrintActivity={checkUserPermission(currentUser, currentRole, "activities", "print")}
      onSaveActivity={handleSaveActivity}
      onDeleteActivity={handleDeleteActivity}
      onSaveParticipant={handleSaveActivityParticipant}
      onDeleteParticipant={handleDeleteActivityParticipant}
      onSaveActivityExpense={handleSaveActivityExpense}
      onDeleteActivityExpense={handleDeleteActivityExpense}
      onSyncToFinance={handleSyncActivityToFinance}
      onNavigateToFinance={() => setActiveTab("finance")}
    />
  );
}
