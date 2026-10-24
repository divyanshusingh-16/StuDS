const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function clean() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || 'StuDS' });
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const res = await User.updateMany({ uid: null }, { $unset: { uid: '' } });
  console.log('Modified documents:', res.modifiedCount);
  await mongoose.disconnect();
}

clean().catch(console.error);
