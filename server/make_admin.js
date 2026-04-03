require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    let admin = await User.findOne({ email: 'admin@campus.edu' });
    if (!admin) {
        admin = new User({
            name: 'Chief Admin',
            email: 'admin@campus.edu',
            password: 'password123',
            role: 'admin'
        });
        await admin.save();
        console.log('Admin account created! Email: admin@campus.edu | Password: password123');
    } else {
        admin.role = 'admin';
        await admin.save();
        console.log('Account admin@campus.edu already exists and is ensured as an admin. Password is whatever you set it to.');
    }
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
