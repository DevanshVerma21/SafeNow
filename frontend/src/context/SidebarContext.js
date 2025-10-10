import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true); // Default open on desktop
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      
      // On mobile, sidebar should be closed by default
      // On desktop, sidebar should be open by default
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const openSidebar = () => {
    setIsOpen(true);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  // Legacy support
  const isCollapsed = !isOpen;
  const setIsCollapsed = (collapsed) => setIsOpen(!collapsed);

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      isMobile, 
      toggleSidebar, 
      openSidebar, 
      closeSidebar,
      // Legacy support
      isCollapsed,
      setIsCollapsed
    }}>
      {children}
    </SidebarContext.Provider>
  );
};