/**
 * Le projet n'installe pas @types/react : on déclare l'attribut `key` pour
 * que les composants typés de src/ui l'acceptent dans les listes.
 */
declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      key?: string | number | null;
    }
  }
}
export {};
