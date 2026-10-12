"""Extract official Debian virtual X server tools into a writable cloud directory.

Verifies the Debian signed InRelease, Packages SHA-256, and every .deb SHA-256.
Does not modify system directories or disable TLS/signature verification.
"""
import hashlib
import lzma
import os
from pathlib import Path
import re
import subprocess
import urllib.request

ROOT = Path('/workspace/.tools/langswitcher')
CACHE = Path('/workspace/.cache/langswitcher-debian')
ROOT.mkdir(parents=True, exist_ok=True)
CACHE.mkdir(parents=True, exist_ok=True)
os_release = Path('/etc/os-release').read_text()
match = re.search(r'^VERSION_CODENAME=(\w+)$', os_release, re.M)
if not match:
    raise RuntimeError('Debian VERSION_CODENAME required for this cloud-only helper')
codename = match.group(1)
if 'ID=debian' not in os_release:
    raise RuntimeError('This helper supports Debian cloud hosts only')
base = 'https://deb.debian.org/debian/'

def download(relative, target):
    with urllib.request.urlopen(base + relative, timeout=60) as response:
        data = response.read()
    target.write_bytes(data)
    return data

release_path = CACHE / 'InRelease'
download(f'dists/{codename}/InRelease', release_path)
authenticated = CACHE / 'authenticated-release.txt'
authenticated.unlink(missing_ok=True)
subprocess.run(['sqv', '--keyring', '/usr/share/keyrings/debian-archive-keyring.gpg', '--cleartext', '--output', str(authenticated), str(release_path)], check=True)
release = authenticated.read_text()
package_path = 'main/binary-amd64/Packages.xz'
checksum_section = release.split('SHA256:\n', 1)[1].split('\n\n', 1)[0]
entry = re.search(r'^\s+([0-9a-f]{64})\s+(\d+)\s+' + re.escape(package_path) + r'$', checksum_section, re.M)
if not entry:
    raise RuntimeError('Packages SHA-256 not found in signed release')
index = download(f'dists/{codename}/{package_path}', CACHE / 'Packages.xz')
if hashlib.sha256(index).hexdigest() != entry.group(1) or len(index) != int(entry.group(2)):
    raise RuntimeError('Packages checksum or size mismatch')
wanted = {'xvfb', 'libxfont2'}
found = set()
for paragraph in lzma.decompress(index).decode().split('\n\n'):
    if not paragraph.startswith('Package: '):
        continue
    fields = dict(line.split(': ', 1) for line in paragraph.splitlines() if ': ' in line and not line.startswith(' '))
    name = fields['Package']
    if name not in wanted:
        continue
    if not fields['Filename'].startswith('pool/'):
        raise RuntimeError('Unexpected package path')
    target = CACHE / Path(fields['Filename']).name
    data = target.read_bytes() if target.exists() else download(fields['Filename'], target)
    if hashlib.sha256(data).hexdigest() != fields['SHA256'] or len(data) != int(fields['Size']):
        raise RuntimeError(f'{name}: Debian package checksum or size mismatch')
    subprocess.run(['dpkg-deb', '-x', str(target), str(ROOT)], check=True)
    print(f'Verified and extracted {name} {fields["Version"]}', flush=True)
    found.add(name)
if found != wanted:
    raise RuntimeError(f'Missing required Debian packages: {wanted - found}')
print(f'Cloud tools ready under {ROOT}', flush=True)
