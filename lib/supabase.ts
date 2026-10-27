// lib/supabase.ts
// [MIGRATED TO MYSQL] - File ini dipertahankan untuk backward compatibility
// Seluruh data dan autentikasi telah dimigrasikan ke MySQL (Laragon).

export const isUsingMySQL = true;

interface SignUpOptions {
  data?: {
    nama?: string;
    kampus?: string;
    student_email?: string;
    student_verified?: boolean;
  };
}

// Mock adapter yang aman jika masih ada modul lama yang mengimpor supabase
export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (!res.ok) return { data: null, error: new Error(json.error || "Login gagal") };
        return { data: { user: json.user }, error: null };
      } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: SignUpOptions;
    }) {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            nama: options?.data?.nama,
            kampus: options?.data?.kampus,
            student_email: options?.data?.student_email,
            student_verified: options?.data?.student_verified,
          }),
        });
        const json = await res.json();
        if (!res.ok) return { data: null, error: new Error(json.error || "Register gagal") };
        return { data: { user: json.user }, error: null };
      } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    async signOut() {
      return { error: null };
    },
    onAuthStateChange(_callback?: (event: string, session: unknown) => void) {
      void _callback;
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  },
  from(_tableName?: string) {
    void _tableName;
    return {
      select: () => ({
        eq: () => ({
          order: async () => ({ data: [], error: null }),
        }),
        or: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async () => ({ error: null }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
      delete: () => ({
        eq: async () => ({ error: null }),
      }),
      upsert: async () => ({ error: null }),
    };
  },
};

export default supabase;
