import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, getProfile } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const setUser = async (newUser) => {
    setUserState(newUser);
    if (newUser) {
      await AsyncStorage.setItem('userData', JSON.stringify(newUser));
    }
  };

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUserState(JSON.parse(storedUser));
        }
        try {
          const profileData = await getProfile(storedToken);
          if (profileData && profileData.user) {
            setUserState(profileData.user);
            await AsyncStorage.setItem('userData', JSON.stringify(profileData.user));
          }
        } catch (e) {
          console.log('[Auth] Token refresh error:', e.message);
        }
      }
    } catch (e) {
      console.log('[Auth] Load storage failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUser, passwordOrToken) => {
    if (typeof emailOrUser === 'object') {
      setUserState(emailOrUser);
      setToken(passwordOrToken);
      await AsyncStorage.setItem('userToken', passwordOrToken);
      await AsyncStorage.setItem('userData', JSON.stringify(emailOrUser));
      return { success: true, user: emailOrUser };
    }

    const data = await loginUser(emailOrUser, passwordOrToken);
    if (data.token && data.user) {
      setToken(data.token);
      setUserState(data.user);
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    throw new Error(data.message || 'Đăng nhập thất bại');
  };

  const register = async (name, email, phone, password) => {
    const data = await registerUser({ name, email, phone, password });
    if (data.token && data.user) {
      setToken(data.token);
      setUserState(data.user);
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: true, message: data.message };
  };

  const logout = async () => {
    setToken(null);
    setUserState(null);
    setWishlist([]);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  };

  const toggleWishlist = async (hotelId) => {
    if (user) {
      const currentWishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
      const updatedWishlist = currentWishlist.includes(hotelId)
        ? currentWishlist.filter((id) => id !== hotelId)
        : [...currentWishlist, hotelId];
      
      const updatedUser = { ...user, wishlist: updatedWishlist };
      setUserState(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  const updateAvatar = async (avatarUrl) => {
    if (user) {
      const updated = { ...user, avatar: avatarUrl };
      await setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        wishlist,
        login,
        register,
        logout,
        toggleWishlist,
        setUser,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
