const mongoose = require('mongoose');

const toySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
  info: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  img_url: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: (value) => !value || /^https?:\/\//i.test(value),
      message: 'img_url must be a valid HTTP(S) URL',
    },
  },
  price: { type: Number, required: true, min: 0 },
  user_id: { type: String, required: true, index: true },
}, { timestamps: { createdAt: 'Date_created', updatedAt: 'Date_updated' } });

toySchema.index({ name: 'text', info: 'text' });
toySchema.index({ category: 1 });

module.exports = mongoose.model('Toy', toySchema, 'toys');
