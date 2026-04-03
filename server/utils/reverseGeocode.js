const GOOGLE_MAPS_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

const pickAddressComponent = (components, targetTypes) => {
    if (!Array.isArray(components)) {
        return '';
    }

    const match = components.find((component) => (
        Array.isArray(component.types) &&
        targetTypes.some((type) => component.types.includes(type))
    ));

    return match?.long_name || '';
};

const reverseGeocodeCoordinates = async ({ latitude, longitude }) => {
    const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
    if (!apiKey) {
        return null;
    }

    const url = new URL(GOOGLE_MAPS_GEOCODING_URL);
    url.searchParams.set('latlng', `${latitude},${longitude}`);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Reverse geocoding request failed.');
    }

    const data = await response.json();
    if (data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
        return null;
    }

    const topResult = data.results[0];
    const components = topResult.address_components || [];
    const city = pickAddressComponent(components, ['locality', 'postal_town', 'administrative_area_level_2']);
    const country = pickAddressComponent(components, ['country']);

    return {
        address: topResult.formatted_address || '',
        city,
        country,
        formattedAddress: topResult.formatted_address || '',
    };
};

module.exports = {
    reverseGeocodeCoordinates,
};
