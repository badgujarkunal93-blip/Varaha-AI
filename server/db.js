const fs = require('fs');
const path = require('path');
const { createSeedData } = require('./seed_demo_data');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // Check if database contains old Nashik data, if so migrate to Baramati Pune seeds
        if (parsed.farmers && parsed.farmers[0] && parsed.farmers[0].location.includes('Nashik')) {
          console.log('Migrating database to Baramati, Pune District seed dataset...');
          const fresh = createSeedData();
          this.save(fresh);
          return fresh;
        }
        const seed = createSeedData();
        const merged = { ...seed, ...parsed };
        // Ensure array tables from seed exist
        Object.keys(seed).forEach(k => {
          if (!merged[k] || !Array.isArray(merged[k]) || merged[k].length === 0) {
            merged[k] = seed[k];
          }
        });
        this.save(merged);
        return merged;
      } catch (err) {
        console.error('Error reading db.json, using defaults:', err.message);
        const fresh = createSeedData();
        this.save(fresh);
        return fresh;
      }
    }
    const fresh = createSeedData();
    this.save(fresh);
    return fresh;
  }

  save(data) {
    const payload = JSON.stringify(data || this.data, null, 2);
    try {
      fs.writeFileSync(DB_FILE, payload, 'utf8');
    } catch (err) {
      // Windows safe retry after 50ms if file locked
      setTimeout(() => {
        try {
          fs.writeFileSync(DB_FILE, payload, 'utf8');
        } catch (e) {
          console.warn('Database write retry error:', e.message);
        }
      }, 50);
    }
  }

  reset() {
    this.data = createSeedData();
    this.save();
    return this.data;
  }

  // Generic CRUD
  getAll(table) {
    return this.data[table] || [];
  }

  getById(table, id) {
    const list = this.getAll(table);
    return list.find(item => item.id === id) || null;
  }

  find(table, predicate) {
    const list = this.getAll(table);
    return list.filter(predicate);
  }

  insert(table, item) {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    const record = {
      id: item.id || `${table.substring(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: item.timestamp || new Date().toISOString(),
      ...item
    };
    this.data[table].unshift(record);
    this.save();
    return record;
  }

  update(table, id, updates) {
    if (!this.data[table]) return null;
    const index = this.data[table].findIndex(item => item.id === id);
    if (index === -1) return null;
    this.data[table][index] = {
      ...this.data[table][index],
      ...updates
    };
    this.save();
    return this.data[table][index];
  }

  delete(table, id) {
    if (!this.data[table]) return false;
    const index = this.data[table].findIndex(item => item.id === id);
    if (index === -1) return false;
    this.data[table].splice(index, 1);
    this.save();
    return true;
  }
}

const db = new Database();

module.exports = db;
