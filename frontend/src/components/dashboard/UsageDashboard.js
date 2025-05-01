import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Container,
  Alert,
  Stack,
  Grid,
  Card,
  RingProgress,
  Loader,
  Center,
  SegmentedControl,
  NumberInput,
  Button,
} from '@mantine/core';
import { IconAlertCircle, IconResize, IconTextRecognition } from '@tabler/icons-react';
import imageService from '../../services/imageService';

const UsageDashboard = () => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const fetchUsageData = async (daysToFetch) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await imageService.getUsageStats(daysToFetch);
      
      if (result.success) {
        setUsageData(result.data);
      } else {
        setError(result.error || 'Failed to load usage data');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData(days);
  }, []);
  
  const handleDaysChange = () => {
    fetchUsageData(days);
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

  if (!usageData) {
    return (
      <Container size="md" py="xl">
        <Alert color="red">Failed to load usage data</Alert>
      </Container>
    );
  }
  
  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };
  
  // Calculate total usage
  const totalUsage = usageData.total_resize + usageData.total_ocr;
  const resizePercentage = totalUsage > 0 ? Math.round((usageData.total_resize / totalUsage) * 100) : 0;
  const ocrPercentage = totalUsage > 0 ? Math.round((usageData.total_ocr / totalUsage) * 100) : 0;

  return (
    <Container size="md" py="xl">
      <Group position="apart" mb="md">
        <Title order={2}>API Usage Dashboard</Title>
        
        <Group spacing="sm">
          <NumberInput
            label="Time period"
            value={days}
            onChange={(val) => setDays(val)}
            min={1}
            max={365}
            step={1}
            styles={{ input: { width: 80 } }}
          />
          <Button onClick={handleDaysChange} style={{ marginTop: 25 }}>
            Apply
          </Button>
        </Group>
      </Group>
      
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
          {error}
        </Alert>
      )}
      
      <Grid gutter="md">
        <Grid.Col md={4}>
          <Card withBorder p="md">
            <Group position="apart">
              <div>
                <Text size="xs" color="dimmed">
                  Total API Requests
                </Text>
                <Text size="xl" weight={700}>
                  {totalUsage}
                </Text>
              </div>
              <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={[
                  { value: resizePercentage, color: 'blue' },
                  { value: ocrPercentage, color: 'green' },
                ]}
                label={
                  <Text size="xs" align="center">
                    {totalUsage}
                  </Text>
                }
              />
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col md={4}>
          <Card withBorder p="md">
            <Group>
              <IconResize size={24} color="blue" />
              <div>
                <Text size="xs" color="dimmed">
                  Resize Operations
                </Text>
                <Text size="xl" weight={700}>
                  {usageData.total_resize}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col md={4}>
          <Card withBorder p="md">
            <Group>
              <IconTextRecognition size={24} color="green" />
              <div>
                <Text size="xs" color="dimmed">
                  OCR Operations
                </Text>
                <Text size="xl" weight={700}>
                  {usageData.total_ocr}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
      
      <Paper withBorder p="md" mt="xl">
        <Title order={4} mb="md">Daily Usage</Title>
        
        {usageData.daily_usage.length === 0 ? (
          <Text color="dimmed" align="center" my="md">
            No usage data available
          </Text>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Date</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Resize Operations</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>OCR Operations</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {usageData.daily_usage.map((day) => (
                  <tr key={day.date}>
                    <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                      {formatDate(day.date)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                      {day.resize_count}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                      {day.ocr_count}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                      {day.resize_count + day.ocr_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Paper>
    </Container>
  );
};

export default UsageDashboard; 