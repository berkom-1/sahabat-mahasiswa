import zipfile
import tempfile
import os
import hashlib
import zlib
import struct
import shutil
from pathlib import Path
from sign_apk.signer import sign_apk
from sign_apk.keys import generate_debug_key
from sign_apk.verify import verify_apk

def build():
    src_apk = os.path.join(tempfile.gettempdir(), 'bishwas_webview.apk')
    unsigned_apk = os.path.join(tempfile.gettempdir(), 'sahabat_unsigned.apk')
    proj_dir = Path(r'C:\Users\farre\Documents\SAHABAT MAHASISWA')
    final_apk = proj_dir / 'Sahabat-Mahasiswa.apk'

    print('1. Reading base APK...')
    with zipfile.ZipFile(src_apk, 'r') as zin:
        dex = bytearray(zin.read('classes.dex'))
        arsc = bytearray(zin.read('resources.arsc'))
        all_entries = {}
        for item in zin.infolist():
            if not item.filename.startswith('META-INF/'):
                all_entries[item.filename] = zin.read(item.filename)

    # 2. Patch DEX: redirect base URL to local index.htm
    old_url = b'https://github.com/bishwassagar'
    new_url = b'file:///android_asset/index.htm'
    assert len(old_url) == len(new_url) == 31
    assert old_url in dex, 'old_url not found in classes.dex'
    
    idx = dex.find(old_url)
    print(f'Patching URL in classes.dex at offset {idx}...')
    dex[idx:idx+31] = new_url

    # Patch shouldOverrideUrlLoading di classes.dex agar WebView tidak membajak URL eksternal / Google OAuth
    url_override_bytes = b'\x72\x10\xee\x0a\x02\x00\x0c\x00\x6e\x10\x07\x07\x00\x00\x0c\x00\x6e\x20\xf4\x0a\x01\x00\x12\x10\x0f\x00'
    if url_override_bytes in dex:
        override_idx = dex.find(url_override_bytes)
        print(f'Patching shouldOverrideUrlLoading at offset {override_idx} to allow Google OAuth / system intents...')
        dex[override_idx:override_idx+len(url_override_bytes)] = b'\x12\x00\x0f\x00' + b'\x00' * 22

    # Recompute DEX SHA-1 and Adler32 checksums
    dex[12:32] = hashlib.sha1(dex[32:]).digest()
    adler = zlib.adler32(dex[12:]) & 0xffffffff
    dex[8:12] = struct.pack('<I', adler)
    all_entries['classes.dex'] = bytes(dex)

    # 3. Patch app title in ARSC string pool
    old_title = b'My Application'
    new_title = b'Sahabat Mhs   '
    assert len(old_title) == len(new_title) == 14
    if old_title in arsc:
        pos = arsc.find(old_title)
        print(f'Patching app title in resources.arsc at offset {pos}...')
        arsc[pos:pos+14] = new_title
        all_entries['resources.arsc'] = bytes(arsc)

    # 4. Redirect helper
    redirect_html = (
        b'<!DOCTYPE html>\n'
        b'<html>\n'
        b'<head>\n'
        b'  <meta charset="utf-8">\n'
        b'  <meta http-equiv="refresh" content="0; url=index.html">\n'
        b'  <script>window.location.replace("index.html");</script>\n'
        b'</head>\n'
        b'<body></body>\n'
        b'</html>\n'
    )
    all_entries['assets/index.htm'] = redirect_html
    all_entries['assets/offline.html'] = redirect_html

    # 5. Pack all web assets from project directory
    ignore_names = {'SahabatMahasiswa-Windows', '.git', 'build-test', 'dist', 'build_apk.py', 'main.js', 'package.json'}
    for root, dirs, files in os.walk(proj_dir):
        # filter dirs in place
        dirs[:] = [d for d in dirs if d not in ignore_names]
        rel_root = os.path.relpath(root, proj_dir)
        for file in files:
            if file.endswith(('.apk', '.zip', '.exe', '.py')):
                continue
            full_path = os.path.join(root, file)
            rel_file = file if rel_root == '.' else os.path.join(rel_root, file)
            rel_file_clean = rel_file.replace('\\', '/')
            asset_target = f'assets/{rel_file_clean}'
            print(f'Adding to APK: {asset_target}')
            with open(full_path, 'rb') as f:
                all_entries[asset_target] = f.read()

    print(f'Total files to pack in APK: {len(all_entries)}')

    # 6. Write unsigned zip
    print('Writing unsigned APK...')
    with zipfile.ZipFile(unsigned_apk, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for name, data in all_entries.items():
            zinfo = zipfile.ZipInfo(name)
            # Android requires resources.arsc to be stored uncompressed (ZIP_STORED)
            if name == 'resources.arsc':
                zinfo.compress_type = zipfile.ZIP_STORED
            else:
                zinfo.compress_type = zipfile.ZIP_DEFLATED
            zout.writestr(zinfo, data)

    # 7. Sign APK
    print('Signing APK with v2 & v3 signature scheme...')
    key = generate_debug_key()
    res = sign_apk(unsigned_apk, str(final_apk), key, v2=True, v3=True)
    print('Sign result:', res)

    # 8. Verify
    ver = verify_apk(str(final_apk))
    print('Verification:', ver)
    print(f'SUCCESS: Generated {final_apk} (Size: {os.path.getsize(final_apk)} bytes)')

if __name__ == '__main__':
    build()
