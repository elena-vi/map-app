import { createMocks } from 'node-mocks-http';
import { getServerSideProps } from '../sitemap.xml';

describe('sitemap.xml', () => {
  it('should generate sitemap XML', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    const result = await getServerSideProps({ req, res } as any);

    expect(res._getHeaders()['content-type']).toBe('text/xml');
    expect(res._getData()).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(res._getData()).toContain('<urlset');
    expect(res._getData()).toContain('https://your-domain.com');
    expect(result.props).toEqual({});
  });

  it('should include all required URLs', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await getServerSideProps({ req, res } as any);

    const sitemap = res._getData();
    expect(sitemap).toContain('<loc>https://your-domain.com</loc>');
    expect(sitemap).toContain('<loc>https://your-domain.com/route</loc>');
  });

  it('should include lastmod dates', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await getServerSideProps({ req, res } as any);

    const sitemap = res._getData();
    expect(sitemap).toContain('<lastmod>');
  });

  it('should include priority and changefreq', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await getServerSideProps({ req, res } as any);

    const sitemap = res._getData();
    expect(sitemap).toContain('<priority>');
    expect(sitemap).toContain('<changefreq>');
  });
});
