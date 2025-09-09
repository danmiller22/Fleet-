const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function uid(){ return Math.random().toString(36).slice(2,9); }

const seed = {
  trucks: [
    { id: uid(), plate: 'A123BC', make: 'Volvo',  model: 'FH16', year: 2019, mileage: 325000, status: 'Active' },
    { id: uid(), plate: 'K777KK', make: 'Scania', model: 'R500', year: 2021, mileage: 184200, status: 'Service' },
    { id: uid(), plate: 'M456OP', make: 'MAN',    model: 'TGX',  year: 2018, mileage: 560300, status: 'Repair' },
  ],
  trailers: [
    { id: uid(), code: 'TR-018', type: 'Curtainsider', capacity: 22, status: 'Active' },
    { id: uid(), code: 'TR-042', type: 'Refrigerated', capacity: 24, status: 'Service' },
    { id: uid(), code: 'TR-055', type: 'Flatbed',      capacity: 28, status: 'Active' },
  ],
  repairs: [
    { id: uid(), assetType: 'Truck',   assetId: 'A123BC', date: '2025-03-01', description: 'Oil change + front pads', cost: 230.50, status: 'Completed' },
    { id: uid(), assetType: 'Trailer', assetId: 'TR-042', date: '2025-03-11', description: 'Light wiring repair',     cost: 120.00, status: 'In progress' },
  ],
  expenses: [
    { id: uid(), category: 'Fuel',       amount: 320.45, date: '2025-03-13', notes: 'Card ••••4821, Driver: DO4' },
    { id: uid(), category: 'Tolls/Fees', amount:  45.70, date: '2025-03-14', notes: 'Toll #34' },
    { id: uid(), category: 'Parking',    amount: 210.00, date: '2025-03-10', notes: 'Night parking yard' },
  ],
};

function ensureDB(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
}

function loadDB(){
  try{
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  }catch(e){
    console.warn('DB read failed; re-seeding', e.message);
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return JSON.parse(JSON.stringify(seed));
  }
}

function saveDB(db){
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

module.exports = { DATA_DIR, DB_FILE, ensureDB, loadDB, saveDB, uid };

