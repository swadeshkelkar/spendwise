const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getDB } = require('../db/database');

const router = express.Router();
router.use(authMiddleware);

// ── GET /api/templates ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDB();
  const templates = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expense_templates t
    JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
  `).all(req.user.id);
  res.json(templates);
});

// ── POST /api/templates ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { name, description, amount, category_id, notes } = req.body;

  if (!name?.trim())        return res.status(400).json({ error: 'Template name is required' });
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required' });
  if (!amount || isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ error: 'Valid amount is required' });
  if (!category_id) return res.status(400).json({ error: 'Category is required' });

  const db = getDB();
  const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
    .get(category_id, req.user.id);
  if (!cat) return res.status(400).json({ error: 'Invalid category' });

  const result = db.prepare(`
    INSERT INTO expense_templates (user_id, name, description, amount, category_id, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name.trim(), description.trim(), Number(amount), category_id, notes || null);

  const template = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expense_templates t
    JOIN categories c ON c.id = t.category_id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(template);
});

// ── DELETE /api/templates/:id ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const db = getDB();
  const template = db.prepare('SELECT id FROM expense_templates WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  db.prepare('DELETE FROM expense_templates WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ message: 'Template deleted' });
});

// ── POST /api/templates/:id/apply ─────────────────────────────────────────────
// Creates a real expense from the template. Body can override amount and date.
router.post('/:id/apply', (req, res) => {
  const db = getDB();
  const template = db.prepare('SELECT * FROM expense_templates WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const amount = req.body.amount != null ? Number(req.body.amount) : template.amount;
  const date   = req.body.date   || new Date().toISOString().split('T')[0];

  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

  // Verify category still exists and belongs to user
  const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
    .get(template.category_id, req.user.id);
  if (!cat) return res.status(400).json({ error: 'Template category no longer exists' });

  const result = db.prepare(`
    INSERT INTO expenses (user_id, category_id, description, amount, date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, template.category_id, template.description, amount, date, template.notes || null);

  const expense = db.prepare(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e JOIN categories c ON c.id = e.category_id WHERE e.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(expense);
});

module.exports = router;
