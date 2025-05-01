import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Button,
  Paper,
  Grid,
  Group,
  ThemeIcon,
  Stack,
} from '@mantine/core';
import { 
  IconUpload, 
  IconPhoto, 
  IconKey, 
  IconResize, 
  IconTextRecognition,
  IconArrowRight,
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

const FeatureCard = ({ icon, title, description, to }) => {
  return (
    <Paper withBorder p="md" radius="md">
      <Group mb="xs">
        <ThemeIcon size="lg" radius="md" variant="light">
          {icon}
        </ThemeIcon>
        <Text size="lg" weight={500}>{title}</Text>
      </Group>
      
      <Text size="sm" color="dimmed" mb="md">
        {description}
      </Text>
      
      <Button 
        component={Link} 
        to={to} 
        variant="subtle" 
        rightIcon={<IconArrowRight size={16} />}
        fullWidth
      >
        Get Started
      </Button>
    </Paper>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  
  return (
    <Container size="md" py="xl">
      <Title order={1} align="center" mb="sm">Welcome to Image Processing SaaS</Title>
      <Text align="center" color="dimmed" mb="xl">
        A powerful toolkit for your image processing needs
      </Text>
      
      <Grid gutter="md">
        <Grid.Col md={4}>
          <FeatureCard 
            icon={<IconUpload size={24} />}
            title="Upload Images"
            description="Upload your JPEG or PNG images securely to our platform."
            to="/upload"
          />
        </Grid.Col>
        
        <Grid.Col md={4}>
          <FeatureCard 
            icon={<IconResize size={24} />}
            title="Resize Images"
            description="Easily resize your images to your desired dimensions."
            to="/images"
          />
        </Grid.Col>
        
        <Grid.Col md={4}>
          <FeatureCard 
            icon={<IconTextRecognition size={24} />}
            title="Extract Text"
            description="Extract text from images using our OCR technology."
            to="/images"
          />
        </Grid.Col>
      </Grid>
      
      <Paper withBorder p="md" mt="xl">
        <Title order={3} mb="md">API Integration</Title>
        <Text mb="md">
          Integrate our image processing capabilities into your own applications 
          using our easy-to-use API.
        </Text>
        
        <Group position="right">
          <Button 
            component={Link} 
            to="/api-keys" 
            leftIcon={<IconKey size={16} />}
          >
            Manage API Keys
          </Button>
        </Group>
      </Paper>
    </Container>
  );
};

export default HomePage; 