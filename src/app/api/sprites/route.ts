import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const CHARACTERS_DIR = path.join(ROOT_DIR, 'public', 'art', 'characters');
const AVATARS_DIR = path.join(ROOT_DIR, 'public', 'art', 'avatars');
const MANIFEST_PATH = path.join(ROOT_DIR, 'src', 'art', 'manifest.json');

export async function GET() {
  try {
    let manifest: any = null;
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }

    // Scan actual files on disk
    const characters: Record<string, any[]> = {};
    if (fs.existsSync(CHARACTERS_DIR)) {
      const charDirs = fs.readdirSync(CHARACTERS_DIR).filter((d) => {
        return fs.statSync(path.join(CHARACTERS_DIR, d)).isDirectory();
      });

      for (const charId of charDirs) {
        const charPath = path.join(CHARACTERS_DIR, charId);
        const files = fs.readdirSync(charPath).filter((f) => f.endsWith('.png'));
        characters[charId] = [];

        for (const f of files) {
          const filePath = path.join(charPath, f);
          try {
            const meta = await sharp(filePath).metadata();
            characters[charId].push({
              id: charId,
              filename: f,
              path: `/art/characters/${charId}/${f}`,
              width: meta.width || 0,
              height: meta.height || 0
            });
          } catch {
            characters[charId].push({
              id: charId,
              filename: f,
              path: `/art/characters/${charId}/${f}`,
              width: 0,
              height: 0
            });
          }
        }

        // Sort files (pose-1..4 or idle, crouch, jump, wave)
        characters[charId].sort((a, b) => a.filename.localeCompare(b.filename));
      }
    }

    const avatars: any[] = [];
    if (fs.existsSync(AVATARS_DIR)) {
      const files = fs.readdirSync(AVATARS_DIR).filter((f) => f.endsWith('.png'));
      for (const f of files) {
        const filePath = path.join(AVATARS_DIR, f);
        try {
          const meta = await sharp(filePath).metadata();
          avatars.push({
            filename: f,
            path: `/art/avatars/${f}`,
            width: meta.width || 0,
            height: meta.height || 0
          });
        } catch {
          avatars.push({
            filename: f,
            path: `/art/avatars/${f}`,
            width: 0,
            height: 0
          });
        }
      }
      avatars.sort((a, b) => a.filename.localeCompare(b.filename));
    }

    return NextResponse.json({
      success: true,
      characters,
      avatars,
      manifest
    });
  } catch (err: any) {
    console.error('Error in GET /api/sprites:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { characterRenames = [], avatarRenames = [] } = body;

    // Process character file renames
    // Use two-phase rename via temp names to avoid collisions (e.g. pose-1 -> idle, pose-2 -> crouch)
    const charPhase1: { oldPath: string; tempPath: string; finalPath: string; id: string; newTag: string }[] = [];

    for (const item of characterRenames) {
      const { id, oldFilename, newName } = item;
      if (!id || !oldFilename || !newName) continue;

      const targetFilename = newName.endsWith('.png') ? newName : `${newName}.png`;
      if (oldFilename === targetFilename) continue;

      const dir = path.join(CHARACTERS_DIR, id);
      const oldPath = path.join(dir, oldFilename);
      const tempPath = path.join(dir, `__temp_${Date.now()}_${Math.random().toString(36).substring(7)}.png`);
      const finalPath = path.join(dir, targetFilename);

      if (fs.existsSync(oldPath)) {
        charPhase1.push({ oldPath, tempPath, finalPath, id, newTag: newName.replace('.png', '') });
      }
    }

    // Phase 1a: move to temp
    for (const p of charPhase1) {
      fs.renameSync(p.oldPath, p.tempPath);
    }
    // Phase 1b: move temp to final
    for (const p of charPhase1) {
      if (fs.existsSync(p.finalPath)) {
        fs.unlinkSync(p.finalPath);
      }
      fs.renameSync(p.tempPath, p.finalPath);
    }

    // Process avatar renames
    const avatarPhase1: { oldPath: string; tempPath: string; finalPath: string; newTag: string }[] = [];
    for (const item of avatarRenames) {
      const { oldFilename, newName } = item;
      if (!oldFilename || !newName) continue;

      const targetFilename = newName.endsWith('.png') ? newName : `${newName}.png`;
      if (oldFilename === targetFilename) continue;

      const oldPath = path.join(AVATARS_DIR, oldFilename);
      const tempPath = path.join(AVATARS_DIR, `__temp_${Date.now()}_${Math.random().toString(36).substring(7)}.png`);
      const finalPath = path.join(AVATARS_DIR, targetFilename);

      if (fs.existsSync(oldPath)) {
        avatarPhase1.push({ oldPath, tempPath, finalPath, newTag: newName.replace('.png', '') });
      }
    }

    // Phase 2a: move to temp
    for (const p of avatarPhase1) {
      fs.renameSync(p.oldPath, p.tempPath);
    }
    // Phase 2b: move temp to final
    for (const p of avatarPhase1) {
      if (fs.existsSync(p.finalPath)) {
        fs.unlinkSync(p.finalPath);
      }
      fs.renameSync(p.tempPath, p.finalPath);
    }

    // Build updated manifest
    const manifest: any = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      characters: {},
      avatars: {}
    };

    if (fs.existsSync(CHARACTERS_DIR)) {
      const charDirs = fs.readdirSync(CHARACTERS_DIR).filter((d) =>
        fs.statSync(path.join(CHARACTERS_DIR, d)).isDirectory()
      );

      for (const charId of charDirs) {
        manifest.characters[charId] = {};
        const charPath = path.join(CHARACTERS_DIR, charId);
        const files = fs.readdirSync(charPath).filter((f) => f.endsWith('.png'));

        for (const f of files) {
          const key = f.replace('.png', '');
          manifest.characters[charId][key] = `/art/characters/${charId}/${f}`;
        }
      }
    }

    if (fs.existsSync(AVATARS_DIR)) {
      const files = fs.readdirSync(AVATARS_DIR).filter((f) => f.endsWith('.png'));
      for (const f of files) {
        const key = f.replace('.png', '');
        manifest.avatars[key] = `/art/avatars/${f}`;
      }
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Đã lưu tên và cập nhật manifest.json thành công!',
      manifest
    });
  } catch (err: any) {
    console.error('Error in POST /api/sprites:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
