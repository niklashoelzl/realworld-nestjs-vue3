/**
 * src/composables/use-form.ts
 *
 * Generisches Vue Composable für die Verwaltung von Formularzuständen.
 * Stellt reaktive Zustände für Formulardaten, Ladezustand und Fehlermeldungen
 * sowie Hilfsmethoden für häufige Formularoperationen bereit.
 */

import { ref } from 'vue';

/**
 * Generisches Composable zur Formularverwaltung.
 * Kann für beliebige Formularobjekte verwendet werden.
 *
 * @param initialData Initiale Formulardaten; werden auch beim Reset wiederhergestellt
 * @returns Reaktive Zustände und Hilfsmethoden für das Formular
 */
export function useForm<T extends Record<string, any>>(initialData: T) {
  const form = ref<T>(initialData);
  const loading = ref(false);
  const error = ref('');

  /** Setzt das Formular auf den initialen Zustand zurück und löscht Fehlermeldungen */
  const resetForm = () => {
    form.value = { ...initialData };
    error.value = '';
  };

  /** Löscht die aktuelle Fehlermeldung */
  const clearError = () => {
    error.value = '';
  };

  /**
   * Setzt den Ladezustand manuell.
   *
   * @param value Neuer Ladezustand
   */
  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  /**
   * Setzt die Fehlermeldung anhand eines gefangenen Fehlers.
   * Fällt auf eine generische Meldung zurück, wenn keine `message` Eigenschaft vorhanden ist.
   *
   * @param err Der gefangene Fehler
   */
  const handleError = (err: any) => {
    error.value = err?.message || 'Ein Fehler ist aufgetreten';
  };

  return {
    form,
    loading,
    error,
    resetForm,
    clearError,
    setLoading,
    handleError,
  };
}
