const CATEGORY_GROUPS = [
    ['Electronics', 'Phone', 'Laptop', 'Tablet', 'Earbuds'],
    ['Bag', 'Backpack'],
    ['Keys'],
    ['Wallet', 'ID Card'],
    ['Clothing', 'Jewelry'],
];

const toRadians = (value) => (value * Math.PI) / 180;

const relatedCategories = (a, b) =>
    CATEGORY_GROUPS.some((group) => group.includes(a) && group.includes(b));

const haversineDistance = (coordsA, coordsB) => {
    if (
        !Array.isArray(coordsA) ||
        !Array.isArray(coordsB) ||
        coordsA.length < 2 ||
        coordsB.length < 2 ||
        Number(coordsA[0]) === 0 ||
        Number(coordsB[0]) === 0 ||
        Number.isNaN(Number(coordsA[0])) ||
        Number.isNaN(Number(coordsA[1])) ||
        Number.isNaN(Number(coordsB[0])) ||
        Number.isNaN(Number(coordsB[1]))
    ) {
        return Number.POSITIVE_INFINITY;
    }

    const earthRadiusKm = 6371;
    const dLat = toRadians(Number(coordsB[1]) - Number(coordsA[1]));
    const dLon = toRadians(Number(coordsB[0]) - Number(coordsA[0]));
    const latA = toRadians(Number(coordsA[1]));
    const latB = toRadians(Number(coordsB[1]));
    const aValue =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latA) * Math.cos(latB) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(aValue), Math.sqrt(1 - aValue));
};

const metadataScore = (itemA, itemB) => {
    let score = 0;

    if (itemA.category === itemB.category) {
        score += 30;
    } else if (relatedCategories(itemA.category, itemB.category)) {
        score += 15;
    }

    const distance = haversineDistance(
        itemA.location?.coordinates?.coordinates,
        itemB.location?.coordinates?.coordinates
    );

    if (distance <= 0.1) {
        score += 40;
    } else if (distance <= 0.5) {
        score += 25;
    } else if (distance <= 2.0) {
        score += 10;
    }

    const msPerDay = 86400000;
    const days =
        Math.abs(new Date(itemA.reportedAt).getTime() - new Date(itemB.reportedAt).getTime()) / msPerDay;

    if (days === 0) {
        score += 30;
    } else if (days <= 1) {
        score += 20;
    } else if (days <= 3) {
        score += 10;
    } else if (days <= 7) {
        score += 5;
    }

    return Math.min(score, 100);
};

const combinedScore = (textScore, imageScore, metaScore) => {
    const hasImage = imageScore !== null;
    const final = hasImage
        ? textScore * 0.45 + imageScore * 0.35 + metaScore * 0.2
        : textScore * 0.7 + metaScore * 0.3;

    const label =
        final >= 85 ? 'Strong Match' : final >= 60 ? 'Possible Match' : final >= 35 ? 'Weak Match' : 'Unlikely Match';

    return {
        final: Math.round(final * 10) / 10,
        label,
    };
};

module.exports = {
    relatedCategories,
    haversineDistance,
    metadataScore,
    combinedScore,
};
