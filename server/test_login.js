require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const admin = await User.findOne({ email: 'admin@campus.edu' });
    console.log('User found:', !!admin);
    if (admin) {
        console.log('Password hash:', admin.password);
        const match = await bcrypt.compare('password123', admin.password);
        console.log('Password match:', match);
    }
    process.exit(0);
}).catch(console.error);
