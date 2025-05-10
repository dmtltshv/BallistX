import { createContext, useContext, useState } from 'react';

const ResultsContext = createContext();

export const ResultsProvider = ({ children }) => {
  const [results, setResults] = useState([]);
  return (
    <ResultsContext.Provider value={{ results, setResults }}>
      {children}
    </ResultsContext.Provider>
  );
};

export const useResults = () => useContext(ResultsContext);
