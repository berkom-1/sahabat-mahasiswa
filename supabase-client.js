/**
 * ============================================================================
 * SUPABASE CLIENT & BACK-END SERVICE DENGAN GRACEFUL FALLBACK LOCALSTORAGE
 * Sahabat Mahasiswa Web Application
 * ============================================================================
 * Modul ini menyediakan antarmuka terpadu untuk autentikasi dan database.
 * Jika kredensial Supabase diatur, modul akan menggunakan Supabase Cloud.
 * Jika kredensial masih berupa placeholder atau sedang offline, modul secara
 * otomatis dan mulus beralih menggunakan localStorage (aplikasi tidak akan crash).
 * ============================================================================
 */

// Normalisasi User-Agent agar tidak diblokir oleh Google OAuth (disallowed_useragent) di Android WebView
try {
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    if (navigator.userAgent.includes('; wv') || /Version\/4\.0/.test(navigator.userAgent)) {
      const cleanUA = navigator.userAgent.replace('; wv', '').replace(/Version\/4\.0\s*/, '');
      Object.defineProperty(navigator, 'userAgent', { get: () => cleanUA, configurable: true });
      Object.defineProperty(navigator, 'appVersion', { get: () => cleanUA, configurable: true });
    }
  }
} catch (e) {}

// ----------------------------------------------------------------------------
// 1. KONFIGURASI KREDENSIAL SUPABASE
// ----------------------------------------------------------------------------
// Ganti nilai di bawah ini dengan URL dan Kunci Anonim proyek Supabase Anda.
// Dapatkan di: https://app.supabase.com -> Project Settings -> API
const SUPABASE_CONFIG = {
  url: 'https://cxstsxortzfsdzqugjhp.supabase.co', // Ganti dengan Project URL Anda
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4c3RzeG9ydHpmc2R6dXFnamhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTE1MDQsImV4cCI6MjEwNzM2NzUwNH0.csK-f95iNT9Uc-DlAY8Sul7nL8J1cWZHdx_-GEludVk'          // Ganti dengan Anon Public Key Anda
};

// ----------------------------------------------------------------------------
// 2. HELPER LOCALSTORAGE (FALLBACK STORAGE)
// ----------------------------------------------------------------------------
const smStorage = {
  get(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      console.warn(`[Storage] Gagal membaca ${key}:`, e);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Storage] Gagal menyimpan ${key}:`, e);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) { }
  }
};

// Helper Hash SHA-256 untuk keamanan password pada mode demo/localStorage
async function hashPassword(str) {
  try {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    // Fallback sederhana jika crypto.subtle tidak tersedia (misal di konteks non-https lama)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_hash_' + Math.abs(hash);
  }
}

// ----------------------------------------------------------------------------
// 3. INISIALISASI SUPABASE CLIENT
// ----------------------------------------------------------------------------
let supabaseInstance = null;

function checkIsConfigured() {
  return Boolean(
    SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.anonKey &&
    !SUPABASE_CONFIG.url.includes('YOUR_PROJECT_ID') &&
    !SUPABASE_CONFIG.anonKey.includes('YOUR_SUPABASE_ANON_KEY')
  );
}

function initSupabase() {
  if (supabaseInstance) return supabaseInstance;

  if (checkIsConfigured() && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseInstance = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      console.info('[Sahabat Mahasiswa] Supabase Client berhasil terhubung.');
    } catch (err) {
      console.warn('[Sahabat Mahasiswa] Gagal inisialisasi Supabase, beralih ke localStorage:', err);
      supabaseInstance = null;
    }
  } else {
    // Mode offline / fallback localStorage aktif
    console.info('[Sahabat Mahasiswa] Berjalan dalam mode LocalStorage Fallback (Kredensial belum diisi atau offline).');
  }
  return supabaseInstance;
}

// ----------------------------------------------------------------------------
// 4. API TERPADU (SM BACKEND)
// ----------------------------------------------------------------------------
const smBackend = {
  config: SUPABASE_CONFIG,

  /**
   * Cek apakah Supabase aktif digunakan atau dalam fallback localStorage
   */
  isSupabaseActive() {
    return Boolean(supabaseInstance && checkIsConfigured());
  },

  /**
   * Mengambil instance mentah Supabase jika perlu query kustom
   */
  getClient() {
    return initSupabase();
  },

  /**
   * Mengambil data pengguna aktif saat ini (tersinkronisasi)
   */
  async getCurrentUser() {
    const sb = initSupabase();

    // 1. Coba dari Supabase jika aktif
    if (sb && this.isSupabaseActive()) {
      try {
        const { data: { user }, error } = await sb.auth.getUser();
        if (user && !error) {
          // Ambil detail profil dari tabel profiles
          const { data: profile } = await sb
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          const combined = {
            id: user.id,
            email: user.email,
            nama: (profile && profile.nama) || user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.nama || user.email.split('@')[0],
            kampus: (profile && profile.kampus) || user.user_metadata?.kampus || 'Mahasiswa Indonesia',
            fakultas: (profile && profile.fakultas) || '',
            jurusan: (profile && profile.jurusan) || '',
            jur: (profile && profile.jurusan) || '',
            telp: (profile && profile.telp) || '',
            avatar: (profile && profile.avatar_url) || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            provider: user.app_metadata?.provider || 'google'
          };

          // Sinkronkan ke localStorage cache agar halaman lain cepat membacanya
          smStorage.set('sm_sesi', combined.email);
          this._syncToLocalUsers(combined);
          return combined;
        }
      } catch (e) {
        console.warn('[smBackend] Gagal memuat user dari Supabase, membaca dari local:', e);
      }
    }

    // 2. Fallback: Ambil dari localStorage
    const activeEmail = smStorage.get('sm_sesi', null);
    if (!activeEmail) return null;

    const users = smStorage.get('sm_users', []);
    const localUser = users.find(u => u.email === activeEmail);
    if (localUser) {
      return {
        ...localUser,
        jurusan: localUser.jurusan || localUser.jur || '',
        jur: localUser.jurusan || localUser.jur || ''
      };
    }

    // Fallback darurat jika ada sesi tapi tidak ada di sm_users
    return {
      email: activeEmail,
      nama: activeEmail.split('@')[0],
      kampus: 'Mahasiswa Indonesia',
      jurusan: '',
      jur: '',
      avatar: '',
      provider: 'email'
    };
  },

  /**
   * Helper internal: sinkronkan data profil ke daftar sm_users lokal
   */
  _syncToLocalUsers(userData) {
    if (!userData || !userData.email) return;
    const users = smStorage.get('sm_users', []);
    const idx = users.findIndex(u => u.email === userData.email);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...userData };
    } else {
      users.push(userData);
    }
    smStorage.set('sm_users', users);
  },

  /**
   * Pendaftaran akun baru (Sign Up)
   */
  async signUp({ email, password, nama, kampus, jurusan = '', avatar = '' }) {
    const sb = initSupabase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanNama = nama.trim();

    // 1. Coba lewat Supabase jika aktif
    if (sb && this.isSupabaseActive()) {
      try {
        const { data, error } = await sb.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              nama: cleanNama,
              kampus: kampus || 'Mahasiswa Indonesia',
              jurusan,
              avatar_url: avatar
            }
          }
        });

        if (error) throw error;

        // Buat record profil di tabel profiles jika trigger belum jalan
        if (data.user) {
          await sb.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            nama: cleanNama,
            kampus: kampus || 'Mahasiswa Indonesia',
            jurusan,
            avatar_url: avatar
          }).catch(() => { });
        }

        const newUser = {
          id: data.user ? data.user.id : null,
          email: cleanEmail,
          nama: cleanNama,
          kampus: kampus || 'Mahasiswa Indonesia',
          jurusan,
          jur: jurusan,
          avatar,
          provider: 'supabase',
          createdAt: new Date().toISOString()
        };

        smStorage.set('sm_sesi', cleanEmail);
        this._syncToLocalUsers(newUser);

        return { success: true, user: newUser, message: 'Pendaftaran berhasil melalui Supabase!' };
      } catch (err) {
        console.warn('[smBackend] Supabase signUp gagal, beralih ke LocalStorage:', err.message);
        // Jika error karena kredensial salah atau koneksi, lanjut fallback ke local
        if (err.message && !err.message.includes('already registered')) {
          // Fallback lokal
        } else {
          return { success: false, error: err.message };
        }
      }
    }

    // 2. Mode Fallback LocalStorage
    const users = smStorage.get('sm_users', []);
    if (users.some(u => u.email === cleanEmail)) {
      return { success: false, error: 'Email ini sudah terdaftar. Silakan masuk.' };
    }

    const hashed = await hashPassword(password);
    const newUser = {
      email: cleanEmail,
      nama: cleanNama,
      hash: hashed,
      kampus: kampus || 'Mahasiswa Indonesia',
      jurusan,
      jur: jurusan,
      avatar,
      provider: 'email',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    smStorage.set('sm_users', users);
    smStorage.set('sm_sesi', cleanEmail);

    return { success: true, user: newUser, message: 'Pendaftaran berhasil (Mode Offline/Lokal)!' };
  },

  /**
   * Masuk akun (Sign In)
   */
  async signIn({ email, password }) {
    const sb = initSupabase();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Coba lewat Supabase jika aktif
    if (sb && this.isSupabaseActive()) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error) throw error;

        // Ambil profil
        const userObj = await this.getCurrentUser();
        smStorage.set('sm_sesi', cleanEmail);

        return { success: true, user: userObj, message: 'Berhasil masuk melalui Supabase!' };
      } catch (err) {
        console.warn('[smBackend] Supabase signIn error:', err.message);
        // Jika gagal koneksi/offline, coba fallback ke akun lokal yang mungkin pernah disimpan
        if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
          // Lanjut ke fallback
        } else {
          return { success: false, error: err.message };
        }
      }
    }

    // 2. Mode Fallback LocalStorage
    const users = smStorage.get('sm_users', []);
    const userFound = users.find(u => u.email === cleanEmail);

    if (!userFound) {
      return { success: false, error: 'Email atau password tidak cocok.' };
    }

    const inputHash = await hashPassword(password);
    if (userFound.hash && userFound.hash !== inputHash) {
      return { success: false, error: 'Password yang dimasukkan salah.' };
    }

    smStorage.set('sm_sesi', cleanEmail);
    return { success: true, user: userFound, message: 'Berhasil masuk (Mode Offline/Lokal)!' };
  },

  /**
   * Login dengan Akun Google via Supabase OAuth Resmi
   */
  async signInWithGoogle() {
    const sb = initSupabase();
    if (!sb) {
      return { success: false, error: 'Supabase client belum terinisialisasi.' };
    }
    
    // Tangani redirect URL (jika dibuka dari file:// atau APK)
    let redirectUrl = window.location.href.split('#')[0].split('?')[0];
    if (redirectUrl.endsWith('login.html')) {
      redirectUrl = redirectUrl.replace('login.html', 'index.html');
    } else {
      redirectUrl = window.location.origin + '/index.html';
    }

    try {
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        console.warn('[Supabase Google Auth Error]:', error);
        return { success: false, error: error.message };
      }

      if (data && data.url) {
        // Jika di dalam WebView Android APK, buka dengan browser eksternal
        if (window.navigator.userAgent.includes('wv') || window.location.protocol === 'file:') {
          window.open(data.url, '_system');
        } else {
          window.location.href = data.url;
        }
        return { success: true, url: data.url };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Keluar Akun (Sign Out)
   */
  async signOut() {
    const sb = initSupabase();
    if (sb && this.isSupabaseActive()) {
      try {
        await sb.auth.signOut();
      } catch (e) {
        console.warn('[smBackend] Supabase signOut warning:', e);
      }
    }
    smStorage.set('sm_sesi', null);
    return { success: true };
  },

  /**
   * Perbarui Profil Akun
   */
  async updateProfile(profileData) {
    const sb = initSupabase();
    const currentEmail = smStorage.get('sm_sesi', null);

    if (!currentEmail) {
      return { success: false, error: 'Tidak ada sesi aktif.' };
    }

    // 1. Update ke Supabase jika aktif
    if (sb && this.isSupabaseActive()) {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          const updatePayload = {
            nama: profileData.nama,
            kampus: profileData.kampus,
            jurusan: profileData.jurusan || profileData.jur || '',
            telp: profileData.telp || '',
            avatar_url: profileData.avatar || profileData.avatar_url || ''
          };

          const { error } = await sb
            .from('profiles')
            .upsert({ id: user.id, email: user.email, ...updatePayload });

          if (error) console.warn('[smBackend] Gagal upsert profiles Supabase:', error);
        }
      } catch (err) {
        console.warn('[smBackend] Supabase updateProfile warning:', err);
      }
    }

    // 2. Selalu update ke localStorage agar konsisten
    const users = smStorage.get('sm_users', []);
    const idx = users.findIndex(u => u.email === currentEmail);
    let updatedObj = null;

    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        ...profileData,
        jur: profileData.jurusan || profileData.jur || users[idx].jur || '',
        jurusan: profileData.jurusan || profileData.jur || users[idx].jurusan || ''
      };
      updatedObj = users[idx];
    } else {
      updatedObj = {
        email: currentEmail,
        ...profileData,
        jur: profileData.jurusan || profileData.jur || '',
        jurusan: profileData.jurusan || profileData.jur || ''
      };
      users.push(updatedObj);
    }

    smStorage.set('sm_users', users);
    return { success: true, user: updatedObj, message: 'Profil berhasil diperbarui!' };
  },

  /**
   * Ambil data kosan (Coba dari tabel Supabase 'kosan', fallback ke data default)
   */
  async getKosan(defaultKosan = []) {
    const sb = initSupabase();

    if (sb && this.isSupabaseActive()) {
      try {
        const { data, error } = await sb
          .from('kosan')
          .select('*')
          .order('id', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(item => ({
            id: item.id,
            nama: item.nama,
            area: item.area,
            harga: Number(item.harga),
            jarak: 0.5,
            lat: Number(item.lat),
            lng: Number(item.lng),
            telp: item.telp || '6281234567890',
            fas: item.fasilitas || ['Wi-Fi', 'Kamar mandi'],
            foto_url: item.foto_url
          }));
        }
      } catch (e) {
        console.warn('[smBackend] Gagal mengambil kosan dari Supabase:', e);
      }
    }

    return defaultKosan;
  }
};

// Pasang ke window object agar bisa diakses langsung oleh semua script halaman
window.smBackend = smBackend;

// Coba inisialisasi awal saat script dimuat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSupabase());
} else {
  initSupabase();
}
