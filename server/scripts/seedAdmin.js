const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, USER_ROLES } = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
    const adminName = process.env.ADMIN_NAME || 'CampusFound Admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@campusfound.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required to seed the admin user.');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existingAdmin = await User.findOne({ email: adminEmail });
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (existingAdmin) {
        existingAdmin.name = adminName;
        existingAdmin.password = hashedPassword;
        existingAdmin.role = USER_ROLES.ADMIN;
        await existingAdmin.save();
        console.log(`Updated admin user: ${adminEmail}`);
    } else {
        await User.create({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: USER_ROLES.ADMIN,
        });
        console.log(`Created admin user: ${adminEmail}`);
    }
};

seedAdmin()
    .catch((error) => {
        console.error('Failed to seed admin user:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
