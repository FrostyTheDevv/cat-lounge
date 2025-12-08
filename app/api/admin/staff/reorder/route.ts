import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(req);

    const { updates } = await req.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates array' }, { status: 400 });
    }

    const db = new Database(path.join(process.cwd(), 'catlounge.db'));

    try {
      // Begin transaction
      db.exec('BEGIN TRANSACTION');

      const updateStmt = db.prepare('UPDATE staff SET position_order = ? WHERE id = ?');

      for (const update of updates) {
        updateStmt.run(update.position_order, update.id);
      }

      db.exec('COMMIT');

      return NextResponse.json({ 
        success: true,
        message: `Updated ${updates.length} staff positions`
      });
    } catch (error: any) {
      db.exec('ROLLBACK');
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to update positions',
        details: error.message 
      }, { status: 500 });
    } finally {
      db.close();
    }
  } catch (error: any) {
    console.error('Error reordering staff:', error);
    return NextResponse.json({ 
      error: 'Failed to reorder staff',
      details: error.message 
    }, { status: 500 });
  }
}
