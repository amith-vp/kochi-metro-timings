import { useState, useEffect } from 'react';

const cache: Record<string, any> = {};

export function useFetchJsonData(filePath: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cache[filePath]) {
      setData(cache[filePath]);
    } else {
      fetch(filePath)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((jsonData) => {
          cache[filePath] = jsonData;
          setData(jsonData);
        })
        .catch((err) => {
          setError(err);
        });
    }
  }, [filePath]);

  return { data, error };
}
