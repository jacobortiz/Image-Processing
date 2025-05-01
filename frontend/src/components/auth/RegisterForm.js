import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Group, 
  Box, 
  Title, 
  Text,
  Paper,
  Container,
  Anchor,
  Divider,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm = () => {
  const { register, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 8 ? 'Password must be at least 8 characters' : null),
      confirmPassword: (value, values) => 
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      // Register the user
      const result = await register(values.email, values.password);
      
      if (result.success) {
        setSuccess(true);
        
        // Automatically log in the user
        const loginResult = await login(values.email, values.password);
        
        if (loginResult.success) {
          navigate('/');
        } else {
          // If auto-login fails, redirect to login page
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" my={40}>
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} align="center" mb="md">
          Create New Account
        </Title>
        
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert color="green" mb="md">
            Registration successful! Logging you in...
          </Alert>
        )}
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            required
            label="Email"
            placeholder="your@email.com"
            {...form.getInputProps('email')}
          />
          
          <PasswordInput
            required
            label="Password"
            placeholder="Your password"
            mt="md"
            {...form.getInputProps('password')}
          />
          
          <PasswordInput
            required
            label="Confirm Password"
            placeholder="Confirm your password"
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />
          
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Register
          </Button>
        </form>
        
        <Divider my="md" label="Already have an account?" labelPosition="center" />
        
        <Group position="center" mt="md">
          <Anchor component={Link} to="/login" underline={false}>
            <Button variant="subtle">
              Login instead
            </Button>
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
};

export default RegisterForm; 