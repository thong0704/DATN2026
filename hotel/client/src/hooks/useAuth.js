import { useSelector } from 'react-redux';
import { selectCurrentUser, selectAccessToken } from '../features/auth/authSlice';

export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectAccessToken);
  return {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === 'admin',
    isManager: ['admin', 'manager'].includes(user?.role),
    isStaff: ['admin', 'manager', 'staff'].includes(user?.role),
  };
};
