const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const Toy = require('../models/Toy');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const PAGE_SIZE = 10;
const editableFields = ['name', 'info', 'category', 'img_url', 'price'];
const toySchema = Joi.object({
  name: Joi.string().trim().min(1).max(120),
  info: Joi.string().trim().max(2000),
  category: Joi.string().trim().min(1).max(80),
  img_url: Joi.string().uri({ scheme: ['http', 'https'] }).allow(''),
  price: Joi.number().min(0),
}).unknown(false);

function pageNumber(value) {
  if (value === undefined) return 0;
  const page = Number(value);
  return Number.isInteger(page) && page >= 0 ? page : null;
}

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function toyInput(body, partial = false) {
  const result = {};
  for (const field of editableFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) result[field] = body[field];
  }
  if (!partial && editableFields.some((field) => !Object.prototype.hasOwnProperty.call(result, field) && field !== 'img_url')) {
    return null;
  }
  return result;
}

// Specific paths precede /:id routes.
router.get('/count', async (_req, res, next) => {
  try {
    return res.json({ count: await Toy.countDocuments() });
  } catch (error) { return next(error); }
});

router.get('/single/:id', async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid toy id' });
  try {
    const toy = await Toy.findById(req.params.id);
    if (!toy) return res.status(404).json({ error: 'Toy not found' });
    return res.json(toy);
  } catch (error) { return next(error); }
});

router.get('/search', async (req, res, next) => {
  return listToys(req, res, next, { search: req.query.s || '' });
});

router.get('/category/:catname', async (req, res, next) => {
  return listToys(req, res, next, { category: req.params.catname });
});

async function listToys(req, res, next, filters = {}) {
  const page = pageNumber(req.query.skip);
  if (page === null) return res.status(400).json({ error: 'skip must be a non-negative page number' });
  const filter = {};
  const searchValue = filters.search ?? req.query.s;
  const categoryValue = filters.category ?? req.query.category;
  const search = typeof searchValue === 'string' ? searchValue.trim() : '';
  const category = typeof categoryValue === 'string' ? categoryValue.trim() : '';
  if (search) filter.$or = [
    { name: { $regex: escapeRegex(search), $options: 'i' } },
    { info: { $regex: escapeRegex(search), $options: 'i' } },
  ];
  if (category) filter.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
  try {
    const [toys, total] = await Promise.all([
      Toy.find(filter).sort({ Date_created: -1, _id: -1 }).skip(page * PAGE_SIZE).limit(PAGE_SIZE),
      Toy.countDocuments(filter),
    ]);
    return res.json({ toys, total, skip: page, limit: PAGE_SIZE });
  } catch (error) { return next(error); }
}

function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Combined listing supports optional ?s= and ?category= filters.
router.get('/', listToys);

router.post('/', requireAuth, async (req, res, next) => {
  const { error, value } = toySchema.validate(req.body, { abortEarly: false, stripUnknown: false });
  if (error) return res.status(400).json({ error: 'Invalid toy data', details: error.details.map((item) => item.message) });
  const data = toyInput(value);
  if (!data) return res.status(400).json({ error: 'name, info, category and price are required' });
  try {
    const toy = await Toy.create({ ...data, user_id: req.user.id });
    return res.status(201).json(toy);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ error: error.message });
    return next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid toy id' });
  const { error, value } = toySchema.min(1).validate(req.body, { abortEarly: false, stripUnknown: false });
  if (error) return res.status(400).json({ error: 'Invalid toy data', details: error.details.map((item) => item.message) });
  const data = toyInput(value, true);
  if (!Object.keys(data).length) return res.status(400).json({ error: 'At least one editable field is required' });
  try {
    const toy = await Toy.findOneAndUpdate({ _id: req.params.id, user_id: req.user.id }, data, { new: true, runValidators: true });
    if (!toy) return res.status(404).json({ error: 'Toy not found or not owned by this user' });
    return res.json(toy);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ error: error.message });
    return next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid toy id' });
  try {
    const toy = await Toy.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!toy) return res.status(404).json({ error: 'Toy not found or not owned by this user' });
    return res.json({ message: 'Toy deleted', id: String(toy._id) });
  } catch (error) { return next(error); }
});

module.exports = router;
