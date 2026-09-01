import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export const downloadDatabase = (req: Request, res: Response) => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'DATABASE_URL is not set' });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${timestamp}.sql`;
  const filePath = path.join(process.cwd(), fileName);

  // Use pg_dump to create the backup
  const command = `pg_dump "${databaseUrl}" > "${filePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error during backup:', error);
      return res.status(500).json({ error: 'Failed to create database backup' });
    }

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Delete the file after it is downloaded to save space
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting backup file:', unlinkErr);
        }
      });
    });
  });
};
