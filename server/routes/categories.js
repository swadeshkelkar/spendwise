const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getDB } = require('../db/database');

const router = express.Router();
router.use(authMiddleware);

// ── GET /api/categories ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDB();
  const cats = db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY is_default DESC, name ASC').all(req.user.id);
  res.json(cats);
});

// ── POST /api/categories ──────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { name, icon, color } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });
  if (name.trim().length > 30) return res.status(400).json({ error: 'Category name too long (max 30 chars)' });

  const db = getDB();
  const exists = db.prepare('SELECT id FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?)').get(req.user.id, name.trim());
  if (exists) return res.status(409).json({ error: 'A category with this name already exists' });

  const result = db.prepare(
    'INSERT INTO categories (user_id, name, icon, color, is_default) VALUES (?, ?, ?, ?, 0)'
  ).run(req.user.id, name.trim(), icon || '📦', color || '#6C63FF');

  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(cat);
});

// ── DELETE /api/categories/:id ────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const db = getDB();
  const cat = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  if (cat.is_default) return res.status(400).json({ error: 'Default categories cannot be deleted' });

  // Check if any expense uses this category
  const inUse = db.prepare('SELECT COUNT(*) as count FROM expenses WHERE category_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (inUse.count > 0) {
    return res.status(400).json({
      error: `Cannot delete "${cat.name}" — it has ${inUse.count} expense${inUse.count > 1 ? 's' : ''} associated with it. Reassign or delete those expenses first.`
    });
  }

  db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: `Category "${cat.name}" deleted` });
});

module.exports = router;
