export const getUserInitials = (
  user?: {
    nombres?: string | null;
    apellidos?: string | null;
    username?: string | null;
  } | null
): string => {
  if (!user) return 'U';
  const nombre = (user.nombres || '').trim();
  const apellido = (user.apellidos || '').trim();

  if (nombre && apellido) {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }
  if (nombre) {
    const parts = nombre.split(' ').filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return nombre.slice(0, 2).toUpperCase();
  }
  if (user.username) {
    return user.username.trim().slice(0, 2).toUpperCase();
  }
  return 'U';
};
