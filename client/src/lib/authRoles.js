export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
};

const ROLE_ALIASES = {
    student: USER_ROLES.USER,
    campus_member: USER_ROLES.USER,
    finder: USER_ROLES.USER,
    admin: USER_ROLES.ADMIN,
    admin_security: USER_ROLES.ADMIN,
    CAMPUS_MEMBER: USER_ROLES.USER,
    FINDER: USER_ROLES.USER,
    ADMIN: USER_ROLES.ADMIN,
    user: USER_ROLES.USER,
    USER: USER_ROLES.USER,
};

export const normalizeRole = (role) => ROLE_ALIASES[role] || role || USER_ROLES.USER;

export const getDashboardPath = (role) => {
    const normalizedRole = normalizeRole(role);

    if (normalizedRole === USER_ROLES.ADMIN) {
        return '/admin';
    }

    return '/user/dashboard';
};

export const roleLabelMap = {
    [USER_ROLES.USER]: 'Normal User',
    [USER_ROLES.ADMIN]: 'Admin',
};
