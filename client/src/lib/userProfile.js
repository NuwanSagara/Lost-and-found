import defaultProfileImage from '../assets/default-profile.svg';

const getApiOrigin = () => (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) {
        return defaultProfileImage;
    }

    if (/^https?:\/\//i.test(avatarPath) || avatarPath.startsWith('data:')) {
        return avatarPath;
    }

    if (avatarPath.startsWith('/')) {
        return `${getApiOrigin()}${avatarPath}`;
    }

    return `${getApiOrigin()}/${avatarPath}`;
};

export const getDefaultProfileImage = () => defaultProfileImage;
