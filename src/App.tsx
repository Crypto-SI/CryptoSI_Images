import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import ImageGenerator from './components/ImageGenerator';

function App() {
  return (
    <ChakraProvider>
      <ImageGenerator />
    </ChakraProvider>
  );
}

export default App; 