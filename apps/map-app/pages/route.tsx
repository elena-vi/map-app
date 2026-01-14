import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Route, RouteOption } from '../lib/models';

export default function RoutePage() {
  const router = useRouter();
  const { start_location, end_location } = router.query;
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (start_location && end_location) {
      fetch(
        `/api/route?start_location=${encodeURIComponent(start_location as string)}&end_location=${encodeURIComponent(end_location as string)}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setRoute(data);
          }
          setLoading(false);
        })
        .catch((err) => {
          setError('Failed to fetch route');
          setLoading(false);
        });
    }
  }, [start_location, end_location]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading route...</title>
        </Head>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading route...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Error</title>
        </Head>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      </>
    );
  }

  if (!route || !route.routes || route.routes.length === 0) {
    return (
      <>
        <Head>
          <title>No routes found</title>
        </Head>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No routes found for this journey.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Route Options</title>
      </Head>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Route Options</h2>
        {route.routes.map((routeOption: RouteOption, index: number) => (
          <details key={index} style={{ marginBottom: '20px', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td>Arrival Time</td>
                    <td>{routeOption.route_arrival_time}</td>
                  </tr>
                  <tr>
                    <td>Duration</td>
                    <td>{routeOption.duration_seconds} seconds</td>
                  </tr>
                  <tr>
                    <td>Price</td>
                    <td>{routeOption.price?.formatted || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </summary>
            <div style={{ marginTop: '10px', padding: '10px' }}>
              <p>
                <strong>Legs:</strong>
              </p>
              <ul>
                {routeOption.legs?.map((leg, legIndex) => (
                  <li key={legIndex}>{leg.travel_mode}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
