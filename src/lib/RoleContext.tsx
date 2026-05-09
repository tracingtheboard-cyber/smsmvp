'use client';

import React, { createContext, useContext, useState } from 'react';

export type Role = 'systemadmin' | 'admissionstaff' | 'registrar';

interface RoleContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  canEditCurriculum: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('systemadmin');

  // Helper boolean: only admins and registrars can edit courses/intakes
  const canEditCurriculum = currentRole === 'systemadmin' || currentRole === 'registrar';

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, canEditCurriculum }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
