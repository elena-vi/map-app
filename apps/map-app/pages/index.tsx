import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string>('Find your way');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setSubmitDisabled(false);
          setButtonText('Find your way');
        },
        (err) => {
          setError(
            'Geolocation permission was denied. Please enter your location manually.'
          );
          setSubmitDisabled(false);
          setButtonText('Find your way');
        }
      );
    } else {
      setError(
        'Geolocation is not supported by this browser. Please enter your location manually.'
      );
      setSubmitDisabled(false);
      setButtonText('Find your way');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (latitude && longitude && destination) {
      router.push({
        pathname: '/new',
        query: {
          latitude,
          longitude,
          destination,
        },
      });
    }
  };

  return (
    <>
      <Head>
        <title>Map App - Find Your Way</title>
      </Head>
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h3>Where are you going?</h3>
        {error && <strong style={{ color: 'red' }}>{error}</strong>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: error ? 'block' : 'none', marginBottom: '15px' }}>
            <label htmlFor="latitude">Your latitude</label>
            <input
              type="text"
              id="latitude"
              name="latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '10px' }}
            />
            <label htmlFor="longitude">Your longitude</label>
            <input
              type="text"
              id="longitude"
              name="longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="destination">Destination</label>
            <input
              id="destination"
              type="text"
              name="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <button
            type="submit"
            disabled={submitDisabled}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: submitDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </>
  );
}
