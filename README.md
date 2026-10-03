# Toys API — תיעוד

שרת REST לניהול קטלוג צעצועים ומשתמשים. ברירת המחדל היא `http://localhost:3001`; מסד הנתונים הוא MongoDB והצעצועים נשמרים בקולקשן `toys`.

## התקנה והפעלה

1. התקינו Node.js והפעילו שרת MongoDB.
2. העתיקו את `.env.example` לקובץ `.env` והגדירו `MONGODB_URI` ו־`JWT_SECRET` לערכים פרטיים. אין להעלות את `.env` או `node_modules` ל־GitHub.
3. הריצו `npm install` ואז `npm run dev` לפיתוח או `npm start` להפעלה רגילה.
4. אופציונלי: `npm run seed` מוסיף 12 צעצועים בשלוש קטגוריות, רק כשהקולקשן ריק. פריטי הדוגמה מסומנים `user_id: "seed"` ואינם ניתנים לעריכה על ידי משתמש רגיל.

השרת מאזין בפורט `3001` כברירת מחדל. אפשר לשנות זאת באמצעות `PORT`.

## משתמשים ואימות

### הרשמה — `POST /users`

Body מסוג JSON:

```json
{
  "name": "Dana Cohen",
  "email": "dana@example.com",
  "password": "at-least-8-characters"
}
```

`name`, `email` ו־`password` נדרשים. הסיסמה חייבת להכיל לפחות 8 תווים ונשמרת במסד כ־bcrypt hash. שדות נוספים, לרבות `role`, אינם מתקבלים מהלקוח; משתמש חדש מקבל `role: "USER"`. הצלחה מחזירה `201` עם פרטי משתמש שאינם כוללים סיסמה. מייל שכבר רשום מחזיר `409`:

```json
{ "error": "Email is already registered" }
```

### התחברות — `POST /users/login`

שלחו רק `email` ו־`password`:

```json
{
  "email": "dana@example.com",
  "password": "at-least-8-characters"
}
```

בהצלחה מוחזר JWT:

```json
{
  "token": "<JWT>",
  "user": { "id": "<id>", "name": "Dana Cohen", "email": "dana@example.com", "role": "USER" }
}
```

בכל בקשת יצירה, עדכון או מחיקה של צעצוע יש לשלוח את הטוקן בכותרת `x-api-key`:

```http
x-api-key: <JWT>
Content-Type: application/json
```

טוקן חסר או לא תקין מחזיר `401` עם הודעת שגיאה ב־JSON. תוקף הטוקן נקבע ב־`JWT_EXPIRES_IN` (ברירת מחדל 7 ימים). סוד החתימה נמצא ב־`JWT_SECRET` שבסביבת השרת.

## צעצועים

שדות צעצוע: `name` (מחרוזת), `info` (מחרוזת), `category` (מחרוזת), `img_url` (כתובת HTTP/HTTPS, אופציונלי), `price` (מספר שאינו שלילי), `Date_created` (נוצר אוטומטית), `Date_updated` (מתעדכן אוטומטית), `user_id` (מזהה המשתמש מהטוקן). אין לשלוח `user_id`; השרת קובע אותו לפי המשתמש המאומת.

| שיטה וכתובת | פעולה, קלט ותשובה |
|---|---|
| `GET /toys?skip=0` | רשימת צעצועים, עד 10 בעמוד. `skip` הוא מספר העמוד, מתחיל ב־0; למשל `skip=1` מחזיר את העמוד השני. |
| `GET /toys?skip=0&s=wood` | חיפוש לא תלוי רישיות בתוך `name` או `info`. אפשר לשלב עם סינון קטגוריה. |
| `GET /toys?skip=0&category=הרכבה` | סינון לפי קטגוריה. אפשר לשלב עם `s`. |
| `GET /toys/search?s=wood&skip=0` | מסלול חיפוש חלופי; הפרמטר `s` מחפש בשם ובתיאור. |
| `GET /toys/category/הרכבה?skip=0` | מסלול חלופי לשליפה לפי קטגוריה. |
| `GET /toys/single/:id` | מחזיר צעצוע יחיד כאובייקט. |
| `GET /toys/count` | מחזיר `{ "count": מספר }` עבור כלל הצעצועים. |
| `POST /toys` | יצירת צעצוע; דורשת `x-api-key` ואת כל השדות `name`, `info`, `category`, `price`. `img_url` אופציונלי. |
| `PUT /toys/:id` | עדכון חלקי של שדה אחד או יותר מתוך שדות הצעצוע; דורש `x-api-key` ובעלות על הצעצוע. |
| `DELETE /toys/:id` | מחיקת צעצוע; דורשת `x-api-key` ובעלות על הצעצוע. |

### יצירת צעצוע — דוגמת Body

```json
{
  "name": "קוביות עץ",
  "info": "סט קוביות צבעוני לילדים",
  "category": "הרכבה",
  "img_url": "https://example.com/toy.jpg",
  "price": 49.9
}
```

בבקשת `PUT` ניתן לשלוח רק את השדות שרוצים לשנות, לדוגמה `{ "price": 39.9 }`. אין לכלול `_id`, `user_id`, תאריכים או שדות אחרים שאינם ניתנים לעריכה. משתמש לא יכול לערוך או למחוק צעצוע ששייך למשתמש אחר; במקרה כזה מתקבלת תשובת `404`.

תשובת רשימה נראית כך:

```json
{
  "toys": [],
  "total": 0,
  "skip": 0,
  "limit": 10
}
```

## קודי תגובה נפוצים

- `200` — בקשה הצליחה.
- `201` — משתמש או צעצוע נוצרו.
- `400` — גוף בקשה, מזהה או פרמטר עמוד לא תקינים; פרטי בדיקת Joi מוחזרים ב־`details`.
- `401` — פרטי התחברות או טוקן אינם תקינים.
- `404` — כתובת או צעצוע לא נמצאו (כולל צעצוע שאינו בבעלות המשתמש).
- `409` — כתובת מייל כבר רשומה.
- `500` — תקלה פנימית בשרת.

## דוגמאות cURL

```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Dana Cohen","email":"dana@example.com","password":"at-least-8-characters"}'
```

```bash
curl -X POST http://localhost:3001/toys \
  -H "Content-Type: application/json" \
  -H "x-api-key: <JWT>" \
  -d '{"name":"Wood blocks","info":"Colorful building blocks","category":"Assembly","price":49.9}'
```
