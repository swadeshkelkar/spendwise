const express = require('express');
const ExcelJS = require('exceljs');
const authMiddleware = require('../middleware/auth');
const { getDB } = require('../db/database');

const router = express.Router();
router.use(authMiddleware);

// ── Build filter WHERE clause ─────────────────────────────────────────────────
function buildFilters(query, userId) {
  const conditions = ['e.user_id = ?'];
  const params = [userId];

  if (query.category_id) {
    conditions.push('e.category_id = ?');
    params.push(query.category_id);
  }

  if (query.period) {
    const now = new Date();
    let start;
    if (query.period === 'week') {
      start = new Date(now); start.setDate(now.getDate() - 7);
    } else if (query.period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (query.period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    }
    if (start) {
      conditions.push("e.date >= ?");
      params.push(start.toISOString().split('T')[0]);
    }
  }

  if (query.start_date) { conditions.push('e.date >= ?'); params.push(query.start_date); }
  if (query.end_date)   { conditions.push('e.date <= ?'); params.push(query.end_date);   }
  if (query.month)      { conditions.push("strftime('%m', e.date) = ?"); params.push(query.month.padStart(2, '0')); }
  if (query.year)       { conditions.push("strftime('%Y', e.date) = ?"); params.push(String(query.year)); }

  return { where: conditions.join(' AND '), params };
}

// ── GET /api/expenses ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDB();
  const { where, params } = buildFilters(req.query, req.user.id);

  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) as count FROM expenses e WHERE ${where}`).get(...params);
  const expenses = db.prepare(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    WHERE ${where}
    ORDER BY e.date DESC, e.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ expenses, total: total.count, page, limit });
});

// ── GET /api/expenses/summary ─────────────────────────────────────────────────
router.get('/summary', (req, res) => {
  const db = getDB();
  const { where, params } = buildFilters(req.query, req.user.id);

  // Category breakdown for pie chart
  const byCategory = db.prepare(`
    SELECT c.name, c.icon, c.color, SUM(e.amount) as total, COUNT(*) as count
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    WHERE ${where}
    GROUP BY e.category_id
    ORDER BY total DESC
  `).all(...params);

  // Monthly trend (last 12 months)
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', e.date) as month, SUM(e.amount) as total
    FROM expenses e
    WHERE e.user_id = ?
    AND e.date >= date('now', '-12 months')
    GROUP BY month
    ORDER BY month ASC
  `).all(req.user.id);

  // Totals
  const totals = db.prepare(`
    SELECT 
      SUM(amount) as total,
      COUNT(*) as count,
      AVG(amount) as avg,
      MAX(amount) as max_expense
    FROM expenses e WHERE ${where}
  `).get(...params);

  res.json({ byCategory, monthly, totals });
});

// ── POST /api/expenses ────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { description, amount, date, category_id, notes } = req.body;

  if (!description?.trim()) return res.status(400).json({ error: 'Description is required' });
  if (!amount || isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required' });
  if (!date) return res.status(400).json({ error: 'Date is required' });
  if (!category_id) return res.status(400).json({ error: 'Category is required' });

  const db = getDB();
  const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(category_id, req.user.id);
  if (!cat) return res.status(400).json({ error: 'Invalid category' });

  const result = db.prepare(`
    INSERT INTO expenses (user_id, category_id, description, amount, date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, category_id, description.trim(), Number(amount), date, notes || null);

  const expense = db.prepare(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e JOIN categories c ON c.id = e.category_id WHERE e.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(expense);
});

// ── DELETE /api/expenses/:id ──────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const db = getDB();
  const expense = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Expense deleted' });
});

// ── GET /api/expenses/export ──────────────────────────────────────────────────
router.get('/export', async (req, res) => {
  const db = getDB();
  const { where, params } = buildFilters(req.query, req.user.id);
  const format = req.query.format || 'csv';

  const expenses = db.prepare(`
    SELECT e.date, e.description, c.name as category, e.amount, e.notes, e.created_at
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    WHERE ${where}
    ORDER BY e.date DESC
  `).all(...params);

  const currency = req.user.currency || 'INR';

  if (format === 'csv') {
    const header = 'Date,Description,Category,Amount,Currency,Notes,Added On\n';
    const rows = expenses.map(e =>
      [e.date, `"${e.description}"`, e.category, e.amount, currency, `"${e.notes || ''}"`, e.created_at].join(',')
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="spendwise_expenses.csv"');
    return res.send(header + rows);
  }

  if (format === 'excel') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SpendWise';
    const ws = wb.addWorksheet('Expenses');

    ws.columns = [
      { header: 'Date',        key: 'date',        width: 14 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Category',    key: 'category',    width: 16 },
      { header: `Amount (${currency})`, key: 'amount', width: 16 },
      { header: 'Notes',       key: 'notes',       width: 30 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6C63FF' } };

    expenses.forEach(e => {
      ws.addRow({ date: e.date, description: e.description, category: e.category, amount: e.amount, notes: e.notes || '' });
    });

    // Total row
    ws.addRow({});
    const totalRow = ws.addRow({ description: 'TOTAL', amount: expenses.reduce((s, e) => s + e.amount, 0) });
    totalRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="spendwise_expenses.xlsx"');
    await wb.xlsx.write(res);
    return res.end();
  }

  res.status(400).json({ error: 'Invalid format. Use csv or excel.' });
});

// ── GET /api/expenses/budgets ─────────────────────────────────────────────────
router.get('/budgets', (req, res) => {
  const db = getDB();
  const budgets = db.prepare(`
    SELECT b.*, c.name as category_name, c.icon, c.color,
      (SELECT SUM(amount) FROM expenses 
       WHERE category_id = b.category_id AND user_id = b.user_id 
       AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')) as spent
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    WHERE b.user_id = ?
  `).all(req.user.id);
  res.json(budgets);
});

router.post('/budgets', (req, res) => {
  const { category_id, amount } = req.body;
  if (!category_id || !amount) return res.status(400).json({ error: 'category_id and amount are required' });
  const db = getDB();
  db.prepare('INSERT INTO budgets (user_id, category_id, amount) VALUES (?, ?, ?) ON CONFLICT(user_id, category_id) DO UPDATE SET amount = excluded.amount')
    .run(req.user.id, category_id, Number(amount));
  res.json({ message: 'Budget saved' });
});

router.delete('/budgets/:category_id', (req, res) => {
  getDB().prepare('DELETE FROM budgets WHERE user_id = ? AND category_id = ?').run(req.user.id, req.params.category_id);
  res.json({ message: 'Budget removed' });
});

module.exports = router;
