// scripts/test-db.mjs
import mysql from 'mysql2/promise';

async function testConnection() {
  console.log('Testing MySQL connection and data retrieval...');
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'sahabat_mahasiswa',
  });

  const [users] = await pool.query('SELECT id, name, email, kampus FROM users');
  console.log('Users in MySQL:', users);

  const [kosan] = await pool.query('SELECT id, nama, tipe, harga, area, lat, lng FROM kosan LIMIT 3');
  console.log('Kosan from View:', kosan);

  const [tugas] = await pool.query('SELECT id, nama_tugas, deadline, bobot, selesai FROM tugas LIMIT 3');
  console.log('Tugas from View:', tugas);

  const [transaksi] = await pool.query('SELECT id, jenis, kategori, nominal, tanggal FROM transaksi LIMIT 3');
  console.log('Transaksi from View:', transaksi);

  await pool.end();
  console.log('All MySQL tests PASSED!');
}

testConnection().catch(console.error);
