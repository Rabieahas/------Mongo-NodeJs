require('dotenv').config();
const mongoose = require('mongoose');
const Toy = require('./models/Toy');

const examples = [
  ['קוביות עץ', 'סט קוביות צבעוני לבנייה ויצירה', 'הרכבה', 49.9],
  ['ערכת מגנטים', 'צורות מגנטיות לבנייה בטוחה', 'הרכבה', 79],
  ['מסילת רכבת', 'מסילת עץ עם רכבת ושמונה חלקים', 'הרכבה', 129.9],
  ['פאזל חיות', 'פאזל עץ בן 24 חלקים', 'הרכבה', 39],
  ['בובת ארנב', 'בובת בד רכה המתאימה לחיבוק', 'בובות', 59.5],
  ['בובת אסטרונאוט', 'בובת אסטרונאוט עם חליפה צבעונית', 'בובות', 69],
  ['בית בובות', 'בית משחק מעץ עם ריהוט בסיסי', 'בובות', 189],
  ['בובת אצבע', 'סט של חמש בובות אצבע לחיות', 'בובות', 34.9],
  ['כדורגל לילדים', 'כדור קל ורך למשחק בחוץ', 'ספורט', 45],
  ['ערכת באולינג', 'שישה בקבוקים וכדור למשחק בבית', 'ספורט', 55],
  ['חבל קפיצה', 'חבל קפיצה מתכוונן לילדים', 'ספורט', 29.9],
  ['סל קליעה', 'סל קטן לתלייה וכדור ספוג', 'ספורט', 89],
];

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be set');
  await mongoose.connect(process.env.MONGODB_URI);
  if (await Toy.countDocuments() === 0) {
    await Toy.insertMany(examples.map(([name, info, category, price]) => ({ name, info, category, price, img_url: '', user_id: 'seed' })));
    console.log('Inserted 12 sample toys in 3 categories.');
  } else {
    console.log('Toys collection is not empty; no sample data was added.');
  }
  await mongoose.disconnect();
}

seed().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exit(1); });
