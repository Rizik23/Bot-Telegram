const fs = require('fs')
const saldoPath = './src/saldo.json'
let db_saldo = {}

if (fs.existsSync(saldoPath)) {
  db_saldo = JSON.parse(fs.readFileSync(saldoPath))
}

function addSaldo(id, amount) {
  db_saldo[id] = (db_saldo[id] || 0) + amount
  fs.writeFileSync(saldoPath, JSON.stringify(db_saldo, null, 2))
}

function cekSaldo(id) {
  return db_saldo[id] || 0
}

function toRupiah(nominal) {
  return nominal.toLocaleString('id-ID')
}

function getWaktuWIB() {
  const now = new Date()
  return now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })
}

module.exports = { addSaldo, cekSaldo, toRupiah, getWaktuWIB }