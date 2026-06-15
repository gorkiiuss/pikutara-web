import rateLimit from 'express-rate-limit';

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Muga gainditu duzu. Mesedez, itxaron pixka bat berriro saiatu aurretik.' }
});

export const voteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Muga gainditu duzu. Mesedez, itxaron pixka bat berriro saiatu aurretik.' }
});

export const songProposalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Muga gainditu duzu. Gehienez 5 abesti proposatu ditzakezu ordubetean.' },
  standardHeaders: true,
  legacyHeaders: false,
});
