import type { NextApiRequest, NextApiResponse } from 'next';
import { RouteFinder } from '../../lib/route-finder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { start_location, end_location } = req.query;

  if (!start_location || !end_location) {
    return res.status(400).json({ error: 'Missing required parameters: start_location and end_location' });
  }

  try {
    const route = await RouteFinder.call(
      start_location as string,
      end_location as string
    );
    res.status(200).json(route);
  } catch (error: any) {
    console.error('Error fetching route:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch route' });
  }
}
