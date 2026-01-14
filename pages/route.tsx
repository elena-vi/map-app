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

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  const getTravelModeLabel = (mode: string): string => {
    const modeMap: { [key: string]: string } = {
      'TRANSIT': 'Transit',
      'WALKING': 'Walk',
      'DRIVE': 'Drive',
      'BICYCLE': 'Bike',
    };
    return modeMap[mode] || mode;
  };

  return (
    <>
      <Head>
        <title>Route Options</title>
      </Head>
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <h2>Route Options</h2>
        {route.routes.map((routeOption: RouteOption, index: number) => (
          <details key={index} style={{ marginBottom: '20px', border: '1px solid #ddd', borderRadius: '5px', padding: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div><strong>Duration:</strong> {formatDuration(routeOption.duration_seconds)}</div>
                  <div><strong>Arrival:</strong> {formatTime(routeOption.route_arrival_time)}</div>
                </div>
                <div>
                  <div><strong>Price:</strong> {routeOption.price?.formatted || 'N/A'}</div>
                </div>
              </div>
            </summary>
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Route Details</h3>
              {routeOption.legs?.map((leg, legIndex) => (
                <div key={legIndex} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '5px', backgroundColor: 'white' }}>
                  <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                    Leg {legIndex + 1}: {getTravelModeLabel(leg.travel_mode || leg.travelMode)}
                    {leg.duration && (
                      <span style={{ marginLeft: '10px', fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                        ({formatDuration(typeof leg.duration === 'string' ? parseInt(leg.duration.replace('s', '')) : leg.duration)})
                      </span>
                    )}
                  </div>
                  
                  {leg.steps && leg.steps.length > 0 ? (
                    <div style={{ marginLeft: '10px' }}>
                      {leg.steps.map((step: any, stepIndex: number) => (
                        <div key={stepIndex} style={{ marginBottom: '15px', padding: '10px', borderLeft: '3px solid #4285f4', paddingLeft: '15px' }}>
                          {step.transitDetails ? (
                            <div>
                              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#1976d2' }}>
                                {step.transitDetails.transitLine?.name || 'Transit'}
                                {step.transitDetails.transitLine?.color && (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      width: '20px',
                                      height: '20px',
                                      backgroundColor: `#${step.transitDetails.transitLine.color}`,
                                      marginLeft: '8px',
                                      borderRadius: '3px',
                                      verticalAlign: 'middle',
                                    }}
                                    title={step.transitDetails.transitLine.name}
                                  />
                                )}
                              </div>
                              {step.transitDetails.headsign && (
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                                  Direction: {step.transitDetails.headsign}
                                </div>
                              )}
                              {step.transitDetails.stopDetails?.departureStop && (
                                <div style={{ fontSize: '14px', marginBottom: '3px' }}>
                                  <strong>Depart:</strong> {step.transitDetails.stopDetails.departureStop.name}
                                  {step.transitDetails.stopDetails.departureTime && (
                                    <span style={{ marginLeft: '10px', color: '#666' }}>
                                      at {formatTime(step.transitDetails.stopDetails.departureTime)}
                                    </span>
                                  )}
                                </div>
                              )}
                              {step.transitDetails.stopDetails?.arrivalStop && (
                                <div style={{ fontSize: '14px' }}>
                                  <strong>Arrive:</strong> {step.transitDetails.stopDetails.arrivalStop.name}
                                  {step.transitDetails.stopDetails.arrivalTime && (
                                    <span style={{ marginLeft: '10px', color: '#666' }}>
                                      at {formatTime(step.transitDetails.stopDetails.arrivalTime)}
                                    </span>
                                  )}
                                </div>
                              )}
                              {step.transitDetails.stopCount && step.transitDetails.stopCount > 0 && (
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                                  {step.transitDetails.stopCount} stop{step.transitDetails.stopCount !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                {getTravelModeLabel(step.travelMode || step.travel_mode || 'WALKING')}
                                {step.duration && (
                                  <span style={{ marginLeft: '10px', fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                                    ({formatDuration(typeof step.duration === 'string' ? parseInt(step.duration.replace('s', '')) : step.duration)})
                                  </span>
                                )}
                              </div>
                              {step.instructions && (
                                <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                                  {step.instructions}
                                </div>
                              )}
                              {step.distanceMeters && (
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                                  {Math.round(step.distanceMeters)}m
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                      No step details available
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
