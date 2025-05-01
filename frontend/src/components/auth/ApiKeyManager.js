import React, { useState } from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Button, 
  TextInput, 
  Group, 
  Card, 
  Stack,
  ActionIcon,
  Tooltip,
  Modal,
  Badge,
  Code,
  Alert,
  Divider,
  Container,
  CopyButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { 
  IconKey, 
  IconTrash, 
  IconPlus, 
  IconCopy, 
  IconCheck,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

const KeyCard = ({ apiKey, onDelete }) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const lastUsed = apiKey.last_used_at 
    ? new Date(apiKey.last_used_at).toLocaleString() 
    : 'Never';
  
  const created = new Date(apiKey.created_at).toLocaleString();

  return (
    <>
      <Card withBorder p="md">
        <Group position="apart">
          <Group>
            <IconKey size={20} />
            <Text weight={500}>{apiKey.name}</Text>
          </Group>
          
          <Tooltip label="Delete API Key">
            <ActionIcon color="red" onClick={() => setDeleteModalOpen(true)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        
        <Text mt="xs" mb="md" size="sm" color="dimmed">
          Created: {created} | Last used: {lastUsed}
        </Text>
        
        <Group position="apart">
          <Code style={{ maxWidth: '85%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {apiKey.key}
          </Code>
          
          <CopyButton value={apiKey.key} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied' : 'Copy'}>
                <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
      </Card>
      
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete API Key"
      >
        <Text>Are you sure you want to delete this API key? This action cannot be undone.</Text>
        <Group position="right" mt="md">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button 
            color="red" 
            onClick={() => {
              onDelete(apiKey.id);
              setDeleteModalOpen(false);
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
};

const ApiKeyManager = () => {
  const { apiKeys, createApiKey, deleteApiKey } = useAuth();
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [error, setError] = useState(null);
  
  const form = useForm({
    initialValues: {
      name: '',
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'API Key name is required' : null),
    },
  });

  const handleCreateApiKey = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createApiKey(values.name);
      
      if (result.success) {
        form.reset();
        setCreateModalOpen(false);
      } else {
        setError(result.error || 'Failed to create API key');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('API key creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await deleteApiKey(keyId);
      
      if (!result.success) {
        setError(result.error || 'Failed to delete API key');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('API key deletion error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Paper p="md" withBorder>
        <Group position="apart" mb="md">
          <Title order={2}>API Keys</Title>
          <Button 
            leftIcon={<IconPlus size={16} />} 
            onClick={() => setCreateModalOpen(true)}
            loading={loading}
          >
            Create New API Key
          </Button>
        </Group>
        
        <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
          API keys are used to authenticate your requests to the Image Processing API. 
          Keep your API keys secure and do not share them publicly.
        </Alert>
        
        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}
        
        {apiKeys.length === 0 ? (
          <Text color="dimmed" align="center" my="xl">
            You don't have any API keys yet. Create one to get started.
          </Text>
        ) : (
          <Stack spacing="md">
            {apiKeys.map((apiKey) => (
              <KeyCard 
                key={apiKey.id} 
                apiKey={apiKey} 
                onDelete={handleDeleteApiKey} 
              />
            ))}
          </Stack>
        )}
      </Paper>
      
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New API Key"
      >
        <form onSubmit={form.onSubmit(handleCreateApiKey)}>
          <TextInput
            required
            label="API Key Name"
            placeholder="e.g., Development, Production"
            {...form.getInputProps('name')}
          />
          
          <Text size="xs" color="dimmed" mt="xs">
            Give your API key a descriptive name to help you identify its purpose.
          </Text>
          
          <Group position="right" mt="md">
            <Button variant="default" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create
            </Button>
          </Group>
        </form>
      </Modal>
    </Container>
  );
};

export default ApiKeyManager; 