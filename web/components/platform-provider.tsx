"use client";
import { createContext, useContext } from "react";
const defaults = {
  name: "YiEdu",
  logo_url: "/brand/yiedu-symbol.svg",
  color: "#205b4b",
};
const Context = createContext<any>(defaults);
export function PlatformProvider({
  appearance,
  children,
}: {
  appearance: any;
  children: React.ReactNode;
}) {
  return (
    <Context.Provider value={appearance || defaults}>
      {children}
    </Context.Provider>
  );
}
export const usePlatform = () => useContext(Context);
