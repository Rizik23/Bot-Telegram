#!/bin/bash

# ==================================================
# RUN MEMAKAI VPS LEWAT TERMUX / TERMIUS
# ==================================================

# ---------- UPDATE & INSTALL SSH (TERMUX) ----------
pkg update -y && pkg upgrade -y
pkg install -y openssh


# ---------- MASUK KE VPS ----------
ssh root@178.128.117.9
# Password: undefined8VCPU16GBAMD


# ---------- INSTALL NODE.JS DI VPS ----------
apt update -y && apt upgrade -y
apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs


# ↑ HARUS KELUAR DULU DARI VPS
# KETIK: CTRL + D


# ---------- UPLOAD FILE BOT KE VPS (DARI TERMUX) ----------
scp -r /storage/emulated/0/Download/elikamd root@178.128.117.9:/root/
# Password: undefined8VCPU16GBAMD


# ---------- MASUK VPS LAGI ----------
ssh root@178.128.117.9
# Password: undefined8VCPU16GBAMD


# ---------- MASUK FOLDER BOT ----------
cd /root/elikamd


# ---------- INSTALL DEPENDENCY ----------
npm install
npm i cheerio


# ---------- JALANKAN BOT ----------
node index.js


# ==================================================
# BIAR BOT NYALA TERUS (WAJIB)
# ==================================================
# Kalau sudah jalan, STOP dulu pakai:
# CTRL + C

npm i -g pm2
pm2 start index.js --name elikamd
pm2 save
pm2 logs elikamd


# ==================================================
# UNTUK MELIHAT INFO
# ==================================================

# Cek status
# pm2 list

# Melihat informasi
# pm2 show elikamd

# Lihat log (keluar CTRL + C)
# pm2 logs elikamd

# Restart kalau error
# pm2 restart elikamd

# Stop bot
# pm2 stop elikamd


# ==================================================
# UNTUK MENGHAPUS SEMUA FILE
# ==================================================

set -e

command -v pm2 >/dev/null 2>&1 && {
  pm2 stop all || true
  pm2 delete all || true
  pm2 save --force || true
} || true

pkill -f "node" 2>/dev/null || true

rm -rf /root/elikamd

npm -g ls pm2 >/dev/null 2>&1 && npm uninstall -g pm2 || true
rm -rf /root/.pm2

command -v npm >/dev/null 2>&1 && npm cache clean --force || true

apt remove -y nodejs || true
apt autoremove -y || true
apt autoclean -y || true

rm -f /etc/apt/sources.list.d/nodesource.list \
      /etc/apt/sources.list.d/nodesource.list.save 2>/dev/null || true
rm -f /usr/share/keyrings/nodesource.gpg 2>/dev/null || true

apt update -y || true

command -v node >/dev/null 2>&1 && node -v || true
command -v npm  >/dev/null 2>&1 && npm -v  || true
command -v pm2  >/dev/null 2>&1 && pm2 -v  || true

[ -d /root/elikamd ] && echo "MASIH ADA: /root/elikamd" || true
ps aux | grep node | grep -v grep || true