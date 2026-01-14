import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { LocationResult } from '../lib/models';

export default function New() {
  const router = useRouter();
  const { latitude, longitude, destination } = router.query;
  const [locations, setLocations] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (latitude && longitude && destination) {
      const currentLocation = `${latitude},${longitude}`;
      fetch(`/api/locations?destination=${encodeURIComponent(destination as string)}&currentLocation=${currentLocation}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setLocations(data);
          }
          setLoading(false);
        })
        .catch((err) => {
          setError('Failed to fetch locations');
          setLoading(false);
        });
    }
  }, [latitude, longitude, destination]);

  const handleRouteSelect = (endLocation: string) => {
    const currentLocation = `${latitude},${longitude}`;
    router.push({
      pathname: '/route',
      query: {
        start_location: currentLocation,
        end_location: endLocation,
      },
    });
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading destinations...</title>
        </Head>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading destinations...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Pick your destination</title>
      </Head>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h5>Pick your destination</h5>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {locations.length === 0 && !error && (
          <p>No destinations found. Please try a different search.</p>
        )}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {locations.map((location, index) => (
            <li key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const endLocation = `${location.geometry.location.lat},${location.geometry.location.lng}`;
                  handleRouteSelect(endLocation);
                }}
              >
                <input
                  type="hidden"
                  name="start_location"
                  value={`${latitude},${longitude}`}
                />
                <button
                  type="submit"
                  name="end_location"
                  value={`${location.geometry.location.lat},${location.geometry.location.lng}`}
                  style={{
                    width: '100%',
                    padding: '10px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  <strong>{location.name}</strong>: {location.formatted_address}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
