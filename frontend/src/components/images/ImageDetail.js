import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Paper, 
  Title, 
  Text, 
  Button, 
  Group, 
  Container,
  Alert,
  Stack,
  Image as MantineImage,
  Tabs,
  TextInput,
  NumberInput,
  Divider,
  Grid,
  Card,
  Box,
  Textarea,
  Switch,
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPhoto, IconResize, IconTextRecognition, IconAlertCircle } from '@tabler/icons-react';
import imageService from '../../services/imageService';

const ImageDetail = () => {
  const { id } = useParams();
  const [image, setImage] = useState(null);
  const [resizedImage, setResizedImage] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resizeLoading, setResizeLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const resizeForm = useForm({
    initialValues: {
      width: 800,
      maintainAspectRatio: true,
    },
    validate: {
      width: (value) => (value < 10 || value > 4000 ? 'Width must be between 10 and 4000 pixels' : null),
    },
  });
  
  const ocrForm = useForm({
    initialValues: {
      lang: 'eng',
    },
  });

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await imageService.getImages();
        
        if (result.success) {
          const foundImage = result.data.find(img => img.id === parseInt(id));
          if (foundImage) {
            setImage(foundImage);
          } else {
            setError('Image not found');
          }
        } else {
          setError(result.error || 'Failed to load image');
        }
      } catch (error) {
        setError('An unexpected error occurred');
        console.error('Error fetching image:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchImage();
  }, [id]);

  const handleResize = async (values) => {
    setResizeLoading(true);
    setError(null);
    
    try {
      const result = await imageService.resizeImage(
        parseInt(id),
        values.width,
        values.maintainAspectRatio
      );
      
      if (result.success) {
        setResizedImage(result.data);
      } else {
        setError(result.error || 'Failed to resize image');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error resizing image:', error);
    } finally {
      setResizeLoading(false);
    }
  };

  const handleOCR = async (values) => {
    setOcrLoading(true);
    setError(null);
    
    try {
      const result = await imageService.extractText(
        parseInt(id),
        values.lang
      );
      
      if (result.success) {
        setExtractedText(result.data);
      } else {
        setError(result.error || 'Failed to extract text');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error extracting text:', error);
    } finally {
      setOcrLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Center style={{ minHeight: 200 }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!image) {
    return (
      <Container size="md" py="xl">
        <Alert color="red">Image not found</Alert>
        <Button component={Link} to="/images" mt="md">
          Back to Images
        </Button>
      </Container>
    );
  }

  // Format the date
  const formattedDate = new Date(image.created_at).toLocaleDateString();
  
  // Generate a human-readable file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const fileSize = formatFileSize(image.size_bytes);

  return (
    <Container size="lg" py="xl">
      <Group position="apart" mb="md">
        <Title order={2}>Image Details</Title>
        <Button component={Link} to="/images" variant="default">
          Back to Images
        </Button>
      </Group>
      
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
          {error}
        </Alert>
      )}
      
      <Grid gutter="md">
        <Grid.Col md={6}>
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">{image.original_filename}</Title>
            <MantineImage
              src={image.url}
              radius="md"
              alt={image.original_filename}
              style={{ maxWidth: '100%' }}
            />
            <Group position="apart" mt="md">
              <Text size="sm">Uploaded on {formattedDate}</Text>
              <Text size="sm">Size: {fileSize}</Text>
            </Group>
            {image.width && image.height && (
              <Text size="sm" mt="xs">
                Dimensions: {image.width} × {image.height} pixels
              </Text>
            )}
          </Paper>
        </Grid.Col>
        
        <Grid.Col md={6}>
          <Tabs defaultValue="resize">
            <Tabs.List>
              <Tabs.Tab value="resize" icon={<IconResize size={14} />}>Resize</Tabs.Tab>
              <Tabs.Tab value="ocr" icon={<IconTextRecognition size={14} />}>OCR</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="resize" pt="md">
              <Paper p="md" withBorder>
                <Title order={4} mb="md">Resize Image</Title>
                
                <form onSubmit={resizeForm.onSubmit(handleResize)}>
                  <NumberInput
                    label="Width (pixels)"
                    required
                    min={10}
                    max={4000}
                    {...resizeForm.getInputProps('width')}
                  />
                  
                  <Switch
                    label="Maintain aspect ratio"
                    checked={resizeForm.values.maintainAspectRatio}
                    onChange={(event) => resizeForm.setFieldValue('maintainAspectRatio', event.currentTarget.checked)}
                    mt="md"
                  />
                  
                  <Button 
                    type="submit" 
                    mt="md" 
                    loading={resizeLoading}
                    leftIcon={<IconResize size={16} />}
                  >
                    Resize
                  </Button>
                </form>
                
                {resizedImage && (
                  <Box mt="xl">
                    <Divider my="md" label="Resized Image" labelPosition="center" />
                    <MantineImage
                      src={resizedImage.url}
                      radius="md"
                      alt="Resized image"
                      caption={`Resized to ${resizedImage.width} × ${resizedImage.height} pixels`}
                    />
                  </Box>
                )}
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="ocr" pt="md">
              <Paper p="md" withBorder>
                <Title order={4} mb="md">Extract Text (OCR)</Title>
                
                <form onSubmit={ocrForm.onSubmit(handleOCR)}>
                  <TextInput
                    label="Language"
                    description="Language code (e.g., 'eng' for English)"
                    placeholder="eng"
                    {...ocrForm.getInputProps('lang')}
                  />
                  
                  <Button 
                    type="submit" 
                    mt="md" 
                    loading={ocrLoading}
                    leftIcon={<IconTextRecognition size={16} />}
                  >
                    Extract Text
                  </Button>
                </form>
                
                {extractedText && (
                  <Box mt="xl">
                    <Divider my="md" label="Extracted Text" labelPosition="center" />
                    <Textarea
                      value={extractedText.text}
                      readOnly
                      minRows={8}
                      autosize
                    />
                  </Box>
                )}
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default ImageDetail; 