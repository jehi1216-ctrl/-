export interface FormState {
  error: string | null;
  success: boolean;
  submittedAt?: number;
}

export const initialFormState: FormState = { error: null, success: false };
