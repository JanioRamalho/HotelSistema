import { useEffect, useState } from 'react';
import { fetchHotels } from '@/api/HotelApi';
import { Hotel } from '../types';
export default function HotelList() {
    const [hotels, setHotels] = useState<Hotel[]>([]);

    useEffect(() => {
        async function loadHotels() {
            const hotelsData = await fetchHotels();
            setHotels(hotelsData);
        }
        loadHotels();
    }, []);

    return (
        <div>
            <h1>Hotéis</h1>
            <ul>
                {hotels.map((hotel) => (
                    <li key={hotel.id}>
                        <h2>{hotel.title}</h2>
                        <p>{hotel.description}</p>
                        <img src={hotel.thumbnail} alt={hotel.title} />
                    </li>
                ))}
            </ul>
        </div>
    );
}