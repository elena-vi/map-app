import type { NextApiRequest, NextApiResponse } from 'next';
import { LocationFinder } from '../../lib/location-finder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { destination, currentLocation } = req.query;

  if (!destination) {
    return res.status(400).json({ error: 'Missing required parameter: destination' });
  }

  try {
    const locations = await LocationFinder.call(
      destination as string,
      currentLocation as string | undefined
    );
    res.status(200).json(locations);
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch locations' });
  }
}
