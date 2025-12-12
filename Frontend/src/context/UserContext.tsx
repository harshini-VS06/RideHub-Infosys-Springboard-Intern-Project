import { createContext, useContext, ReactNode } from 'react';
import { authService } from '../services/authService';

interface UserContextType {
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const logout = () => {
    authService.logout();
    window.location.href = '/';
  };

  return (
    <UserContext.Provider value={{ logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}