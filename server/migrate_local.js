require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to DB');
  const result = await mongoose.connection.collection('users').updateMany(
    { role: { $in: ['FINDER', 'CAMPUS_MEMBER', 'finder', 'campus_member', 'student'] } },
    { $set: { role: 'user' } }
  );
  const adminResult = await mongoose.connection.collection('users').updateMany(
    { role: { $in: ['ADMIN', 'admin_security'] } },
    { $set: { role: 'admin' } }
  );
  console.log('User Migration complete:', result);
  console.log('Admin Migration complete:', adminResult);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
