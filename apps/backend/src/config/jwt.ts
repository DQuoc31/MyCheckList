export const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'mychecklist_secret_jwt_key_2026';
};

export const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || '7d';
};
