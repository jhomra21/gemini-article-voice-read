import { Hono } from 'hono';
import { createTursoClient } from './lib/turso';
import type { Song } from '../src/lib/types';

// Define the environment bindings type
type Bindings = {
  VITE_TURSO_DATABASE_URL: string;
  VITE_TURSO_AUTH_TOKEN: string;
};

const songs = new Hono<{ Bindings: Bindings }>();

// GET /songs - List all songs
songs.get('/', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const query = `
      SELECT s.*, a.title as album_title
      FROM songs s
      LEFT JOIN albums a ON s.album_id = a.id
      ORDER BY s.album_id, s.track_number ASC;
    `;
    const result = await turso.execute(query);

    const songs = result.rows.map(row => ({
      id: row.id as number,
      title: row.title as string,
      duration_seconds: row.duration_seconds as number,
      track_number: row.track_number as number,
      is_single: Boolean(row.is_single),
      album_id: row.album_id as number,
      album_title: row.album_title as string || null
    }));

    return c.json({ songs });
  } catch (error) {
    console.error('Error fetching songs:', error);
    return c.json({ error: 'Failed to fetch songs' }, 500);
  }
});

// GET /songs/:id - Get a single song
songs.get('/:id', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const id = c.req.param('id');
    
    const query = `
      SELECT s.*, a.title as album_title
      FROM songs s
      LEFT JOIN albums a ON s.album_id = a.id
      WHERE s.id = ?;
    `;
    
    const result = await turso.execute({ sql: query, args: [id] });

    if (result.rows.length === 0) {
      return c.json({ error: 'Song not found' }, 404);
    }

    const row = result.rows[0];
    const song = {
      id: row.id as number,
      title: row.title as string,
      duration_seconds: row.duration_seconds as number,
      track_number: row.track_number as number,
      is_single: Boolean(row.is_single),
      album_id: row.album_id as number,
      album_title: row.album_title as string || null
    };
    
    return c.json({ song });
  } catch (error) {
    console.error('Error fetching song:', error);
    return c.json({ error: 'Failed to fetch song' }, 500);
  }
});

// POST /songs - Create a new song
songs.post('/', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.title || body.duration_seconds === undefined || body.track_number === undefined) {
      return c.json({ 
        error: 'Title, duration_seconds, and track_number are required' 
      }, 400);
    }
    
    // If album_id is provided, check if the album exists
    if (body.album_id) {
      const checkAlbumQuery = 'SELECT id FROM albums WHERE id = ?';
      const albumResult = await turso.execute({ 
        sql: checkAlbumQuery, 
        args: [body.album_id] 
      });
      
      if (albumResult.rows.length === 0) {
        return c.json({ error: 'Album not found' }, 404);
      }
    }
    
    const query = `
      INSERT INTO songs (title, duration_seconds, track_number, is_single, album_id)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id, title, duration_seconds, track_number, is_single, album_id;
    `;
    
    const result = await turso.execute({
      sql: query,
      args: [
        body.title, 
        body.duration_seconds, 
        body.track_number, 
        body.is_single ? 1 : 0, 
        body.album_id || null
      ]
    });

    if (result.rows.length === 0) {
      return c.json({ error: 'Failed to create song' }, 500);
    }

    const row = result.rows[0];
    const newSong = {
      id: row.id as number,
      title: row.title as string,
      duration_seconds: row.duration_seconds as number,
      track_number: row.track_number as number,
      is_single: Boolean(row.is_single),
      album_id: row.album_id as number || null
    };
    
    // If song has an album, get the album title
    let albumTitle = null;
    if (newSong.album_id) {
      const albumQuery = 'SELECT title FROM albums WHERE id = ?';
      const albumResult = await turso.execute({
        sql: albumQuery,
        args: [newSong.album_id]
      });
      
      if (albumResult.rows.length > 0) {
        albumTitle = albumResult.rows[0].title as string;
      }
    }
    
    return c.json({
      song: {
        ...newSong,
        album_title: albumTitle
      }
    }, 201);
  } catch (error) {
    console.error('Error creating song:', error);
    return c.json({ error: 'Failed to create song' }, 500);
  }
});

// PUT /songs/:id - Update a song
songs.put('/:id', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.title || body.duration_seconds === undefined || body.track_number === undefined) {
      return c.json({ 
        error: 'Title, duration_seconds, and track_number are required' 
      }, 400);
    }
    
    // Check if song exists
    const checkQuery = 'SELECT id FROM songs WHERE id = ?';
    const checkResult = await turso.execute({ sql: checkQuery, args: [id] });
    
    if (checkResult.rows.length === 0) {
      return c.json({ error: 'Song not found' }, 404);
    }
    
    // If album_id is provided, check if the album exists
    if (body.album_id) {
      const checkAlbumQuery = 'SELECT id FROM albums WHERE id = ?';
      const albumResult = await turso.execute({ 
        sql: checkAlbumQuery, 
        args: [body.album_id] 
      });
      
      if (albumResult.rows.length === 0) {
        return c.json({ error: 'Album not found' }, 404);
      }
    }
    
    const query = `
      UPDATE songs 
      SET title = ?, duration_seconds = ?, track_number = ?, is_single = ?, album_id = ?
      WHERE id = ?
      RETURNING id, title, duration_seconds, track_number, is_single, album_id;
    `;
    
    const result = await turso.execute({
      sql: query,
      args: [
        body.title, 
        body.duration_seconds, 
        body.track_number, 
        body.is_single ? 1 : 0, 
        body.album_id || null,
        id
      ]
    });

    const row = result.rows[0];
    const updatedSong = {
      id: row.id as number,
      title: row.title as string,
      duration_seconds: row.duration_seconds as number,
      track_number: row.track_number as number,
      is_single: Boolean(row.is_single),
      album_id: row.album_id as number || null
    };
    
    // Get album title if there's an album_id
    let albumTitle = null;
    if (updatedSong.album_id) {
      const albumQuery = 'SELECT title FROM albums WHERE id = ?';
      const albumResult = await turso.execute({
        sql: albumQuery,
        args: [updatedSong.album_id]
      });
      
      if (albumResult.rows.length > 0) {
        albumTitle = albumResult.rows[0].title as string;
      }
    }
    
    return c.json({
      song: {
        ...updatedSong,
        album_title: albumTitle
      }
    });
  } catch (error) {
    console.error('Error updating song:', error);
    return c.json({ error: 'Failed to update song' }, 500);
  }
});

// DELETE /songs/:id - Delete a song
songs.delete('/:id', async (c) => {
  try {
    const turso = createTursoClient(c.env);
    const id = c.req.param('id');
    
    // Check if song exists
    const checkQuery = 'SELECT id FROM songs WHERE id = ?';
    const checkResult = await turso.execute({ sql: checkQuery, args: [id] });
    
    if (checkResult.rows.length === 0) {
      return c.json({ error: 'Song not found' }, 404);
    }
    
    // Delete the song
    await turso.execute({
      sql: 'DELETE FROM songs WHERE id = ?',
      args: [id]
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting song:', error);
    return c.json({ error: 'Failed to delete song' }, 500);
  }
});

export default songs; 