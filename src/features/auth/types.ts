export interface LoginFormInput {
  username: string;
  password: string;
}

export interface LoginSubmitResult {
  ok: boolean;
  error?: string;
}

export type AuthRole = "SUPERADMIN" | "ADMIN" | "JURY";
