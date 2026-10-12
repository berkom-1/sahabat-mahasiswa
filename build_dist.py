"""
Script Build Distribusi Sahabat Mahasiswa
Menghasilkan:
1. dist/Sahabat-Mahasiswa-Setup.exe (Standalone Windows Installer & Launcher mandiri)
2. dist/Sahabat-Mahasiswa-Windows-x64.zip (Arsip zip siap pakai)
3. dist/Sahabat-Mahasiswa.apk (Android APK bertanda tangan resmi v2 & v3)
"""

import os
import sys
import shutil
import zipfile
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
WIN_SRC_DIR = os.path.join(BASE_DIR, 'SahabatMahasiswa-Windows')
CSC_PATH = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'

os.makedirs(DIST_DIR, exist_ok=True)

# 1. Sinkronisasi aset web terbaru ke SahabatMahasiswa-Windows/resources/app
print('=== 1. Sinkronisasi aset aplikasi desktop ===')
app_dir = os.path.join(WIN_SRC_DIR, 'resources', 'app')
os.makedirs(app_dir, exist_ok=True)
sync_files = ['index.html', 'login.html', 'pengaturan.html', 'supabase-client.js', 'preload.js', 'main.js', 'manifest.json', 'package.json']
for f in sync_files:
    src = os.path.join(BASE_DIR, f)
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(app_dir, f))
        print(f'Synced: {f}')

# Sync assets folder
assets_src = os.path.join(BASE_DIR, 'assets')
assets_dst = os.path.join(app_dir, 'assets')
if os.path.exists(assets_src):
    shutil.copytree(assets_src, assets_dst, dirs_exist_ok=True)
    print('Synced: assets/')

# 2. Buat ZIP Payload untuk Windows
print('\n=== 2. Membuat paket ZIP distribusi Windows ===')
zip_path = os.path.join(DIST_DIR, 'Sahabat-Mahasiswa-Windows-x64.zip')
with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for root, dirs, files in os.walk(WIN_SRC_DIR):
        for f in files:
            full_path = os.path.join(root, f)
            arcname = os.path.relpath(full_path, WIN_SRC_DIR)
            zf.write(full_path, arcname)

print(f'Selesai membuat ZIP: {zip_path} ({os.path.getsize(zip_path)} bytes)')

# 3. Kompilasi C# Standalone Installer & Launcher (.exe)
print('\n=== 3. Mengompilasi C# Standalone Installer & Launcher (.exe) ===')
cs_installer_src = os.path.join(BASE_DIR, 'Installer.cs')
with open(cs_installer_src, 'w', encoding='utf-8') as f:
    f.write('''using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Threading;

namespace SahabatMahasiswaInstaller
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string installDir = Path.Combine(localAppData, "Programs", "SahabatMahasiswa");
            string mainExe = Path.Combine(installDir, "SahabatMahasiswa.exe");

            bool isPortable = false;
            bool forceReinstall = false;
            foreach (string arg in args)
            {
                if (arg.Equals("--portable", StringComparison.OrdinalIgnoreCase)) isPortable = true;
                if (arg.Equals("--reinstall", StringComparison.OrdinalIgnoreCase)) forceReinstall = true;
            }

            if (isPortable)
            {
                string tempDir = Path.Combine(Path.GetTempPath(), "SahabatMahasiswa");
                RunInstallAndLaunch(tempDir, true);
                return;
            }

            // Jika sudah terpasang dan executable ditemukan, langsung jalankan tanpa dialog ekstra
            if (File.Exists(mainExe) && !forceReinstall)
            {
                try
                {
                    Process.Start(new ProcessStartInfo(mainExe) { WorkingDirectory = installDir });
                    return;
                }
                catch {}
            }

            // Jika belum ada atau diminta reinstall, jalankan installer GUI
            RunInstallAndLaunch(installDir, false);
        }

        static void RunInstallAndLaunch(string targetDir, bool isPortable)
        {
            Form form = new Form();
            form.Text = "Sahabat Mahasiswa - Menyiapkan Aplikasi";
            form.FormBorderStyle = FormBorderStyle.FixedDialog;
            form.MaximizeBox = false;
            form.MinimizeBox = false;
            form.StartPosition = FormStartPosition.CenterScreen;
            form.Size = new Size(460, 180);
            form.BackColor = Color.FromArgb(248, 250, 252);

            Label titleLabel = new Label();
            titleLabel.Text = "Sahabat Mahasiswa";
            titleLabel.Font = new Font("Segoe UI", 13, FontStyle.Bold);
            titleLabel.ForeColor = Color.FromArgb(15, 23, 42);
            titleLabel.Location = new Point(24, 18);
            titleLabel.Size = new Size(400, 30);
            form.Controls.Add(titleLabel);

            Label statusLabel = new Label();
            statusLabel.Text = "Menyiapkan berkas aplikasi mandiri...";
            statusLabel.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            statusLabel.ForeColor = Color.FromArgb(100, 116, 139);
            statusLabel.Location = new Point(24, 52);
            statusLabel.Size = new Size(400, 22);
            form.Controls.Add(statusLabel);

            ProgressBar progressBar = new ProgressBar();
            progressBar.Style = ProgressBarStyle.Marquee;
            progressBar.MarqueeAnimationSpeed = 30;
            progressBar.Location = new Point(24, 82);
            progressBar.Size = new Size(396, 22);
            form.Controls.Add(progressBar);

            form.Shown += (s, e) =>
            {
                Thread worker = new Thread(() =>
                {
                    try
                    {
                        if (!Directory.Exists(targetDir))
                        {
                            Directory.CreateDirectory(targetDir);
                        }

                        var asm = Assembly.GetExecutingAssembly();
                        using (var stream = asm.GetManifestResourceStream("Sahabat-Mahasiswa-Windows-x64.zip"))
                        {
                            if (stream == null)
                            {
                                MessageBox.Show("Gagal menemukan data aplikasi yang disematkan.", "Kesalahan", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                return;
                            }

                            using (var archive = new ZipArchive(stream))
                            {
                                int total = archive.Entries.Count;
                                int count = 0;

                                foreach (var entry in archive.Entries)
                                {
                                    count++;
                                    string outPath = Path.Combine(targetDir, entry.FullName);
                                    if (string.IsNullOrEmpty(entry.Name))
                                    {
                                        Directory.CreateDirectory(outPath);
                                        continue;
                                    }

                                    string dir = Path.GetDirectoryName(outPath);
                                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

                                    // Extract berkas
                                    try
                                    {
                                        entry.ExtractToFile(outPath, true);
                                    }
                                    catch {}
                                }
                            }
                        }

                        if (!isPortable)
                        {
                            // Buat shortcut Desktop dan Start Menu
                            CreateShortcuts(targetDir);
                        }

                        string mainExe = Path.Combine(targetDir, "SahabatMahasiswa.exe");
                        if (File.Exists(mainExe))
                        {
                            Process.Start(new ProcessStartInfo(mainExe) { WorkingDirectory = targetDir });
                        }

                        form.Invoke((MethodInvoker)(() => form.Close()));
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Terjadi kendala saat menyiapkan aplikasi: " + ex.Message, "Peringatan", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        form.Invoke((MethodInvoker)(() => form.Close()));
                    }
                });
                worker.IsBackground = true;
                worker.Start();
            };

            Application.Run(form);
        }

        static void CreateShortcuts(string targetDir)
        {
            try
            {
                string exePath = Path.Combine(targetDir, "SahabatMahasiswa.exe");
                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string startMenuPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");

                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null)
                {
                    dynamic shell = Activator.CreateInstance(shellType);

                    // Shortcut Desktop
                    string desktopLnk = Path.Combine(desktopPath, "Sahabat Mahasiswa.lnk");
                    dynamic link1 = shell.CreateShortcut(desktopLnk);
                    link1.TargetPath = exePath;
                    link1.WorkingDirectory = targetDir;
                    link1.Description = "Sahabat Mahasiswa - Asisten & Portal Akademik";
                    link1.Save();

                    // Shortcut Start Menu
                    string startLnk = Path.Combine(startMenuPath, "Sahabat Mahasiswa.lnk");
                    dynamic link2 = shell.CreateShortcut(startLnk);
                    link2.TargetPath = exePath;
                    link2.WorkingDirectory = targetDir;
                    link2.Description = "Sahabat Mahasiswa - Asisten & Portal Akademik";
                    link2.Save();
                }
            }
            catch {}
        }
    }
}
''')

# Compile Sahabat-Mahasiswa-Setup.exe
setup_exe = os.path.join(DIST_DIR, 'Sahabat-Mahasiswa-Setup.exe')
print(f'Compiling {setup_exe}...')
subprocess.run([
    CSC_PATH,
    '/target:winexe',
    '/platform:x64',
    '/r:System.dll',
    '/r:System.Drawing.dll',
    '/r:System.Windows.Forms.dll',
    '/r:System.IO.Compression.dll',
    '/r:System.IO.Compression.FileSystem.dll',
    f'/resource:{zip_path}',
    f'/out:{setup_exe}',
    cs_installer_src
], check=True)

# Also create dist/Sahabat-Mahasiswa.exe as a direct standalone launcher
standalone_exe = os.path.join(DIST_DIR, 'Sahabat-Mahasiswa.exe')
shutil.copy2(setup_exe, standalone_exe)
print(f'Setup & Standalone EXE generated: {setup_exe} ({os.path.getsize(setup_exe)} bytes)')

# Clean up temporary C# source
if os.path.exists(cs_installer_src):
    os.remove(cs_installer_src)

# 4. Build Android APK
print('\n=== 4. Membangun Android APK bertanda tangan ===')
subprocess.run([sys.executable, os.path.join(BASE_DIR, 'build_apk.py')], check=True)
apk_src = os.path.join(BASE_DIR, 'Sahabat-Mahasiswa.apk')
apk_dst = os.path.join(DIST_DIR, 'Sahabat-Mahasiswa.apk')
if os.path.exists(apk_src):
    shutil.copy2(apk_src, apk_dst)
    print(f'Copied APK to dist/: {apk_dst} ({os.path.getsize(apk_dst)} bytes)')

print('\n=== SEMUA TUGAS BUILD SELESAI DENGAN SUKSES! ===')
for item in os.listdir(DIST_DIR):
    item_path = os.path.join(DIST_DIR, item)
    print(f'- {item} : {os.path.getsize(item_path):,} bytes')
