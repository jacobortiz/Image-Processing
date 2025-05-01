import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, 
  Title, 
  Text, 
  Button, 
  Group, 
  Container,
  Alert,
  Stack,
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX, IconAlertCircle } from '@tabler/icons-react';
import imageService from '../../services/imageService';

const ImageUploader = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleDrop = async (files) => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Upload the first file
      const result = await imageService.uploadImage(files[0]);
      
      if (result.success) {
        // Navigate to the image detail page
        navigate(`/images/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to upload image. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Paper p="md" withBorder>
        <Title order={2} mb="md">Upload Image</Title>
        
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
            {error}
          </Alert>
        )}
        
        <Stack spacing="md">
          <Dropzone
            onDrop={handleDrop}
            onReject={(files) => setError('Invalid file. Only JPEG and PNG images are allowed.')}
            maxSize={5 * 1024 * 1024}
            accept={[MIME_TYPES.jpeg, MIME_TYPES.png]}
            loading={loading}
            disabled={loading}
            multiple={false}
          >
            <Group position="center" spacing="xl" style={{ minHeight: 180, pointerEvents: 'none' }}>
              <Dropzone.Accept>
                <IconUpload
                  size={50}
                  stroke={1.5}
                />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  size={50}
                  stroke={1.5}
                />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconPhoto
                  size={50}
                  stroke={1.5}
                />
              </Dropzone.Idle>

              <div>
                <Text size="xl" inline>
                  Drag an image here or click to select a file
                </Text>
                <Text size="sm" color="dimmed" inline mt={7}>
                  Attach a single image file (JPEG or PNG, up to 5MB)
                </Text>
              </div>
            </Group>
          </Dropzone>
          
          <Alert color="blue">
            <Stack spacing="xs">
              <Text weight={500}>Supported Features:</Text>
              <Text size="sm">• Resize images to your desired width</Text>
              <Text size="sm">• Extract text from images using OCR</Text>
            </Stack>
          </Alert>
        </Stack>
      </Paper>
    </Container>
  );
};

export default ImageUploader; 