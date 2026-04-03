export const MOCK_ITEMS = [
    {
        id: '1',
        title: 'MacBook Pro M2 - Space Gray',
        category: 'Electronics',
        status: 'lost',
        location: 'Main Library, 3rd Floor Study Area',
        date: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000',
        description: 'Lost my MacBook Pro during finals week. It has a distinctive sticker of a cat reading a book on the front cover. Please contact me if found!'
    },
    {
        id: '2',
        title: 'Leather Wallet with IDs',
        category: 'Wallets',
        status: 'found',
        location: 'Student Union Cafeteria',
        date: new Date(Date.now() - 86400000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1000',
        description: 'Found a brown leather wallet on one of the tables near the window. It has a student ID and a few cards. I gave it to the front desk.'
    },
    {
        id: '3',
        title: 'Sony WH-1000XM4 Headphones',
        category: 'Electronics',
        status: 'lost',
        location: 'Engineering Building, Room 204',
        date: new Date(Date.now() - 172800000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=1000',
        description: 'Black Sony noise cancelling headphones. They are in a hard black case. Left them after the 2 PM lecture yesterday.'
    },
    {
        id: '4',
        title: 'Keys with Honda Fob',
        category: 'Keys',
        status: 'found',
        location: 'South Parking Lot near Entrance C',
        date: new Date(Date.now() - 10000000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=1000',
        description: 'A set of 4 keys with a Honda car key fob. Found in the parking lot next to a blue sedan.'
    },
    {
        id: '6',
        title: 'Hydroflask Water Bottle (Yellow)',
        category: 'Other',
        status: 'found',
        location: 'Recreation Center',
        date: new Date(Date.now() - 120000000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=1000',
        description: 'Left near the basketball courts on Saturday. Pretty dented at the bottom. Filled with lukewarm water. Left at the rec center front desk.'
    }
];
