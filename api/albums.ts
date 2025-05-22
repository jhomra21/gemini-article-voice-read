import { Hono } from 'hono';
import { createTursoClient } from './lib/turso';
import type { Album, Song } from '../src/lib/types';

// Define the environment bindings type
type Bindings = {
  VITE_TURSO_DATABASE_URL: string;
  VITE_TURSO_AUTH_TOKEN: string;
};

const albums = new Hono<{ Bindings: Bindings }>();

// Helper function to map database rows to TypeScript objects
const mapRowToSong = (row: any): Song => ({
  id: row.s_id as number,
  title: row.s_title as string,
  duration_seconds: row.duration_seconds as number,
  track_number: row.track_number as number,
  is_single: Boolean(row.is_single),
  album_id: row.album_id as number,
});

const mapRowToAlbum = (row: any, songs: Song[]): Album => ({
  id: row.a_id as number,
  title: row.a_title as string,
  release_date: row.release_date as string,
  coverart_url: row.coverart_url as string,
  is_published: Boolean(row.is_published),
  songs: songs.filter(song => song.album_id === (row.a_id as number)),
});

// GET /albums - List all albums
albums.get('/', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const query = `
      SELECT
        a.id AS a_id,
        a.title AS a_title,
        a.release_date,
        a.coverart_url,
        a.is_published,
        s.id AS s_id,
        s.title AS s_title,
        s.duration_seconds,
        s.track_number,
        s.is_single,
        s.album_id
      FROM albums a
      LEFT JOIN songs s ON a.id = s.album_id
      ORDER BY a.release_date DESC, s.track_number ASC;
    `;
    const result = await turso.execute(query);

    if (result.rows.length === 0) {
      return c.json({ albums: [] });
    }

    const songsMap = new Map<number, Song[]>();
    result.rows.forEach(row => {
      if (row.s_id !== null) {
        const song = mapRowToSong(row);
        const albumSongs = songsMap.get(song.album_id) || [];
        albumSongs.push(song);
        songsMap.set(song.album_id, albumSongs);
      }
    });

    const uniqueAlbumRows = result.rows.filter((row, index, self) =>
      index === self.findIndex((r) => r.a_id === row.a_id)
    );

    const albums = uniqueAlbumRows.map(row =>
      mapRowToAlbum(row, songsMap.get(row.a_id as number) || [])
    );

    return c.json({ albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return c.json({ error: 'Failed to fetch albums' }, 500);
  }
});

// GET /albums/:id - Get a single album with its songs
albums.get('/:id', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const id = c.req.param('id');
    
    const query = `
      SELECT
        a.id AS a_id,
        a.title AS a_title,
        a.release_date,
        a.coverart_url,
        a.is_published,
        s.id AS s_id,
        s.title AS s_title,
        s.duration_seconds,
        s.track_number,
        s.is_single,
        s.album_id
      FROM albums a
      LEFT JOIN songs s ON a.id = s.album_id
      WHERE a.id = ?
      ORDER BY s.track_number ASC;
    `;
    
    const result = await turso.execute({ sql: query, args: [id] });

    if (result.rows.length === 0) {
      return c.json({ error: 'Album not found' }, 404);
    }

    const songs: Song[] = [];
    result.rows.forEach(row => {
      if (row.s_id !== null) {
        songs.push(mapRowToSong(row));
      }
    });

    const album = mapRowToAlbum(result.rows[0], songs);
    
    return c.json({ album });
  } catch (error) {
    console.error('Error fetching album:', error);
    return c.json({ error: 'Failed to fetch album' }, 500);
  }
});

// POST /albums - Create a new album
albums.post('/', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.title || !body.release_date) {
      return c.json({ error: 'Title and release date are required' }, 400);
    }
    
    const query = `
      INSERT INTO albums (title, release_date, coverart_url, is_published)
      VALUES (?, ?, ?, ?)
      RETURNING id, title, release_date, coverart_url, is_published;
    `;
    
    const result = await turso.execute({
      sql: query,
      args: [body.title, body.release_date, body.coverart_url || null, body.is_published ? 1 : 0]
    });

    if (result.rows.length === 0) {
      return c.json({ error: 'Failed to create album' }, 500);
    }

    const newAlbum = {
      id: result.rows[0].id as number,
      title: result.rows[0].title as string,
      release_date: result.rows[0].release_date as string,
      coverart_url: result.rows[0].coverart_url as string || null,
      is_published: Boolean(result.rows[0].is_published),
      songs: []
    };
    
    return c.json({ album: newAlbum }, 201);
  } catch (error) {
    console.error('Error creating album:', error);
    return c.json({ error: 'Failed to create album' }, 500);
  }
});

// PUT /albums/:id - Update an album
albums.put('/:id', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.title || !body.release_date) {
      return c.json({ error: 'Title and release date are required' }, 400);
    }
    
    // Check if album exists
    const checkQuery = 'SELECT id FROM albums WHERE id = ?';
    const checkResult = await turso.execute({ sql: checkQuery, args: [id] });
    
    if (checkResult.rows.length === 0) {
      return c.json({ error: 'Album not found' }, 404);
    }
    
    const query = `
      UPDATE albums 
      SET title = ?, release_date = ?, coverart_url = ?, is_published = ?
      WHERE id = ?
      RETURNING id, title, release_date, coverart_url, is_published;
    `;
    
    const result = await turso.execute({
      sql: query,
      args: [body.title, body.release_date, body.coverart_url || null, body.is_published ? 1 : 0, id]
    });

    // Fetch songs for the album
    const songsQuery = 'SELECT * FROM songs WHERE album_id = ?';
    const songsResult = await turso.execute({ sql: songsQuery, args: [id] });
    
    const songs = songsResult.rows.map(row => ({
      id: row.id as number,
      title: row.title as string,
      duration_seconds: row.duration_seconds as number,
      track_number: row.track_number as number,
      is_single: Boolean(row.is_single),
      album_id: row.album_id as number
    }));

    const updatedAlbum = {
      id: result.rows[0].id as number,
      title: result.rows[0].title as string,
      release_date: result.rows[0].release_date as string,
      coverart_url: result.rows[0].coverart_url as string || null,
      is_published: Boolean(result.rows[0].is_published),
      songs
    };
    
    return c.json({ album: updatedAlbum });
  } catch (error) {
    console.error('Error updating album:', error);
    return c.json({ error: 'Failed to update album' }, 500);
  }
});

// DELETE /albums/:id - Delete an album
albums.delete('/:id', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const id = c.req.param('id');
    
    // Check if album exists
    const checkQuery = 'SELECT id FROM albums WHERE id = ?';
    const checkResult = await turso.execute({ sql: checkQuery, args: [id] });
    
    if (checkResult.rows.length === 0) {
      return c.json({ error: 'Album not found' }, 404);
    }
    
    // Delete associated songs first (cascading delete)
    await turso.execute({
      sql: 'DELETE FROM songs WHERE album_id = ?',
      args: [id]
    });
    
    // Delete the album
    await turso.execute({
      sql: 'DELETE FROM albums WHERE id = ?',
      args: [id]
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting album:', error);
    return c.json({ error: 'Failed to delete album' }, 500);
  }
});

export default albums; 