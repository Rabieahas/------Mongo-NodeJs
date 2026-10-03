const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');

const router = express.Router();

function createToken(user) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(254).required(),
  password: Joi.string().min(8).max(128).required(),
}).required();
const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(254).required(),
  password: Joi.string().min(1).max(128).required(),
}).required();

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ error: 'Invalid user data', details: error.details.map((item) => item.message) });
    const email = value.email.toLowerCase();
    if (await User.exists({ email })) return res.status(409).json({ error: 'Email is already registered' });
    const password = await bcrypt.hash(value.password, 12);
    const user = await User.create({ name: value.name, email, password, role: 'USER' });
    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role, date_created: user.date_created },
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Email is already registered' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ error: 'Invalid login data', details: error.details.map((item) => item.message) });
    const user = await User.findOne({ email: value.email.toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(value.password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    return res.json({ token: createToken(user), user: { id: String(user._id), name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
