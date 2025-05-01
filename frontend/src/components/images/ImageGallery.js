import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Paper, 
  Title, 
  Text, 
  Button, 
  Grid, 
  Card, 
  Image,
  Container,
  Group,
  Badge,
  Alert,
  Loader,
  Center,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconPhoto, IconArrowRight, IconEye, IconResize, IconAlertCircle } from '@tabler/icons-react';
import imageService from '../../services/imageService';

const ImageCard = ({ image }) => {
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
    <Card withBorder p="md" radius="md">
      <Card.Section>
        <Image
          src={image.url}
          height={160}
          fit="cover"
          alt={image.original_filename}
        />
      </Card.Section>
      
      <Text weight={500} mt="md" lineClamp={1}>
        {image.original_filename}
      </Text>
      
      <Group position="apart" mt="xs">
        <Text size="xs" color="dimmed">
          Uploaded on {formattedDate}
        </Text>
        <Badge size="sm">{fileSize}</Badge>
      </Group>
      
      <Group position="apart" mt="md">
        <Group spacing="xs">
          {image.width && image.height && (
            <Badge size="sm" variant="outline">
              {image.width} × {image.height}
            </Badge>
          )}
        </Group>
        
        <Tooltip label="View Details">
          <ActionIcon component={Link} to={`/images/${image.id}`} color="blue">
            <IconEye size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Card>
  );
};

const ImageGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await imageService.getImages();
        
        if (result.success) {
          setImages(result.data);
        } else {
          setError(result.error || 'Failed to load images');
        }
      } catch (error) {
        setError('An unexpected error occurred');
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();
  }, []);

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Center style={{ minHeight: 200 }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Group position="apart" mb="md">
        <Title order={2}>My Images</Title>
        <Button component={Link} to="/upload" leftIcon={<IconPhoto size={16} />}>
          Upload New
        </Button>
      </Group>
      
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
          {error}
        </Alert>
      )}
      
      {images.length === 0 ? (
        <Paper p="md" withBorder>
          <Text align="center" my="xl" color="dimmed">
            You haven't uploaded any images yet.
          </Text>
          <Center>
            <Button component={Link} to="/upload" leftIcon={<IconPhoto size={16} />}>
              Upload Your First Image
            </Button>
          </Center>
        </Paper>
      ) : (
        <Grid>
          {images.map((image) => (
            <Grid.Col key={image.id} xs={12} sm={6} md={4}>
              <ImageCard image={image} />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ImageGallery; 