/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { useState, useRef } from "react";
import { SystemSettings, AppUser, UserProfile, SchoolInfo } from "../types";

export function useSessionState() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  // Lot 0 : session restaurée par Firebase Auth (plus jamais depuis localStorage)
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authUid, setAuthUid] = useState<string | null>(null);
  // Multi-écoles : école active, écoles accessibles, profil global, super-admin
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [showSchoolPicker, setShowSchoolPicker] = useState<boolean>(false);
  const [schoolError, setSchoolError] = useState<string>("");
  const [schoolBusy, setSchoolBusy] = useState<boolean>(false);
  const paymentsLoadedRef = useRef(false);
  // Désabonnement immédiat des écoutes Firestore (changement d'école, déconnexion).
  const unsubscribeAllRef = useRef<() => void>(() => undefined);
  const settingsRef = useRef<SystemSettings | null>(null);
  const loginInProgressRef = useRef(false);

  return {
    currentUser,
    setCurrentUser,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    showPassword,
    setShowPassword,
    loginError,
    setLoginError,
    loginLoading,
    setLoginLoading,
    authChecking,
    setAuthChecking,
    authUid,
    setAuthUid,
    activeSchoolId,
    setActiveSchoolId,
    schools,
    setSchools,
    userProfile,
    setUserProfile,
    isSuperAdmin,
    setIsSuperAdmin,
    showSchoolPicker,
    setShowSchoolPicker,
    schoolError,
    setSchoolError,
    schoolBusy,
    setSchoolBusy,
    paymentsLoadedRef,
    unsubscribeAllRef,
    settingsRef,
    loginInProgressRef,
  };
}
