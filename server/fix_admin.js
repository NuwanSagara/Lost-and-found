require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const result = await User.updateOne(
        { email: 'admin@campus.edu' },
        { $set: { password: hashedPassword, role: 'admin' } }
    );
    
    if (result.matchedCount === 0) {
        // Create if not exists
        await User.create({
            name: 'Chief Admin',
            email: 'admin@campus.edu',
            password: hashedPassword,
            role: 'admin'
        });
        console.log('Admin account created with HASHED password.');
    } else {
        console.log('Admin account password UPDATED to hashed version.');
    }
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
