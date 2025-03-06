import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  Image,
  Text,
  Center,
  Spinner,
  useToast,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Textarea,
  Grid,
  GridItem,
  Divider,
  Collapse,
  Input,
  Switch,
  Tooltip,
} from '@chakra-ui/react';
import axios from 'axios';

const API_KEY = process.env.VITE_HYPERBOLIC_API_KEY;
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const API_ENDPOINT = 'https://api.hyperbolic.xyz/v1/image/generation';

const CONTROLNET_MODELS = {
  'SDXL-ControlNet': ['canny', 'softedge', 'depth', 'openpose'],
  'SD1.5-ControlNet': ['canny', 'softedge', 'depth', 'openpose'],
};

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [modelName, setModelName] = useState('SDXL1.0-base');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7.5);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [controlnetName, setControlnetName] = useState('canny');
  const [controlnetImage, setControlnetImage] = useState<string | null>(null);
  const [enableRefiner, setEnableRefiner] = useState(false);
  const [useCommonNegatives, setUseCommonNegatives] = useState(false);
  const [initImage, setInitImage] = useState<string | null>(null);
  const [temperature, setTemperature] = useState(0.3);
  const toast = useToast();

  const commonNegativePrompts = "worst quality, low quality, blurry, pixelated, jpeg artifacts, low resolution, bad anatomy, deformed, extra limbs, missing arms, fused fingers, mutated hands, poorly drawn face, out of frame, cropped, poorly drawn hands, distorted, asymmetrical, text, watermark, signature, logo, username, overexposed, underexposed, oversaturated, unnatural colors, cartoon, ugly, boring";

  const handleCommonNegativesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseCommonNegatives(e.target.checked);
    if (e.target.checked) {
      setNegativePrompt(commonNegativePrompts);
    } else {
      setNegativePrompt('');
    }
  };

  const isControlNetModel = modelName.includes('ControlNet');
  const isFluxModel = modelName === 'FLUX.1-dev';
  const isSDXLModel = modelName === 'SDXL1.0-base' || modelName === 'SDXL-turbo';

  const handleControlnetImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setControlnetImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInitImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image(0, 0);
        img.onload = () => {
          // Set width and height to match the uploaded image
          setWidth(img.width);
          setHeight(img.height);
          setInitImage(reader.result as string);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImage = async () => {
    if (!prompt) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isControlNetModel && !controlnetImage) {
      toast({
        title: 'Error',
        description: 'Please upload a reference image for ControlNet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!API_KEY) {
      toast({
        title: 'Error',
        description: 'API key is not configured',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isFluxModel && negativePrompt) {
      toast({
        title: 'Warning',
        description: 'Flux model does not support negative prompts. The negative prompt will be ignored.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }

    setIsLoading(true);
    try {
      const requestBody: any = {
        model_name: modelName,
        prompt,
        height,
        width,
        steps,
        cfg_scale: cfgScale,
        backend: 'auto',
      };

      // Add init_image for Flux if provided
      if (isFluxModel && initImage) {
        const base64Data = initImage.split(',')[1];
        requestBody.init_image = base64Data;
        requestBody.temperature = temperature;
        // Add debug logging
        console.log('Request body:', {
          ...requestBody,
          init_image: base64Data.substring(0, 50) + '...' // Log just the start of the base64 data
        });
      }

      // Only add negative_prompt if not using Flux
      if (!isFluxModel && negativePrompt) {
        requestBody.negative_prompt = negativePrompt;
      }

      if (isControlNetModel) {
        requestBody.controlnet_name = controlnetName;
        requestBody.controlnet_image = controlnetImage?.split(',')[1]; // Remove data URL prefix
      }

      const response = await axios.post(
        `${CORS_PROXY}${API_ENDPOINT}`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin,
          },
        }
      );

      if (response.data && response.data.images && response.data.images[0]) {
        const imageData = response.data.images[0].image;
        setGeneratedImage(`data:image/jpeg;base64,${imageData}`);
        
        toast({
          title: 'Success',
          description: 'Image generated successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate image. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, blue.50, gray.50)"
      py={4}
    >
      <Container maxW="container.xl" h="100vh">
        <Grid templateColumns="400px 1fr" gap={6} h="100%">
          {/* Left Panel - Controls */}
          <GridItem 
            overflowY="auto" 
            pr={4}
            bg="whiteAlpha.800"
            borderRadius="lg"
            p={6}
            boxShadow="sm"
            backdropFilter="blur(10px)"
          >
            <VStack spacing={6} align="stretch">
              <Box>
                <Image
                  src="/logo.png"
                  alt="CryptoSI Logo"
                  height="60px"
                  mb={4}
                />
                <Heading size="lg">CryptoSI Images</Heading>
              </Box>

              <Divider />

              <FormControl>
                <FormLabel>Model</FormLabel>
                <Select value={modelName} onChange={(e) => setModelName(e.target.value)}>
                  <option value="SDXL1.0-base">Stable Diffusion XL 1.0 (Newest)</option>
                  <option value="SDXL-turbo">SDXL-Turbo (Fast)</option>
                  <option value="SD2">Stable Diffusion v2</option>
                  <option value="SD1.5">Stable Diffusion v1.5</option>
                  <option value="SSD">Segmind Stable Diffusion 1B</option>
                  <option value="SDXL-ControlNet">SDXL1.0-base + ControlNet</option>
                  <option value="SD1.5-ControlNet">SD1.5 + ControlNet</option>
                  <option value="FLUX.1-dev">Flux 1.0 (Experimental)</option>
                </Select>
              </FormControl>

              <Collapse in={isControlNetModel}>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>ControlNet Type</FormLabel>
                    <Select 
                      value={controlnetName} 
                      onChange={(e) => setControlnetName(e.target.value)}
                    >
                      {CONTROLNET_MODELS[modelName as keyof typeof CONTROLNET_MODELS]?.map((model) => (
                        <option key={model} value={model}>
                          {model.charAt(0).toUpperCase() + model.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Reference Image</FormLabel>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleControlnetImageUpload}
                    />
                    {controlnetImage && (
                      <Box mt={2}>
                        <Image
                          src={controlnetImage}
                          alt="Reference image"
                          maxH="200px"
                          objectFit="contain"
                          borderRadius="md"
                        />
                      </Box>
                    )}
                  </FormControl>
                </VStack>
              </Collapse>

              <Collapse in={isSDXLModel}>
                <FormControl display="flex" alignItems="center">
                  <Tooltip label="Enables a second pass refinement step that can improve image quality and details. May increase generation time.">
                    <FormLabel mb="0" cursor="help">Enable Refiner</FormLabel>
                  </Tooltip>
                  <Switch
                    isChecked={enableRefiner}
                    onChange={(e) => setEnableRefiner(e.target.checked)}
                  />
                </FormControl>
              </Collapse>

              <Collapse in={isFluxModel}>
                <FormControl>
                  <FormLabel>Image to Image (Not Working)</FormLabel>
                  <Box position="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleInitImageUpload}
                      display="none"
                      id="init-image-upload"
                    />
                    <Button
                      as="label"
                      htmlFor="init-image-upload"
                      colorScheme="blue"
                      variant="outline"
                      width="full"
                      cursor="pointer"
                      mb={2}
                      _hover={{
                        bg: "blue.50",
                        borderColor: "blue.400",
                      }}
                    >
                      Choose Image
                    </Button>
                  </Box>
                  {initImage && (
                    <>
                      <Box 
                        position="relative" 
                        width="100%" 
                        height="200px" 
                        borderRadius="md" 
                        overflow="hidden"
                        boxShadow="sm"
                        mb={4}
                      >
                        <Image
                          src={initImage}
                          alt="Initial image"
                          objectFit="contain"
                          width="100%"
                          height="100%"
                        />
                        <Button
                          size="sm"
                          colorScheme="red"
                          position="absolute"
                          top={2}
                          right={2}
                          onClick={() => setInitImage(null)}
                        >
                          ×
                        </Button>
                      </Box>
                      <FormControl>
                        <Tooltip label="Controls how closely the generated image follows the initial image. Lower values (closer to 0) create images more similar to the initial image, higher values allow more creative variations.">
                          <FormLabel cursor="help">Temperature</FormLabel>
                        </Tooltip>
                        <Box display="flex" alignItems="center" gap={4}>
                          <input
                            type="range"
                            min="0"
                            max="0.5" // Reduced max value
                            step="0.01" // Smaller step size for finer control
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            style={{ flex: 1 }}
                          />
                          <Text width="40px" textAlign="right">{temperature.toFixed(2)}</Text>
                        </Box>
                      </FormControl>
                    </>
                  )}
                </FormControl>
              </Collapse>

              <FormControl>
                <FormLabel>Prompt</FormLabel>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  size="md"
                  rows={3}
                />
              </FormControl>

              <Collapse in={!isFluxModel}>
                <FormControl>
                  <FormLabel>Negative Prompt (Optional)</FormLabel>
                  <Box mb={2}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0" cursor="pointer">
                        <input
                          type="checkbox"
                          checked={useCommonNegatives}
                          onChange={handleCommonNegativesChange}
                          style={{ marginRight: '8px' }}
                        />
                        Most common
                      </FormLabel>
                    </FormControl>
                  </Box>
                  <Textarea
                    value={negativePrompt}
                    onChange={(e) => {
                      setNegativePrompt(e.target.value);
                      setUseCommonNegatives(e.target.value === commonNegativePrompts);
                    }}
                    placeholder="Describe what you don't want in the image..."
                    size="md"
                    rows={2}
                  />
                </FormControl>
              </Collapse>

              <Box display="flex" gap={4}>
                <FormControl>
                  <FormLabel>Width</FormLabel>
                  <NumberInput value={width} onChange={(_, value) => setWidth(value)} min={512} max={2048} step={64}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Height</FormLabel>
                  <NumberInput value={height} onChange={(_, value) => setHeight(value)} min={512} max={2048} step={64}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </Box>

              <Box display="flex" gap={4}>
                <FormControl>
                  <FormLabel>Steps</FormLabel>
                  <NumberInput value={steps} onChange={(_, value) => setSteps(value)} min={1} max={150} step={1}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>CFG Scale</FormLabel>
                  <NumberInput value={cfgScale} onChange={(_, value) => setCfgScale(value)} min={1} max={20} step={0.5}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </Box>

              <Button
                colorScheme="blue"
                size="lg"
                width="full"
                onClick={generateImage}
                isLoading={isLoading}
              >
                Generate Image
              </Button>
            </VStack>
          </GridItem>

          {/* Right Panel - Canvas */}
          <GridItem 
            bg="whiteAlpha.800"
            borderRadius="lg" 
            p={4} 
            overflowY="auto"
            boxShadow="sm"
            backdropFilter="blur(10px)"
          >
            <Center h="100%" flexDirection="column">
              {isLoading ? (
                <Spinner size="xl" />
              ) : generatedImage ? (
                <Box
                  maxW="100%"
                  maxH="100%"
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="lg"
                  bg="white"
                  p={2}
                >
                  <Image
                    src={generatedImage}
                    alt="Generated image"
                    maxW="100%"
                    maxH="calc(100vh - 48px)"
                    objectFit="contain"
                  />
                </Box>
              ) : (
                <Text color="gray.500" fontSize="lg">
                  Generated images will appear here
                </Text>
              )}
            </Center>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default ImageGenerator; 