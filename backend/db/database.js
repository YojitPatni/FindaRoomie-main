const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    try {
      const usersColl = mongoose.connection.db.collection('users');
      const idx = await usersColl.indexes();
      const legacy = idx.find(i => i.name === 'username_1');
      if (legacy) {
        await usersColl.dropIndex('username_1');
        console.log('Removed legacy index: users.username_1');
      }
    } catch (idxErr) {
      console.warn('Index check warning:', idxErr.message);
    }
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
