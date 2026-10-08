const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./backend/pos.db');

db.all('SELECT id, name, stock, variants FROM products LIMIT 20', (e, rows) => {
  if (e) throw e;
  rows.forEach((r) => {
    let v = null;
    try {
      v = r.variants ? JSON.parse(r.variants) : null;
    } catch {
      v = 'PARSE_ERR';
    }
    const variantSum = Array.isArray(v)
      ? v.reduce((acc, x) => acc + (Number(x.stock) || 0), 0)
      : null;
    console.log({
      id: r.id,
      name: r.name,
      stock: r.stock,
      hasVariants: Array.isArray(v) ? v.length : v,
      variantSum,
      posWouldShow: Array.isArray(v) && v.length >= 0 && v ? variantSum : r.stock,
      // bug case: empty array is truthy
      buggyTernary: v ? (Array.isArray(v) ? variantSum : 0) : r.stock,
    });
  });
  db.close();
});
