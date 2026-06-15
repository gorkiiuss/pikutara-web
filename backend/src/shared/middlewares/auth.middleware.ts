import { Request, Response, NextFunction } from 'express';
import basicAuth from 'basic-auth';
import { get } from '../database.js';
import { verifyPassword } from '../helpers.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const credentials = basicAuth(req);
  if (!credentials) {
    res.set('WWW-Authenticate', 'Basic realm="Pikutara Admin"');
    return res.status(401).send('Baimena behar da.');
  }

  try {
    const dbUser = await get('SELECT * FROM users WHERE username = ?', [credentials.name]);
    if (dbUser && verifyPassword(credentials.pass, dbUser.salt, dbUser.password_hash)) {
      req.user = dbUser; // Attach user to request
      return next();
    }
  } catch (err) {
    console.error('Auth verification error:', err);
  }

  res.set('WWW-Authenticate', 'Basic realm="Pikutara Admin"');
  return res.status(401).send('Erabiltzaile edo pasahitz okerra.');
};
