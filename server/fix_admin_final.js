require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fix() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const { User } = require('./models/User');
        console.log('User model imported.');

        const email = 'admin@campus.edu';
        const password = 'password123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Password hashed.');

        const result = await User.updateOne(
            { email },
            { $set: { password: hashedPassword, role: 'admin' } }
        );

        if (result.matchedCount === 0) {
            console.log('User not found, creating...');
            await User.create({
                name: 'Chief Admin',
                email,
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Admin user created.');
        } else {
            console.log('Admin user updated.');
        }

        console.log('SUCCESS');
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

fix();
