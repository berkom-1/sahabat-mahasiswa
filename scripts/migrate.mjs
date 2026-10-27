// scripts/migrate.mjs
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sahabat_mahasiswa',
};

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbConfig.database, table, column]
  );
  return rows[0].count > 0;
}

async function addColumnIfNotExists(conn, table, column, definition) {
  const exists = await columnExists(conn, table, column);
  if (!exists) {
    console.log(`Adding column ${column} to table ${table}...`);
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } else {
    console.log(`Column ${table}.${column} already exists.`);
  }
}

async function runMigration() {
  console.log('Connecting to MySQL at', dbConfig.host, dbConfig.port, 'db:', dbConfig.database);
  const conn = await mysql.createConnection(dbConfig);
  console.log('Connected to MySQL successfully!');

  // 1. Ensure columns in `users`
  await addColumnIfNotExists(conn, 'users', 'kampus', "VARCHAR(255) DEFAULT 'Universitas Siliwangi (UNSIL)'");
  await addColumnIfNotExists(conn, 'users', 'fakultas', "VARCHAR(255) DEFAULT ''");
  await addColumnIfNotExists(conn, 'users', 'jurusan', "VARCHAR(255) DEFAULT 'Informatika'");
  await addColumnIfNotExists(conn, 'users', 'semester', 'INT DEFAULT 1');
  await addColumnIfNotExists(conn, 'users', 'telp', "VARCHAR(50) DEFAULT ''");
  await addColumnIfNotExists(conn, 'users', 'avatar_url', 'LONGTEXT DEFAULT NULL');
  await addColumnIfNotExists(conn, 'users', 'student_email', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists(conn, 'users', 'student_verified', 'TINYINT(1) DEFAULT 0');
  await addColumnIfNotExists(conn, 'users', 'google_email', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists(conn, 'users', 'google_linked', 'TINYINT(1) DEFAULT 0');
  await addColumnIfNotExists(conn, 'users', 'tiktok_client_key', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists(conn, 'users', 'tiktok_access_token', 'TEXT DEFAULT NULL');

  // 2. Ensure columns in `kos`
  await addColumnIfNotExists(conn, 'kos', 'lat', 'DECIMAL(10, 7) DEFAULT -7.3512000');
  await addColumnIfNotExists(conn, 'kos', 'lng', 'DECIMAL(10, 7) DEFAULT 108.2234000');
  await addColumnIfNotExists(conn, 'kos', 'rating', 'DECIMAL(2, 1) DEFAULT 4.8');
  await addColumnIfNotExists(conn, 'kos', 'sisa_kamar', 'INT DEFAULT 3');

  // Update sample kos coordinates for accurate UNSIL distances
  await conn.query(`
    UPDATE \`kos\` SET 
      lat = CASE 
        WHEN id = 1 THEN -7.3522000
        WHEN id = 2 THEN -7.3565000
        WHEN id = 3 THEN -7.3489000
        WHEN id = 4 THEN -7.3541000
        WHEN id = 5 THEN -7.3475000
        WHEN id = 6 THEN -7.3582000
        ELSE -7.3512000
      END,
      lng = CASE 
        WHEN id = 1 THEN 108.2241000
        WHEN id = 2 THEN 108.2285000
        WHEN id = 3 THEN 108.2212000
        WHEN id = 4 THEN 108.2263000
        WHEN id = 5 THEN 108.2201000
        WHEN id = 6 THEN 108.2310000
        ELSE 108.2234000
      END
    WHERE id BETWEEN 1 AND 6;
  `);
  console.log('Updated coordinates for kos table.');

  // 3. Ensure a demo user with known password exists
  // Password: 'password123'
  const demoEmail = 'mahasiswa@unsil.ac.id';
  const hashedDemoPassword = await bcrypt.hash('password123', 10);
  const [existingUser] = await conn.query('SELECT id FROM users WHERE email = ?', [demoEmail]);
  if (existingUser.length > 0) {
    await conn.query(
      `UPDATE users SET 
        password = ?,
        kampus = 'Universitas Siliwangi (UNSIL)',
        jurusan = 'Informatika',
        student_email = ?,
        student_verified = 1
       WHERE email = ?`,
      [hashedDemoPassword, demoEmail, demoEmail]
    );
    console.log(`Updated demo user password for ${demoEmail} (password: password123)`);
  } else {
    await conn.query(
      `INSERT INTO users (name, email, password, kampus, jurusan, student_email, student_verified, created_at, updated_at)
       VALUES (?, ?, ?, 'Universitas Siliwangi (UNSIL)', 'Informatika', ?, 1, NOW(), NOW())`,
      ['Rizky Ramadhan (Mahasiswa UNSIL)', demoEmail, hashedDemoPassword, demoEmail]
    );
    console.log(`Created demo user ${demoEmail} (password: password123)`);
  }

  // 4. Create compatibility views
  console.log('Creating database compatibility views...');

  // View `profiles`
  await conn.query(`
    CREATE OR REPLACE VIEW profiles AS
    SELECT 
      id,
      email,
      name AS nama,
      kampus,
      fakultas,
      jurusan,
      semester,
      telp,
      avatar_url,
      student_email,
      student_verified,
      google_email,
      google_linked,
      tiktok_client_key,
      tiktok_access_token,
      created_at,
      updated_at
    FROM users;
  `);

  // View `tugas`
  await conn.query(`
    CREATE OR REPLACE VIEW tugas AS
    SELECT 
      id,
      user_id,
      title AS nama_tugas,
      due_date AS deadline,
      CASE 
        WHEN weight = 'rendah' THEN 1
        WHEN weight = 'tinggi' THEN 3
        ELSE 2
      END AS bobot,
      (status = 'completed') AS selesai,
      created_at,
      updated_at
    FROM assignment_deadlines;
  `);

  // View `transaksi`
  await conn.query(`
    CREATE OR REPLACE VIEW transaksi AS
    SELECT 
      id,
      user_id,
      CASE 
        WHEN type = 'income' THEN 'masuk'
        ELSE 'keluar'
      END AS jenis,
      category AS kategori,
      amount AS nominal,
      description AS catatan,
      transaction_date AS tanggal,
      created_at,
      updated_at
    FROM wallet_transactions;
  `);

  // View `kosan`
  await conn.query(`
    CREATE OR REPLACE VIEW kosan AS
    SELECT 
      id,
      name AS nama,
      slug,
      gender_type AS tipe,
      price_per_month AS harga,
      address AS alamat,
      city AS kota,
      campus_name AS area,
      distance_km AS jarak,
      contact_phone AS telp,
      image_url AS foto_url,
      facilities AS fasilitas,
      is_available,
      description AS deskripsi,
      lat,
      lng,
      rating,
      sisa_kamar,
      created_at,
      updated_at
    FROM kos;
  `);

  console.log('Migration completed successfully!');
  await conn.end();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
